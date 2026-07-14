import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateGoldenWindows } from "@/utils/goldenWindowCalc";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { genAI, callGemini } from "@/utils/geminiCall";
import { schema2, schema3, schema4 } from "@/constants/aiSchemas";
import {
  BASE_SYSTEM_INSTRUCTION,
  SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
  SYSTEM_INSTRUCTION_COMPATIBILITY,
  buildPrompt2,
  buildPrompt3,
  buildPrompt4
} from "@/constants/aiPrompts";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

export const processPremiumAnalysis = inngest.createFunction(
  {
    id: "process-premium-analysis",
    triggers: [{ event: "analysis.premium.requested" }],
    onFailure: async ({ event, error }) => {
      const originalEvent = event.data.event;
      const { jobId, customerEmail, paymentKey } = originalEvent.data;

      console.error(`[Inngest Failure] JobId: ${jobId}, Error:`, error);

      // 1. 상태를 failed로 업데이트
      await supabaseAdmin
        .from("premium_analysis_jobs")
        .update({ status: "failed" })
        .eq("id", jobId);

      // 2. 토스페이먼츠 자동 환불 처리
      if (paymentKey && process.env.TOSS_SECRET_KEY) {
        try {
            const secretKey = process.env.TOSS_SECRET_KEY;
            const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");
            
            const cancelRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${encryptedSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cancelReason: "AI 분석 서버 오류로 인한 자동 환불" }),
            });
            
            if (!cancelRes.ok) {
                const cancelData = await cancelRes.json();
                console.error(`[Auto Refund Failed] JobId: ${jobId}, Reason:`, cancelData);
            } else {
                console.log(`[Auto Refund Success] JobId: ${jobId}, PaymentKey: ${paymentKey}`);
            }
        } catch (err) {
            console.error(`[Auto Refund Error] JobId: ${jobId}`, err);
        }
      }

      // 3. 실패 안내 및 자동 환불 알림 메일 발송
      if (customerEmail) {
          const htmlMessage = `
            <h2>[다시, 우리] 분석 중단 안내</h2>
            <p>죄송합니다.</p>
            <p>AI 심층 분석 중 예기치 못한 서버 오류가 발생하여 분석이 중단되었습니다.</p>
            <p>결제하신 금액은 전액 자동 환불 처리되었습니다. (카드사 사정에 따라 영업일 기준 3~5일 소요될 수 있습니다)</p>
            <br/>
            <p>잠시 후 다시 시도해 주시기 바랍니다. 불편을 드려 대단히 죄송합니다.</p>
          `;
          
          if (process.env.NODE_ENV === "development") {
              console.log("[로컬 개발 모드] 실패 알림 메일 발송 생략\n", htmlMessage);
          } else {
              try {
                  await resend.emails.send({
                      from: "다시,우리 <support@dasisaju.com>",
                      to: customerEmail,
                      subject: "[다시, 우리] 분석 오류 및 환불 안내",
                      html: htmlMessage,
                  });
              } catch (emailErr) {
                  console.error("실패 메일 발송 에러:", emailErr);
              }
          }
      }
    }
  },
  async ({ event, step }: { event: any, step: any }) => {
    const { jobId, customerEmail, raw_data } = event.data;

    // 1. 상태 업데이트
    await step.run("update-status-processing", async () => {
      await supabaseAdmin
        .from("premium_analysis_jobs")
        .update({ status: "processing" })
        .eq("id", jobId);
    });

    // 2. Gemini AI 분석 (메인 작업)
    const aiResult = await step.run("analyze-with-gemini", async () => {
      const {
        myRawInput, partnerRawInput, liteResult,
        myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
        metDate, breakupDate, breakupReason, months = 6
      } = raw_data;

      // --- 2-1. 만세력, 궁합, 골든 윈도우 계산 ---
      const result = calculateGoldenWindows(myDayGan, myDayZhi, partnerDayGan, partnerDayZhi, months);

      const myBazi = calculateBazi(
        myRawInput.gender, myRawInput.calendarType,
        myRawInput.birthYear, myRawInput.birthMonth, myRawInput.birthDay,
        myRawInput.birthCity, myRawInput.birthHour || '', myRawInput.birthMinute || '',
        myRawInput.isTimeUnknown, myRawInput.birthTimezone, myRawInput.birthLongitude
      );
      const partnerBazi = calculateBazi(
        partnerRawInput.gender, partnerRawInput.calendarType,
        partnerRawInput.birthYear, partnerRawInput.birthMonth, partnerRawInput.birthDay,
        partnerRawInput.birthCity, partnerRawInput.birthHour || '', partnerRawInput.birthMinute || '',
        partnerRawInput.isTimeUnknown, partnerRawInput.birthTimezone, partnerRawInput.birthLongitude
      );
      const compatibility = calculateCompatibility(myBazi, partnerBazi);

      // --- 2-2. AI 모델 준비 ---
      const model2 = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: "application/json", responseSchema: schema2 }
      });

      const model3 = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
        generationConfig: { responseMimeType: "application/json", responseSchema: schema3 }
      });

      // --- 2-3. 프롬프트 생성 ---
      // 골든윈도우 계산 요약을 공통 컨텍스트에 주입 — 심층 분석(prompt2)의 시기 언급이
      // 캘린더(prompt3 산출물)와 어긋나지 않도록 같은 결정론 결과에 고정한다.
      const goldenList = result.windows.filter(w => w.isGolden).map(w => `${w.year}년 ${w.month}월`);
      const goldenWindowSummary = result.bestMonth
        ? `- 연락 최적기(향후 ${months}개월 중 최고점): ${result.bestMonth.year}년 ${result.bestMonth.month}월 (에너지 ${result.bestMonth.score}점)${goldenList.length > 1 ? `\n- 그 외 좋은 달: ${goldenList.join(', ')}` : ''}`
        : undefined;

      const promptCtx = {
        myRawInput, partnerRawInput, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
        metDate, breakupDate, breakupReason,
        goldenWindowSummary,
      };

      const prompt2 = buildPrompt2(promptCtx, liteResult?.secretTeaser);

      const windowSummary = result.windows.map(w =>
        `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden}): ${w.reasons.join(', ')}`
      ).join('\n');

      const prompt3 = buildPrompt3({
        myName: myRawInput.name, myGender: myRawInput.gender,
        partnerName: partnerRawInput.name, partnerGender: partnerRawInput.gender,
        myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
        windowSummary, metDate, breakupDate, breakupReason
      });

      // --- 2-4. 병렬 AI 호출 (prompt2 + prompt3 + 조건부 prompt4) ---
      // 핵심 유료 콘텐츠(prompt2/prompt3)는 실패 시 throw하여 스텝을 실패시킨다.
      // → Inngest 재시도 후에도 실패하면 onFailure가 자동 환불을 태운다.
      // (예전엔 .catch(()=>{})로 빈 리포트를 completed 저장 + 완료메일까지 보내 자동환불을 우회했음)
      let parsedData2: any = { details: [] };
      let parsedData3: any = { monthlyEnergies: [], roadmapStages: [], goldenWindowMonths: [] };
      let compatibilityReport: any = null;

      const [data2, data3] = await Promise.all([
        // 1) 재회 심층 분석 + 공략 매뉴얼 (핵심 상품)
        callGemini(model2, prompt2),

        // 2) 골든 윈도우 + 로드맵 (핵심 상품)
        callGemini(model3, prompt3),

        // 3) 궁합 리포트 (signature 패키지만) — 결제한 상품이므로 실패 시에도 throw
        (async () => {
          if (raw_data.packageId === 'signature') {
            const model4 = genAI.getGenerativeModel({
              model: "gemini-3.5-flash",
              systemInstruction: SYSTEM_INSTRUCTION_COMPATIBILITY,
              generationConfig: { responseMimeType: "application/json", responseSchema: schema4 }
            });
            const prompt4 = buildPrompt4(promptCtx);
            compatibilityReport = await callGemini(model4, prompt4);
          }
        })()
      ]);
      parsedData2 = data2 || parsedData2;
      parsedData3 = data3 || parsedData3;

      // 핵심 콘텐츠가 비었으면 실패로 간주 (빈 리포트를 유료 완료로 저장하지 않음)
      if (!parsedData2?.details?.length) {
        throw new Error("프리미엄 심층 분석(details) 생성 실패 — 자동 환불 대상");
      }

      // --- 2-5. 최종 병합 ---
      const liteDetails = liteResult.details || [];
      const premiumDetails = parsedData2.details || [];

      return {
        ...liteResult,
        details: [...liteDetails, ...premiumDetails],
        partnerManual: parsedData2.partnerManual || null,
        goldenWindows: {
          windows: result.windows,
          bestMonth: result.bestMonth,
          worstMonth: result.worstMonth,
          monthlyEnergies: parsedData3.monthlyEnergies,
          roadmapStages: parsedData3.roadmapStages,
          goldenWindowMonths: parsedData3.goldenWindowMonths || []
        },
        compatibilityReport
      };
    });

    // 3. 분석 결과 DB 저장
    await step.run("save-result-to-supabase", async () => {
      const { error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .update({
          status: "completed",
          ai_result: aiResult
        })
        .eq("id", jobId);

      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message);
      }
    });

    // 4. 이메일 완료 알림
    await step.run("send-completion-email", async () => {
      if (!customerEmail) {
        console.log("이메일이 없습니다. 발송 생략.");
        return { success: true, message: "No email, skipped." };
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || "http://localhost:3000";
      const resultUrl = `${baseUrl}/result/${jobId}`;

      const htmlMessage = `
        <h2>[다시, 우리] 분석 완료 안내</h2>
        <p>프리미엄 재회 분석 리포트가 완성되었습니다!</p>
        <p>상대방의 속마음과 재회 전략, 그리고 연락하기 가장 좋은 '골든 윈도우' 날짜를 지금 바로 확인해 보세요.</p>
        <br/>
        <a href="${resultUrl}" style="display:inline-block; padding:12px 24px; background-color:#f59e0b; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">👉 결과 확인하기</a>
        <br/><br/>
        <p style="font-size:12px; color:#6b7280;">본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0 16px;"/>
        <p style="font-size:13px; color:#4b5563; line-height:1.7;">
          <strong>P.S.</strong> 골든 윈도우까지 기다리는 동안, 그 사람의 '지금 마음'이 궁금해질 때가 있을 거예요.<br/>
          마음은 매일 움직입니다 — 7장의 타로 카드가 오늘의 마음을 읽어드립니다.
        </p>
        <a href="${baseUrl}/tarot" style="font-size:13px; color:#6B3FA8; font-weight:bold;">→ 오늘 그 사람의 마음 보기 (첫 리딩 무료)</a>
      `;

      if (process.env.NODE_ENV === "development") {
        console.log("=========================================");
        console.log("[로컬 개발 모드] 실제 이메일은 발송되지 않습니다.");
        console.log("받는 사람:", customerEmail);
        console.log("메시지 내용:\n", htmlMessage);
        console.log("=========================================");
        return { success: true, jobId };
      }

      try {
        await resend.emails.send({
          from: "다시,우리 <support@dasisaju.com>",
          to: customerEmail,
          subject: "🔮 프리미엄 재회 분석 리포트가 도착했습니다!",
          html: htmlMessage,
        });
        console.log(`[다시, 우리] 이메일 발송 성공: ${customerEmail}`);
      } catch (error: any) {
        console.error("Resend 이메일 발송 에러:", error);
      }
    });

    return { success: true, jobId };
  }
);
