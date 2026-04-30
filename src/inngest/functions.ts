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
import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

export const processPremiumAnalysis = inngest.createFunction(
  {
    id: "process-premium-analysis",
    triggers: [{ event: "analysis.premium.requested" }]
  },
  async ({ event, step }: { event: any, step: any }) => {
    const { jobId, phone_number, raw_data } = event.data;

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
        model: "gemini-3.1-pro-preview",
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: "application/json", responseSchema: schema2 }
      });

      const model3 = genAI.getGenerativeModel({
        model: "gemini-3.1-pro-preview",
        systemInstruction: SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
        generationConfig: { responseMimeType: "application/json", responseSchema: schema3 }
      });

      // --- 2-3. 프롬프트 생성 ---
      const promptCtx = {
        myRawInput, partnerRawInput, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
        metDate, breakupDate, breakupReason
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
      let parsedData2: any = { details: [] };
      let parsedData3: any = { monthlyEnergies: [], roadmapStages: [], goldenWindowMonths: [] };
      let compatibilityReport: any = null;

      await Promise.all([
        // 1) 재회 심층 분석 + 공략 매뉴얼
        callGemini(model2, prompt2).then(data => { parsedData2 = data; }).catch(() => {}),

        // 2) 골든 윈도우 + 로드맵
        callGemini(model3, prompt3).then(data => { parsedData3 = data; }).catch(() => {}),

        // 3) 궁합 리포트 (premium 패키지만)
        (async () => {
          if (raw_data.packageId === 'premium') {
            const model4 = genAI.getGenerativeModel({
              model: "gemini-3.1-pro-preview",
              systemInstruction: SYSTEM_INSTRUCTION_COMPATIBILITY,
              generationConfig: { responseMimeType: "application/json", responseSchema: schema4 }
            });
            const prompt4 = buildPrompt4(promptCtx);
            try {
              compatibilityReport = await callGemini(model4, prompt4);
            } catch { /* 궁합 실패 시 null 유지 */ }
          }
        })()
      ]);

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

    // 4. SMS 완료 알림
    await step.run("send-completion-sms", async () => {
      if (!phone_number) {
        console.log("전화번호가 없습니다. (로그인 유저) SMS 발송 생략.");
        return { success: true, message: "No phone number, skipped SMS." };
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || "http://localhost:3000";
      const resultUrl = `${baseUrl}/result/${jobId}`;

      const message = `[다시, 우리]
프리미엄 재회 분석 리포트가 완성되었습니다!

상대방의 속마음과 재회 전략, 그리고 연락하기 가장 좋은 '골든 윈도우' 날짜를 지금 바로 확인해 보세요.

👉 결과 확인하기:
${resultUrl}

본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다.`;

      if (process.env.NODE_ENV === "development") {
        console.log("=========================================");
        console.log("[로컬 개발 모드] 실제 LMS SMS는 발송되지 않습니다.");
        console.log("받는 사람:", phone_number);
        console.log("메시지 내용:\n", message);
        console.log("=========================================");
        return { success: true, jobId };
      }

      try {
        await messageService.send([{
          to: phone_number,
          from: process.env.SOLAPI_SENDER_NUMBER!,
          text: message,
          type: "LMS"
        }]);
        console.log(`[다시, 우리] SMS 발송 성공: ${phone_number}`);
      } catch (error: any) {
        console.error("Solapi SMS 발송 에러:", error.message);
        if (error.failedMessageList) {
          console.error("실패 상세 사유:", JSON.stringify(error.failedMessageList, null, 2));
        } else {
          console.error("에러 객체:", error);
        }
      }
    });

    return { success: true, jobId };
  }
);
