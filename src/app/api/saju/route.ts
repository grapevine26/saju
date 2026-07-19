import { NextResponse } from "next/server";
import { calculateBazi } from "@/utils/baziCalc";
import { genAI, callGemini } from "@/utils/geminiCall";
import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import { Solar } from "lunar-javascript";
import { HANJA_TO_HANGUL } from "@/utils/sajuMapper";

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || "";

/**
 * 단일 사주 명식 분석 (프로필 → "정밀 사주 분석 보러가기" 경로).
 * 재회 분석(/api/reunion)과 달리 한 사람의 사주만 풀이한다.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, gender, calendarType,
            birthYear, birthMonth, birthDay, birthCity,
            birthHour, birthMinute, isTimeUnknown,
            birthTimezone, birthLongitude,
        } = body;

        if (!birthYear || !birthMonth || !birthDay) {
            return NextResponse.json({ success: false, error: "생년월일 정보가 필요합니다." }, { status: 400 });
        }

        // Rate limit — IP 기준 하루 5회 (무료 분석 남용/비용 방지)
        {
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count } = await supabaseAdmin
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('action', 'saju_analysis')
                .gte('created_at', today.toISOString());
            if (count !== null && count >= 5) {
                return NextResponse.json(
                    { success: false, error: "오늘의 무료 분석 한도(5회)를 모두 사용하셨습니다. 내일 다시 시도해 주세요!" },
                    { status: 429 },
                );
            }
            supabaseAdmin.from('api_usage_logs').insert({ ip_address: ip, action: 'saju_analysis' })
                .then(({ error }) => { if (error) console.error("Usage logging error:", error); });
        }

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "서버 설정 오류 (AI 키 없음)" }, { status: 500 });
        }

        // 1. 만세력 계산
        const bazi = calculateBazi(
            gender, calendarType,
            birthYear, birthMonth, birthDay,
            birthCity || 'seoul', birthHour || '', birthMinute || '',
            isTimeUnknown, birthTimezone, birthLongitude,
        );

        // 2. Gemini 사주 풀이 — responseSchema로 필드 누락/형식 이탈 방지
        const sajuSchema = {
            type: "object" as any,
            properties: {
                keyword: { type: "string" as any },
                score: { type: "integer" as any },
                summary: { type: "string" as any },
                details: {
                    type: "array" as any,
                    items: {
                        type: "object" as any,
                        properties: {
                            title: { type: "string" as any },
                            content: { type: "string" as any },
                        },
                        required: ["title", "content"],
                    },
                },
            },
            required: ["keyword", "score", "summary", "details"],
        };
        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction:
                "당신은 한국의 정통 명리학자입니다. 주어진 사주 명식을 바탕으로 따뜻하면서도 현실적인 풀이를 제공합니다. " +
                "근거 없는 낙관도, 불필요한 불안 조성도 하지 않습니다. 반드시 지정된 JSON 형식으로만 답합니다.",
            generationConfig: { responseMimeType: "application/json", responseSchema: sajuSchema, maxOutputTokens: 4096 },
        });

        // "올해의 흐름"을 시키려면 올해가 언제이고 어떤 해인지 알려줘야 한다 —
        // 모델은 오늘 날짜를 모르므로 현재 연도의 세운 간지를 계산해 주입한다.
        const now = new Date();
        let currentYearGanZhi = '';
        try {
            const nowBazi = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()).getLunar().getEightChar();
            const yg = HANJA_TO_HANGUL[nowBazi.getYearGan()] || nowBazi.getYearGan();
            const yz = HANJA_TO_HANGUL[nowBazi.getYearZhi()] || nowBazi.getYearZhi();
            currentYearGanZhi = `${yg}${yz}`;
        } catch { /* 계산 실패 시 연도만 제공 */ }

        const p = bazi.manseryeok;
        const prompt = `[기준 시점]
- 오늘 날짜: ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일${currentYearGanZhi ? ` (올해 세운: ${currentYearGanZhi}년)` : ''}

아래는 ${name || '이 사람'}님의 사주 명식입니다.
- 연주: ${p.year?.gan}${p.year?.zhi}
- 월주: ${p.month?.gan}${p.month?.zhi}
- 일주: ${p.day?.gan}${p.day?.zhi}
- 시주: ${isTimeUnknown ? '출생시간 미상 (시주 제외하고 분석)' : `${p.time?.gan ?? ''}${p.time?.zhi ?? ''}`}
- 성별: ${gender === 'male' ? '남성' : gender === 'female' ? '여성' : '미상'}
- 오행 분포: 목(${bazi.ohhaengCounts['목']}), 화(${bazi.ohhaengCounts['화']}), 토(${bazi.ohhaengCounts['토']}), 금(${bazi.ohhaengCounts['금']}), 수(${bazi.ohhaengCounts['수']})
- 십성: ${bazi.sipsinSummary}
- 대운: ${bazi.daeunStr}
${bazi.uniqueShinsal ? `- 주요 신살: ${bazi.uniqueShinsal}` : ''}

이 명식을 바탕으로 아래 JSON을 채워 반환하세요. "올해의 흐름"은 반드시 위 [기준 시점]의 올해(${now.getFullYear()}년${currentYearGanZhi ? ` ${currentYearGanZhi}년` : ''})를 기준으로 서술합니다. 다른 텍스트 없이 JSON만 출력합니다.
{
  "keyword": "<올해를 관통하는 4~8자 키워드>",
  "score": <이 사람의 전반적 기운의 균형을 나타내는 0~100 정수>,
  "summary": "<120자 이내 요약. 강점과 올해 흐름을 담되 현실적으로>",
  "details": [
    { "title": "타고난 기질", "content": "<200자 이상. 일간·오행 중심>" },
    { "title": "올해의 흐름", "content": "<200자 이상. 과제와 기회를 함께>" },
    { "title": "관계와 인연", "content": "<200자 이상>" },
    { "title": "조언", "content": "<150자 이상. 구체적 행동 제안>" }
  ]
}`;

        const ai = await callGemini(model, prompt);
        if (!ai || !ai.keyword) {
            return NextResponse.json({ success: false, error: "분석 결과를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            data: {
                manseryeok: bazi.manseryeok,
                keyword: ai.keyword,
                score: typeof ai.score === 'number' ? ai.score : 70,
                summary: ai.summary || '',
                details: Array.isArray(ai.details) ? ai.details : [],
            },
        });
    } catch (error: any) {
        console.error("[api/saju] error:", error);
        return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
