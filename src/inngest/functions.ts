import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateGoldenWindows, calculateGoldenDates } from "@/utils/goldenWindowCalc";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility, calculateHapScores, hapGradeFromScore, hapStarsFromScore } from "@/utils/compatibilityCalc";
import { callTerra } from "@/utils/openaiCall";
import {
  BASE_SYSTEM_INSTRUCTION,
  SYSTEM_INSTRUCTION_LITE,
  SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
  SYSTEM_INSTRUCTION_COMPATIBILITY,
  SYSTEM_INSTRUCTION_HAP,
  buildPrompt1,
  buildPrompt2,
  buildPrompt3,
  buildPrompt4,
  buildPromptHap
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

    // 1.5 운명의 합(궁합 단독 상품, packageId: 'compatibility') — 재회 파이프라인과 분리된 전용 경로.
    // liteResult·골든윈도우·prompt1~3에 의존하지 않으며, 실패 시 throw → onFailure 자동 환불 재사용.
    if (raw_data?.packageId === 'compatibility') {
      const hapAiResult = await step.run("analyze-hap-report", async () => {
        const { myRawInput, partnerRawInput } = raw_data;

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
        const hapScores = calculateHapScores(compatibility);

        const report = await callTerra(SYSTEM_INSTRUCTION_HAP, buildPromptHap({
          myRawInput, partnerRawInput, myBazi, partnerBazi,
          compatibilityPromptSummary: compatibility.promptSummary,
          hapScores,
        }), 32768);

        // 핵심 콘텐츠가 비면 실패로 간주 (빈 리포트를 유료 완료로 저장하지 않음)
        if (!report?.part1?.firstImpression || !report?.final?.finalReview) {
          throw new Error("운명의 합 리포트 생성 실패 — 자동 환불 대상");
        }

        // 점수·등급·별점은 시스템 계산값으로 확정 (AI 인플레 방지)
        const gradeTable = [
          { area: '연애', score: hapScores.romance, grade: hapGradeFromScore(hapScores.romance) },
          { area: '결혼', score: hapScores.marriage, grade: hapGradeFromScore(hapScores.marriage) },
          { area: '재물', score: hapScores.wealth, grade: hapGradeFromScore(hapScores.wealth) },
          { area: '성격', score: hapScores.personality, grade: hapGradeFromScore(hapScores.personality) },
          { area: '가정', score: hapScores.family, grade: hapGradeFromScore(hapScores.family) },
          { area: '소통', score: hapScores.communication, grade: hapGradeFromScore(hapScores.communication) },
        ];

        return {
          tier: 'premium', packageId: 'compatibility',
          hapReport: report,
          hapScores, gradeTable,
          totalGrade: hapGradeFromScore(hapScores.total),
          stars: hapStarsFromScore(hapScores.total),
          myManseryeok: myBazi.manseryeok, partnerManseryeok: partnerBazi.manseryeok,
          myOhhaeng: myBazi.ohhaengCounts, partnerOhhaeng: partnerBazi.ohhaengCounts,
          compatibility: {
            reunionScore: compatibility.reunionScore,
            attractionScore: compatibility.attractionScore,
            conflictScore: compatibility.conflictScore,
            complementScore: compatibility.complementScore,
            hapList: compatibility.hapList,
            chungList: compatibility.chungList,
            hyeongList: compatibility.hyeongList,
            haeList: compatibility.haeList,
            dayMasterRelation: compatibility.dayMasterRelation,
            spouseHouseRelation: compatibility.spouseHouseRelation,
            ohhaengAnalysis: compatibility.ohhaengAnalysis,
          },
        };
      });

      await step.run("save-hap-result", async () => {
        const { error } = await supabaseAdmin
          .from("premium_analysis_jobs")
          .update({ status: "completed", ai_result: hapAiResult })
          .eq("id", jobId);
        if (error) throw new Error(error.message);
      });

      await step.run("send-hap-completion-email", async () => {
        if (!customerEmail) return { success: true, message: "No email, skipped." };

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || "http://localhost:3000";
        const resultUrl = `${baseUrl}/hap/result/${jobId}`;

        const htmlMessage = `
          <h2>[운명의 합] 궁합 리포트 완성 안내</h2>
          <p>두 분의 궁합 리포트가 완성되었습니다.</p>
          <p>첫 만남의 설계도부터 연애의 실전, 함께 만드는 생활, 그리고 최종 판정까지 — 지금 바로 확인해 보세요.</p>
          <br/>
          <a href="${resultUrl}" style="display:inline-block; padding:12px 24px; background-color:#D8485E; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">👉 궁합 리포트 확인하기</a>
          <br/><br/>
          <p style="font-size:12px; color:#6b7280;">본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다.</p>
        `;

        if (process.env.NODE_ENV === "development") {
          console.log("[로컬 개발 모드] 운명의 합 완료 메일 발송 생략:", customerEmail, resultUrl);
          return { success: true, jobId };
        }
        try {
          await resend.emails.send({
            from: "운명의 합 <support@dasisaju.com>",
            to: customerEmail,
            subject: "💞 두 분의 궁합 리포트가 완성되었습니다",
            html: htmlMessage,
          });
        } catch (error: any) {
          console.error("Resend 이메일 발송 에러:", error);
        }
      });

      return { success: true, jobId };
    }

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

      // --- 2-2. AI 모델: GPT-5.6 Terra (2026-07 모델 비교 후 전환) ---
      // 토큰 한도는 한국어 리포트가 잘리지 않게 여유 있게 — 잘림(finish_reason=length)은
      // callTerra가 재시도하고, 최종 실패 시 스텝 실패 → 자동 환불 경로.

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

      // --- 2-3-a. 라이트 결과 검증/폴백 ---
      // liteResult는 클라이언트를 경유하므로 유실·훼손될 수 있다. 필수 필드가 없으면
      // 서버에서 같은 프롬프트(buildPrompt1)로 재생성해 유료 리포트 결손을 막는다.
      let lite: any = liteResult;
      const liteValid = !!(lite?.secretTeaser && lite?.essenceAnalysis?.content
        && Array.isArray(lite?.details) && lite.details.length > 0 && lite?.myManseryeok);
      if (!liteValid) {
        console.warn("[Inngest] 클라이언트 liteResult 불완전 — 서버에서 라이트 분석 재생성");
        const d1 = await callTerra(SYSTEM_INSTRUCTION_LITE, buildPrompt1(promptCtx), 8192);
        const details1: any[] = d1?.details || [];
        const ei = details1.findIndex((d: any) => typeof d?.title === 'string' && d.title.includes('[본질]'));
        const pick = ei >= 0 ? ei : 0;
        lite = {
          reunionKeyword: d1?.reunionKeyword, reunionScore: d1?.reunionScore,
          summary: d1?.summary, secretTeaser: d1?.secretTeaser,
          essenceAnalysis: details1[pick] || null,
          details: details1.filter((_: any, i: number) => i !== pick),
          myManseryeok: myBazi.manseryeok, partnerManseryeok: partnerBazi.manseryeok,
          myOhhaeng: myBazi.ohhaengCounts, partnerOhhaeng: partnerBazi.ohhaengCounts,
          compatibility: {
            reunionScore: compatibility.reunionScore,
            attractionScore: compatibility.attractionScore,
            conflictScore: compatibility.conflictScore,
            complementScore: compatibility.complementScore,
            hapList: compatibility.hapList,
            chungList: compatibility.chungList,
            hyeongList: compatibility.hyeongList,
            haeList: compatibility.haeList,
            dayMasterRelation: compatibility.dayMasterRelation,
            spouseHouseRelation: compatibility.spouseHouseRelation,
            ohhaengAnalysis: compatibility.ohhaengAnalysis,
          },
          goldenWindows: null, tier: 'premium',
        };
      }

      const prompt2 = buildPrompt2(promptCtx, lite?.secretTeaser);

      // --- 2-3-b. 캘린더 선(先)확정: 달 = 계산 최고점, 날짜 = 일진 기반 길일 ---
      // AI 호출 전에 확정해 prompt3(로드맵·월별 에너지)에 주입한다 — 로드맵이
      // 최적기 달에 "노컨택"을 배치하는 정면 모순을 막기 위함.
      let goldenWindowMonths: any[] = [];
      let bestWindowSummary: string | undefined;
      if (result.bestMonth) {
        const goldenDates = calculateGoldenDates(
          result.bestMonth.year, result.bestMonth.month,
          myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
        );
        if (goldenDates.length > 0) {
          goldenWindowMonths = [{
            month: `${result.bestMonth.year}년 ${result.bestMonth.month}월`,
            goodDates: goldenDates.map(d => d.day),
            // 피할 날은 의도적으로 비움 — 행동을 바꾸지 않는 부정 정보는 불안·리스크만 추가 (제품 결정)
            badDates: [],
            // 일진 근거 보존 — 캘린더 아래 "이 날이 좋은 이유"로 노출됨
            dateDetails: goldenDates.map(d => ({ day: d.day, ganzhi: `${d.dayGan}${d.dayZhi}`, reasons: d.reasons })),
          }];
          bestWindowSummary = `${result.bestMonth.year}년 ${result.bestMonth.month}월 (길일: ${goldenDates.map(d => `${d.day}일`).join(', ')})`;
        } else {
          bestWindowSummary = `${result.bestMonth.year}년 ${result.bestMonth.month}월`;
        }
      }

      const windowSummary = result.windows.map(w =>
        `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden ? '예' : '아니오'}): ${w.reasons.join(', ')}`
      ).join('\n');

      const prompt3 = buildPrompt3({
        myName: myRawInput.name, myGender: myRawInput.gender,
        partnerName: partnerRawInput.name, partnerGender: partnerRawInput.gender,
        myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
        mySipsin: myBazi.sipsinSummary, partnerSipsin: partnerBazi.sipsinSummary,
        windowSummary, bestWindowSummary, metDate, breakupDate, breakupReason
      });

      // --- 2-4. 병렬 AI 호출 (prompt2 + prompt3 + 조건부 prompt4) ---
      // 핵심 유료 콘텐츠(prompt2/prompt3)는 실패 시 throw하여 스텝을 실패시킨다.
      // → Inngest 재시도 후에도 실패하면 onFailure가 자동 환불을 태운다.
      // (예전엔 .catch(()=>{})로 빈 리포트를 completed 저장 + 완료메일까지 보내 자동환불을 우회했음)
      let parsedData2: any = { details: [] };
      let parsedData3: any = { monthlyEnergies: [], roadmapStages: [] };
      let compatibilityReport: any = null;

      const [data2, data3] = await Promise.all([
        // 1) 재회 심층 분석 + 공략 매뉴얼 (핵심 상품)
        callTerra(BASE_SYSTEM_INSTRUCTION, prompt2, 16384),

        // 2) 골든 윈도우 + 로드맵 (핵심 상품)
        callTerra(SYSTEM_INSTRUCTION_GOLDEN_WINDOW, prompt3, 16384),

        // 3) 궁합 리포트 (signature 패키지만) — 결제한 상품이므로 실패 시에도 throw
        (async () => {
          if (raw_data.packageId === 'signature') {
            const prompt4 = buildPrompt4(promptCtx);
            compatibilityReport = await callTerra(SYSTEM_INSTRUCTION_COMPATIBILITY, prompt4, 32768);
          }
        })()
      ]);
      parsedData2 = data2 || parsedData2;
      parsedData3 = data3 || parsedData3;

      // 핵심 콘텐츠가 비었으면 실패로 간주 (빈 리포트를 유료 완료로 저장하지 않음)
      if (!parsedData2?.details?.length) {
        throw new Error("프리미엄 심층 분석(details) 생성 실패 — 자동 환불 대상");
      }
      // 개수·구성 이상은 실패는 아니지만 프롬프트 일탈 신호이므로 로그로 감시
      if (parsedData2.details.length !== 8) {
        console.warn(`[Inngest] 심층 분석 개수 이상: ${parsedData2.details.length}개 (기대 8개)`);
      }
      if (parsedData3?.monthlyEnergies?.length && parsedData3.monthlyEnergies.length !== 6) {
        console.warn(`[Inngest] 월별 에너지 개수 이상: ${parsedData3.monthlyEnergies.length}개 (기대 6개)`);
      }

      // --- 2-5. 최종 병합 (캘린더는 2-3-b에서 이미 확정) ---
      const liteDetails = lite.details || [];
      const premiumDetails = parsedData2.details || [];

      return {
        ...lite,
        details: [...liteDetails, ...premiumDetails],
        partnerManual: parsedData2.partnerManual || null,
        goldenWindows: {
          windows: result.windows,
          bestMonth: result.bestMonth,
          monthlyEnergies: parsedData3.monthlyEnergies,
          roadmapStages: parsedData3.roadmapStages,
          goldenWindowMonths
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
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0 16px;"/>
        <p style="font-size:13px; color:#4b5563; line-height:1.7;">
          리포트가 도움이 되셨다면, 결과 페이지 맨 아래에서 별점 하나만 남겨주세요.<br/>
          감사의 마음으로 <strong>다음 이용 시 쓸 수 있는 20% 할인 코드</strong>를 바로 드립니다 🙏
        </p>
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
