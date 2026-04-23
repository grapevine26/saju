import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateGoldenWindows } from "@/utils/goldenWindowCalc";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";

// Solapi SDK (공식 패키지가 solapi 모듈이거나 직접 fetch 가능, 여기서는 fetch를 이용하거나 solapi 모듈 사용)
// solapi 패키지를 설치했다면:
import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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

    // 2. Gemini 호출 및 파싱 (가장 긴 작업, Inngest가 관리)
    const aiResult = await step.run("analyze-with-gemini", async () => {
      const {
        myRawInput, partnerRawInput, liteResult,
        myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
        metDate, breakupDate, breakupReason, months = 6
      } = raw_data;

      const result = calculateGoldenWindows(myDayGan, myDayZhi, partnerDayGan, partnerDayZhi, months);

      // --- 2-1. 만세력 및 궁합 데이터 계산 ---
      const myBazi = calculateBazi(
          myRawInput.gender, myRawInput.calendarType,
          myRawInput.birthYear, myRawInput.birthMonth, myRawInput.birthDay,
          myRawInput.birthCity, myRawInput.birthHour || '', myRawInput.birthMinute || '',
          myRawInput.isTimeUnknown, myRawInput.birthTimezone, myRawInput.birthLongitude
      );
      const partnerBazi = calculateBazi(
          partnerRawInput.gender, partnerRawInput.calendarType,
          partnerRawInput.birthYear, partnerRawInput.birthMonth, partnerRawInput.birthDay,
          partnerRawInput.birthCity || 'seoul', partnerRawInput.birthHour || '', partnerRawInput.birthMinute || '',
          partnerRawInput.isTimeUnknown, partnerRawInput.birthTimezone, partnerRawInput.birthLongitude
      );
      const compatibility = calculateCompatibility(myBazi, partnerBazi);

      // --- 2-2. Prompt2 (프리미엄 8개 상세 항목) 호출 ---
      const detailItemSchema = {
          type: "object" as any,
          properties: {
              title: { type: "string" as any },
              subtitle: { type: "string" as any },
              content: { type: "string" as any }
          },
          required: ["title", "subtitle", "content"]
      };

      const systemInstruction2 = `
# Role
너는 '다시, 우리'라는 데이터 기반 전문 재회 컨설팅 서비스의 분석 전문가야.
명리학(사주팔자) 데이터 분석과 현대 심리학을 결합하여 두 사람의 관계를 객관적으로 분석하고, 재회를 위한 구체적이고 실현 가능한 전략을 제시해.

# Principles
1. **톤**: 따뜻하지만 논리적. 단순한 위로가 아닌 '데이터 기반 면죄부'를 제공한다.
2. **이모지**: 적절히 사용하되 과하지 않게.
3. **팩트폭행**: 때때로 뼈 때리는 돌직구 조언을 섞어서 현실적으로 알려줘.
4. **분량 (★ 매우 중요)**: 각 섹션의 content는 반드시 최소 500~600자 이상 작성.
5. **한자 금지**: 한자를 섞어 쓰지 마 (예: '戊토' → '무토'로 표기)

# Response Rules
1. 반드시 아래 JSON 스키마에 정확히 맞춰서 대답해. 마크다운 백틱이나 부연 설명 없이 순수 JSON만.`.trim();

      const schema2 = {
          type: "object" as any,
          properties: {
              details: { type: "array" as any, items: detailItemSchema }
          },
          required: ["details"]
      };

      const model2 = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          systemInstruction: systemInstruction2,
          generationConfig: { responseMimeType: "application/json", responseSchema: schema2 }
      });

      const commonPrompt = `[분석 대상]
- 나: ${myRawInput.name || "익명"} (${myRawInput.gender === 'male' ? '남자' : '여자'}, 만 ${myBazi.age}세)
- 상대방: ${partnerRawInput.name || "그 사람"} (${partnerRawInput.gender === 'male' ? '남자' : '여자'}, 만 ${partnerBazi.age}세)

[나의 사주팔자]
${myBazi.baziStr.trim()}
- 오행: 목(${myBazi.ohhaengCounts['목']}), 화(${myBazi.ohhaengCounts['화']}), 토(${myBazi.ohhaengCounts['토']}), 금(${myBazi.ohhaengCounts['금']}), 수(${myBazi.ohhaengCounts['수']})
- 십성: ${myBazi.sipsinSummary}
- 대운: ${myBazi.daeunStr}

[상대방의 사주팔자]
${partnerBazi.baziStr.trim()}
- 오행: 목(${partnerBazi.ohhaengCounts['목']}), 화(${partnerBazi.ohhaengCounts['화']}), 토(${partnerBazi.ohhaengCounts['토']}), 금(${partnerBazi.ohhaengCounts['금']}), 수(${partnerBazi.ohhaengCounts['수']})
- 십성: ${partnerBazi.sipsinSummary}
- 대운: ${partnerBazi.daeunStr}

[궁합 분석 데이터]
${compatibility.promptSummary}

${metDate || breakupDate || breakupReason ? `[관계 컨텍스트 — 매우 중요]\n${metDate ? `- 만난 시점/연애 시작일: ${metDate}\n` : ''}${breakupDate ? `- 이별 시점: ${breakupDate}\n` : ''}${breakupReason ? `- 사용자가 직접 전한 이별 이유/고민:\n${breakupReason}` : ''}\n위 컨텍스트를 분석에 반드시 깊게 반영해.` : ''}

(중요 지침: 모든 content 항목에 대해 모바일 화면에서 읽기 쉽도록 한 문단을 2~3문장 짧게 끊고, 문단 사이에 반드시 줄바꿈 2번(\\n\\n)을 띄워서 가독성을 극대화할 것. 필요한 경우 소제목이나 불릿기호(-)를 활용할 것)`;

      const prompt2 = `${commonPrompt}\n\n위 데이터를 바탕으로 심층 분석 8가지 섹션을 작성해줘. JSON 포맷:\n
{
  "details": [
    { "title": "🛡️ [심리] 왜 우리는 '회피'와 '공격'으로 맞섰을까?", "subtitle": "...", "content": "사주 성향상 각자의 방어기제와 갈등 상황 대처 방식. 실제 연애에서 벌어졌을 상황을 구체적으로 묘사하며 분석 (최소 600자)" },
    { "title": "⏳ [타이밍] 이별이 일어날 수밖에 없었던 사주적 시기", "subtitle": "...", "content": "이별 시기(운의 흐름)가 관계에 미친 영향, 왜 그때 갈등이 폭발했는지. 대운/세운/월운 흐름을 구체적으로 분석 (최소 600자)" },
    { "title": "☠️ [결론] 끝내 이별로 이끈 '진짜 사유' 분석", "subtitle": "...", "content": "단순한 표면적 이유가 아닌, 사주 명리학적으로 본 궁극적 이별 원인. 종합 진단과 함께 냉정한 팩트 전달 (최소 600자)" },
    { "title": "🫀 [속마음] 그 사람, 아직 나에게 미련이 있을까?", "subtitle": "...", "content": "상대방 사주 성향과 현재 시점 운으로 추론한 속마음. 구체적인 근거를 대며 몇 가지 시나리오를 제시 (최소 600자)" },
    { "title": "🚨 [경고] 제발 이것만은! 재회를 망치는 치명적 실수", "subtitle": "...", "content": "절대로 하면 안 되는 행동 3가지 이상과 각각의 구체적 이유. 실수 시 어떤 결과가 오는지까지 서술 (최소 600자)" },
    { "title": "🥲 [타이밍] 다시 연락이 닿을 길일과 먼저 연락 올 확률", "subtitle": "...", "content": "사주상 다시 연락하기 좋은 구체적 시기(길일)와 최적의 연락 태도. 먼저 갈지 기다릴지 전략적 판단 근거도 함께 (최소 600자)" },
    { "title": "😈 [전략] 재회 확률 200% 극대화 시크릿 비법", "subtitle": "...", "content": "오행을 자극하는 스타일링 추천, 만남 장소, 대화법, 유혹 포인트 등 구체적인 행동 가이드 (최소 600자)" },
    { "title": "🌸 [선택] 재회 성공 후 미래 vs 더 좋은 새로운 인연", "subtitle": "...", "content": "다시 만났을 때 잘 지낼 수 있을지 사주적으로 진단하고, 만약 포기한다면 언제 어떤 새 인연이 올지 예측 (최소 600자)" }
  ]
}`;

      let parsedData2: any = { details: [] };
      let attempt = 0;
      let maxRetries = 2;
      let success = false;
      while (attempt <= maxRetries && !success) {
          try {
              const res2 = await model2.generateContent(prompt2);
              parsedData2 = JSON.parse(res2.response.text().replace(/```json/g, "").replace(/```/g, "").trim());
              success = true;
          } catch (e) {
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
      }

      // --- 2-3. 로드맵 및 월별 에너지 흐름 호출 ---
      const systemInstruction3 = `
# Role
너는 '다시, 우리'라는 데이터 기반 전문 재회 컨설팅 서비스의 분석 전문가야.
명리학(사주팔자) 데이터와 골든 윈도우 분석을 결합하여 두 사람의 향후 관계 흐름을 객관적으로 분석하고 전략을 제시해.

# Principles
1. **톤**: 따뜻하지만 논리적이며 현실적.
2. **이모지**: 적절히 사용 (문단당 1~2개).
3. **분량**: 각 섹션은 최소 350자 이상, 2~3개 문단으로 깊이 있게 분석.
4. **한자 금지**: 한자를 섞어 쓰지 마 (예: '戊토' → '무토'로 표기)

# Response Rules
1. 반드시 아래 JSON 스키마에 정확히 맞춰서 대답해. 마크다운 백틱이나 부연 설명 없이 순수 JSON만.
2. \`goldenWindowMonths\` 배열에는 분석된 내용 중 연락하기 가장 좋은 1개의 '달(Month)'을 넣고, 해당 달 안에서 특히 연락하기 좋은 날짜(goodDates) 3~5개, 절대 연락하면 안 되는 날짜(badDates) 3~5개를 배열 형태로 생성해.
`.trim();

      const schema3 = {
          type: "object" as any,
          properties: {
              monthlyEnergies: {
                  type: "array" as any,
                  items: {
                      type: "object" as any,
                      properties: { month: { type: "string" as any }, theme: { type: "string" as any }, advice: { type: "string" as any } },
                      required: ["month", "theme", "advice"]
                  }
              },
              roadmapStages: {
                  type: "array" as any,
                  items: {
                      type: "object" as any,
                      properties: { step: { type: "string" as any }, title: { type: "string" as any }, action: { type: "string" as any } },
                      required: ["step", "title", "action"]
                  }
              },
              goldenWindowMonths: {
                  type: "array" as any,
                  items: {
                      type: "object" as any,
                      properties: {
                          month: { type: "string" as any },
                          goodDates: { type: "array" as any, items: { type: "number" as any } },
                          badDates: { type: "array" as any, items: { type: "number" as any } }
                      },
                      required: ["month", "goodDates", "badDates"]
                  }
              }
          },
          required: ["monthlyEnergies", "roadmapStages", "goldenWindowMonths"]
      };

      const model3 = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          systemInstruction: systemInstruction3,
          generationConfig: { responseMimeType: "application/json", responseSchema: schema3 }
      });

      const windowSummary = result.windows.map(w =>
          `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden}): ${w.reasons.join(', ')}`
      ).join('\n');

      const prompt3 = `[분석 대상]
- 나: ${myRawInput.name || "익명"} (${myRawInput.gender === 'male' ? '남자' : '여자'}), 일주: ${myDayGan}${myDayZhi}
- 상대방: ${partnerRawInput.name || "그 사람"} (${partnerRawInput.gender === 'male' ? '남자' : '여자'}), 일주: ${partnerDayGan}${partnerDayZhi}

[향후 6개월간 골든 윈도우 흐름 데이터]
${windowSummary}

${metDate || breakupDate || breakupReason ? `[관계 컨텍스트]\n${metDate ? `- 처음 만난 시점: ${metDate}\n` : ''}${breakupDate ? `- 이별 시점: ${breakupDate}\n` : ''}${breakupReason ? `- 이별 이유/고민:\n${breakupReason}` : ''}` : ''}

위 데이터를 바탕으로 다음 3가지 정보를 구조화해서 작성해줘:

1. \`monthlyEnergies\`: 향후 6개월간의 월별 에너지 흐름 분리 작성. (month: "5월", theme: "요약", advice: "구체적 조언")
- \`advice\`는 최소 2문장에서 3문장 정도로 작성하며, 의미가 전환될 때 반드시 줄바꿈(\\n)을 사용하여 가독성을 높일 것.
2. \`roadmapStages\`: 재회 장기 전략 3단계 작성 (step: "1단계", title: "타이틀", action: "구체적 행동 지침").
**[매우 중요 - action 작성 규칙]**
- 각 단계의 \`action\`은 최소 400자~500자 분량으로 상세하게 작성.
- 반드시 소제목과 본문을 줄바꿈(\\n)으로 구분해서 작성해. 한 덩어리 글로 쓰지 말고, 읽기 쉽게 문단을 나눠야 해.
- 작성 포맷 예시: "🎯 핵심 행동 지침\\n이 시기에는 ~하세요.\\n\\n💭 마인드셋\\n~한 마음가짐이 중요합니다.\\n\\n⚠️ 주의사항\\n절대 ~하지 마세요."
- 각 소제목 앞에 이모지 1개를 붙여서 시각적으로 구분.
- 소제목은 2~4개 정도가 적당.

3. \`goldenWindowMonths\`: 위 골든 윈도우 데이터 중 에너지 점수가 가장 높은 1개의 달(Month)을 선정하고, 해당 달 안에서 연락하기 좋은 날짜(goodDates) 3~5개와 절대 연락하면 안 되는 날짜(badDates) 3~5개를 배열(숫자)로 생성해줘. month는 "5월" 형태로.

반드시 위 스키마 포맷을 준수할 것.`;

      let parsedData3: any = { monthlyEnergies: [], roadmapStages: [], goldenWindowMonths: [] };
      attempt = 0;
      success = false;
      while (attempt <= maxRetries && !success) {
          try {
              const res3 = await model3.generateContent(prompt3);
              parsedData3 = JSON.parse(res3.response.text().replace(/```json/g, "").replace(/```/g, "").trim());
              success = true;
          } catch (e) {
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
      }

      // --- 2-4. 최종 병합 (Lite Data + Premium Details + Roadmap/Energies) ---
      // liteResult 에는 기존의 details (2개) 가 있음. Premium 8개를 뒤에 합칩니다.
      const liteDetails = liteResult.resultData?.details || [];
      const premiumDetails = parsedData2.details || [];
      const allDetails = [...liteDetails, ...premiumDetails];

      return {
          ...liteResult.resultData, // 기존 호환성, 점수, 요약, 사주 등 유지
          details: allDetails,      // 총 10개의 프리미엄 아코디언 항목
          windows: result.windows,
          bestMonth: result.bestMonth,
          worstMonth: result.worstMonth,
          monthlyEnergies: parsedData3.monthlyEnergies,
          roadmapStages: parsedData3.roadmapStages,
          goldenWindowMonths: parsedData3.goldenWindowMonths || []
      };
    });

    // 3. 분석 결과 DB 저장
    await step.run("save-result-to-supabase", async () => {
      await supabaseAdmin
        .from("premium_analysis_jobs")
        .update({
          status: "completed",
          ai_result: aiResult
        })
        .eq("id", jobId);
    });

    // 4. Solapi로 완료 알림 문자 발송 (임시로 발송 중지 - 콘솔 로그로 대체)
    await step.run("send-completion-sms", async () => {
      // 프론트엔드 URL 확인 (운영 > Vercel 자동 > 로컬 순서)
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
