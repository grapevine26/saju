import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateGoldenWindows } from "@/utils/goldenWindowCalc";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const {
            myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
            myName, myGender, partnerName, partnerGender,
            metDate, breakupDate, breakupReason, months = 6
        } = await request.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "서버에 Gemini API 키가 설정되지 않았습니다." }, { status: 500 });
        }

        // 1. 골든 윈도우 계산
        const result = calculateGoldenWindows(myDayGan, myDayZhi, partnerDayGan, partnerDayZhi, months);

        // 2. Gemini AI 월별 흐름 및 장기 전략 로드맵 생성 (reunion과 동일한 구조)
        const systemInstruction = `
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
2. \`goldenWindowMonths\` 배열에는 분석된 내용 중 연락하기 가장 좋은 1~2개의 '달(Month)'을 넣고, 해당 달 안에서 특히 연락하기 좋은 날짜(goodDates) 3~5개, 절대 연락하면 안 되는 날짜(badDates) 3~5개를 배열 형태로 생성해.
`.trim();

        const responseSchema = {
            type: "object" as any,
            properties: {
                monthlyEnergies: {
                    type: "array" as any,
                    items: {
                        type: "object" as any,
                        properties: {
                            month: { type: "string" as any },
                            theme: { type: "string" as any },
                            advice: { type: "string" as any }
                        },
                        required: ["month", "theme", "advice"]
                    }
                },
                roadmapStages: {
                    type: "array" as any,
                    items: {
                        type: "object" as any,
                        properties: {
                            step: { type: "string" as any },
                            title: { type: "string" as any },
                            action: { type: "string" as any }
                        },
                        required: ["step", "title", "action"]
                    }
                },
                goldenWindowMonths: {
                    type: "array" as any,
                    items: {
                        type: "object" as any,
                        properties: {
                            month: { type: "string" as any, description: "예: '4월', '11월'" },
                            goodDates: {
                                type: "array" as any,
                                items: { type: "number" as any },
                                description: "연락하기 매우 좋은 날짜 2~4개 (1~31 사이의 숫자)"
                            },
                            badDates: {
                                type: "array" as any,
                                items: { type: "number" as any },
                                description: "절대 연락하면 안 되는 날짜 2~4개 (1~31 사이의 숫자)"
                            }
                        },
                        required: ["month", "goodDates", "badDates"]
                    }
                }
            },
            required: ["monthlyEnergies", "roadmapStages", "goldenWindowMonths"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-pro-preview",
            systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema
            }
        });

        const windowSummary = result.windows.map(w =>
            `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden}): ${w.reasons.join(', ')}`
        ).join('\n');

        const prompt = `[분석 대상]
- 나: ${myName || "익명"} (${myGender === 'male' ? '남자' : '여자'}), 일주: ${myDayGan}${myDayZhi}
- 상대방: ${partnerName || "그 사람"} (${partnerGender === 'male' ? '남자' : '여자'}), 일주: ${partnerDayGan}${partnerDayZhi}

[향후 6개월간 골든 윈도우 흐름 데이터]
${windowSummary}

${metDate || breakupDate || breakupReason ? `[관계 컨텍스트]
${metDate ? `- 처음 만난 시점: ${metDate}\n` : ''}${breakupDate ? `- 이별 시점: ${breakupDate}\n` : ''}${breakupReason ? `- 이별 이유/고민:\n${breakupReason}` : ''}` : ''}

위 데이터를 바탕으로 다음 3가지 정보를 구조화해서 작성해줘:

1. \`monthlyEnergies\`: 향후 6개월간의 월별 에너지 흐름 분리 작성. (month: "5월", theme: "요약", advice: "구체적 조언")
- \`advice\`는 최소 2문장 이상으로 작성하며, 의미가 전환될 때 반드시 줄바꿈(\\n)을 사용하여 가독성을 높일 것.
2. \`roadmapStages\`: 재회 장기 전략 3단계 작성 (step: "1단계", title: "타이틀", action: "구체적 행동 지침").
**[매우 중요 - action 작성 규칙]**
- 각 단계의 \`action\`은 최소 300자~500자 분량으로 상세하게 작성.
- 반드시 소제목과 본문을 줄바꿈(\\n)으로 구분해서 작성해. 한 덩어리 글로 쓰지 말고, 읽기 쉽게 문단을 나눠야 해.
- 작성 포맷 예시: "🎯 핵심 행동 지침\\n이 시기에는 ~하세요.\\n\\n💭 마인드셋\\n~한 마음가짐이 중요합니다.\\n\\n⚠️ 주의사항\\n절대 ~하지 마세요."
- 각 소제목 앞에 이모지 1개를 붙여서 시각적으로 구분.
- 소제목은 2~4개 정도가 적당.

3. \`goldenWindowMonths\`: 위 골든 윈도우 데이터 중 에너지 점수가 가장 높은 1~2개의 달(Month)을 선정하고, 해당 달 안에서 연락하기 좋은 날짜(goodDates) 3~5개와 절대 연락하면 안 되는 날짜(badDates) 3~5개를 배열(숫자)로 생성해줘. month는 "5월" 형태로.

반드시 위 스키마 포맷을 준수할 것.`;

        let parsedData: any = { monthlyEnergies: [], roadmapStages: [], goldenWindowMonths: [] };
        let attempt = 0;
        const maxRetries = 2; // 최대 2회 재시도
        let success = false;

        while (attempt <= maxRetries && !success) {
            try {
                const aiResult = await model.generateContent(prompt);
                let text = aiResult.response.text();
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();

                parsedData = JSON.parse(text);
                success = true;
            } catch (e) {
                attempt++;
                console.error(`골든 윈도우 AI 분석 및 파싱 실패 (시도 ${attempt}/${maxRetries + 1}):`, e);
                if (attempt > maxRetries) {
                    return NextResponse.json(
                        { success: false, error: "데이터 분석 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
                        { status: 500 }
                    );
                }
                // 짧은 대기 후 재시도
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                windows: result.windows,
                bestMonth: result.bestMonth,
                worstMonth: result.worstMonth,
                monthlyEnergies: parsedData.monthlyEnergies,
                roadmapStages: parsedData.roadmapStages,
                goldenWindowMonths: parsedData.goldenWindowMonths || []
            }
        });

    } catch (error) {
        console.error("[골든 윈도우] API Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
