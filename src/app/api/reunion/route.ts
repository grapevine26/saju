import { NextResponse } from "next/server";
import { BASE_SYSTEM_INSTRUCTION } from "@/constants/aiPrompts";
import { calculateBazi, BaziCalculationResult } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { calculateGoldenWindows } from "@/utils/goldenWindowCalc";
import { genAI, callGemini } from "@/utils/geminiCall";

const apiKey = process.env.GEMINI_API_KEY || "";

// 사용자 입력 정보 타입
interface PersonInput {
    name: string;
    gender: 'male' | 'female' | null;
    calendarType: 'solar' | 'lunar';
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthCity: string;
    birthTimezone?: string;
    birthLongitude?: number;
    birthHour?: string;
    birthMinute?: string;
    isTimeUnknown: boolean;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { my, partner, tier = 'lite', metDate, breakupDate, breakupReason } = body as {
            my: PersonInput;
            partner: PersonInput;
            tier: 'lite' | 'premium';
            metDate?: string;
            breakupDate?: string;
            breakupReason?: string;
        };

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "서버에 Gemini API 키가 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        // ─────────────────────────────────────
        // 1. 두 사람의 만세력 계산
        // ─────────────────────────────────────
        const myBazi = calculateBazi(
            my.gender, my.calendarType,
            my.birthYear, my.birthMonth, my.birthDay,
            my.birthCity, my.birthHour || '', my.birthMinute || '',
            my.isTimeUnknown, my.birthTimezone, my.birthLongitude
        );

        const partnerBazi = calculateBazi(
            partner.gender, partner.calendarType,
            partner.birthYear, partner.birthMonth, partner.birthDay,
            partner.birthCity || 'seoul',
            partner.birthHour || '', partner.birthMinute || '',
            partner.isTimeUnknown,
            partner.birthTimezone, partner.birthLongitude
        );

        // ─────────────────────────────────────
        // 2. 궁합 분석
        // ─────────────────────────────────────
        const compatibility = calculateCompatibility(myBazi, partnerBazi);

        // 3. 골든 윈도우 계산 (Lite에서 기본 데이터만 반환, AI 분석은 Inngest에서 처리)
        const goldenWindows = null;

        // ─────────────────────────────────────
        // 4. Gemini AI 재회 분석 호출
        // ─────────────────────────────────────
        const systemInstruction = `
${BASE_SYSTEM_INSTRUCTION}

# Response Rules
1. 반드시 아래 JSON 스키마에 정확히 맞춰서 대답해. 마크다운 백틱이나 부연 설명 없이 순수 JSON만.
2. reunionScore는 제공된 궁합 데이터의 재회 가능성 점수를 참고하되, 네가 종합적으로 최종 판단하여 조정해도 됨.
`.trim();

        // 공통 detail 아이템 스키마
        const detailItemSchema = {
            type: "object" as any,
            properties: {
                title: { type: "string" as any },
                subtitle: { type: "string" as any },
                content: { type: "string" as any }
            },
            required: ["title", "subtitle", "content"]
        };

        // prompt1 스키마: Lite용 (본질 + 소통 + 점수/요약)
        const schema1 = {
            type: "object" as any,
            properties: {
                reunionKeyword: { type: "string" as any },
                reunionScore: { type: "integer" as any },
                summary: { type: "string" as any },
                details: {
                    type: "array" as any,
                    items: detailItemSchema
                }
            },
            required: ["reunionKeyword", "reunionScore", "summary", "details"]
        };

        const model1 = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction,
            generationConfig: { responseMimeType: "application/json", responseSchema: schema1 }
        });

        const commonPrompt = `[분석 대상]
- 나: ${my.name || "익명"} (${my.gender === 'male' ? '남자' : '여자'}, 만 ${myBazi.age}세)
- 상대방: ${partner.name || "그 사람"} (${partner.gender === 'male' ? '남자' : '여자'}, 만 ${partnerBazi.age}세)

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

        // ── prompt1: Lite용 (항상 호출) ──
        // 관계 본질 + 소통 패턴 + 재회 점수/요약
        const prompt1 = `${commonPrompt}\n\n위 데이터를 바탕으로 두 사람의 관계 본질과 핵심 요약, 프리미엄 티저를 분석해줘. JSON 포맷:\n
{
  "reunionKeyword": "두 사람의 관계를 꿰뚫는 핵심 키워드 한 줄",
  "reunionScore": 재회 가능성 점수 (0~100),
  "summary": "두 사람의 재회 전반에 대한 핵심 요약 2~3줄",
  "secretTeaser": "결제를 유도하는 200자 이상의 핵심 행동 지침. 사주 분석을 바탕으로 구체적인 시기(월)나 행동 지침을 적되, 가장 결정적인 단어나 시기를 반드시 [BLUR]...[/BLUR] 태그로 감싸서 숨길 것. 예: 다가오는 O월, 상대방의 방어기제가 무너집니다. 이때 [BLUR]이런 방식[/BLUR]으로 다가가면 재회 확률이 급증합니다.",
  "details": [
    { "title": "✨ [본질] 두 사람이 끌릴 수밖에 없었던 운명적 이유", "subtitle": "...", "content": "두 사람이 처음 왜 끌렸고, 어떤 에너지로 연결되어 있는지 합/충 데이터를 근거로 심층 분석. 구체적인 천간/지지 관계를 언급하며 풍성하게 설명 (최소 600자)" },
    { "title": "🧬 [성향] 사주로 읽는 우리의 연애 DNA와 소통 패턴", "subtitle": "...", "content": "각자의 사주 오행과 십성으로 읽는 성격 성향, 사랑 표현 방식, 소통 스타일의 차이와 충돌 지점. '나'와 '상대방'을 각각 분석한 뒤 비교하여 서술 (최소 600자)" }
  ]
}`;



        console.log(`[다시, 우리] 재회 분석 시작 (tier: ${tier})`);

        // ── prompt1 호출 (항상 Lite) ──
        let parsedData1: any;
        try {
            parsedData1 = await callGemini(model1, prompt1);
        } catch (e) {
            console.error('prompt1 최종 실패:', e);
            return NextResponse.json(
                { success: false, error: "데이터 분석 결과를 읽는 데 실패했어요. 잠시 후 다시 시도해 주세요." },
                { status: 500 }
            );
        }

        // [본질]을 독립 카드용 데이터로 분리 (details의 첫 번째 항목)
        const essenceAnalysis = parsedData1.details.length > 0 ? parsedData1.details[0] : null;
        const remainingDetails1 = parsedData1.details.slice(1);

        const parsedData = {
            reunionKeyword: parsedData1.reunionKeyword,
            reunionScore: parsedData1.reunionScore,
            summary: parsedData1.summary,
            secretTeaser: parsedData1.secretTeaser,
            essenceAnalysis,
            details: remainingDetails1
        };

        // ─────────────────────────────────────
        // 5. 응답 반환
        // ─────────────────────────────────────
        return NextResponse.json({
            success: true,
            data: {
                ...parsedData,
                myManseryeok: myBazi.manseryeok,
                partnerManseryeok: partnerBazi.manseryeok,
                myOhhaeng: myBazi.ohhaengCounts,
                partnerOhhaeng: partnerBazi.ohhaengCounts,
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
                goldenWindows: goldenWindows,
                tier
            }
        });

    } catch (error) {
        console.error("[다시, 우리] API Error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
