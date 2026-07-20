import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { calculateGoldenWindows, calculateGoldenDates } from "@/utils/goldenWindowCalc";
import {
    BASE_SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION_LITE, SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
    SYSTEM_INSTRUCTION_COMPATIBILITY, buildPrompt1, buildPrompt2, buildPrompt3, buildPrompt4,
} from "@/constants/aiPrompts";
import { parseJsonResponse, fixLiteralNewlines, genAI, callGemini } from "@/utils/geminiCall";
import { schema4 } from "@/constants/aiSchemas";

/** OpenAI 호출 헬퍼 — 시스템 지시문·프롬프트는 Gemini 경로와 동일 문자열 사용 */
async function callTerra(system: string, prompt: string, maxTokens = 16384): Promise<any> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: "gpt-5.6-terra",
            messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: maxTokens,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "OpenAI 호출 실패");
    return fixLiteralNewlines(parseJsonResponse(data.choices?.[0]?.message?.content || ""));
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * [개발 전용·일회성] 모델 비교 — 동일한 시스템 지시문 + 동일한 buildPrompt4 문자열을
 * GPT-5.6 Terra에 보내 궁합 리포트를 생성한다 (잡 저장 없음, 순수 비교용).
 * Gemini 쪽 대조군은 기존 생성 잡의 compatibilityReport를 사용.
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "not available" }, { status: 404 });
    }
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OPENAI_API_KEY 없음" }, { status: 500 });
    }

    const parsePerson = (raw: string | null) => {
        const [name, gender, birth, time, city] = (raw || "").split(",");
        const [y, m, d] = (birth || "").split("-");
        const timeUnknown = !time || time === "?";
        const [hh, mm] = timeUnknown ? ["", ""] : time.split(":");
        return {
            name, gender, calendarType: "solar",
            birthYear: y, birthMonth: String(Number(m)), birthDay: String(Number(d)),
            birthCity: city || "seoul", birthHour: hh || "", birthMinute: mm || "",
            isTimeUnknown: timeUnknown,
        };
    };
    const myRawInput = parsePerson(req.nextUrl.searchParams.get("my"));
    const partnerRawInput = parsePerson(req.nextUrl.searchParams.get("partner"));

    const myBazi = calculateBazi(myRawInput.gender as any, "solar", myRawInput.birthYear, myRawInput.birthMonth, myRawInput.birthDay, myRawInput.birthCity, myRawInput.birthHour, myRawInput.birthMinute, myRawInput.isTimeUnknown);
    const partnerBazi = calculateBazi(partnerRawInput.gender as any, "solar", partnerRawInput.birthYear, partnerRawInput.birthMonth, partnerRawInput.birthDay, partnerRawInput.birthCity, partnerRawInput.birthHour, partnerRawInput.birthMinute, partnerRawInput.isTimeUnknown);
    const compatibility = calculateCompatibility(myBazi, partnerBazi);

    // Gemini 경로와 완전히 동일한 프롬프트 (관계 컨텍스트 없음 — 순수 사주)
    const prompt = buildPrompt4({
        myRawInput, partnerRawInput, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
    });

    // ?dry=1 — OpenAI 호출 없이 실제 주입되는 프롬프트 전문만 반환
    if (req.nextUrl.searchParams.get("dry") === "1") {
        return new NextResponse(prompt, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // ?scope=full — 재회 챕터(라이트+심층+매뉴얼+골든윈도우 텍스트)까지 전부 Terra로 생성해
    // 완전 GPT판 잡을 만든다. 궁합은 baseId 잡(기본: D)의 것을 재사용.
    if (req.nextUrl.searchParams.get("scope") === "full") {
        const baseId = req.nextUrl.searchParams.get("baseId") || "3768d425-4fc2-416a-b65a-8c661dd0569d";
        const myDayGan = myBazi.manseryeok.day.gan, myDayZhi = myBazi.manseryeok.day.zhi;
        const ptDayGan = partnerBazi.manseryeok.day.gan, ptDayZhi = partnerBazi.manseryeok.day.zhi;
        const gw = calculateGoldenWindows(myDayGan, myDayZhi, ptDayGan, ptDayZhi, 6);

        const goldenList = gw.windows.filter(w => w.isGolden).map(w => `${w.year}년 ${w.month}월`);
        const goldenWindowSummary = gw.bestMonth
            ? `- 연락 최적기(향후 6개월 중 최고점): ${gw.bestMonth.year}년 ${gw.bestMonth.month}월 (에너지 ${gw.bestMonth.score}점)${goldenList.length > 1 ? `\n- 그 외 좋은 달: ${goldenList.join(', ')}` : ''}`
            : undefined;
        const ctx = { myRawInput, partnerRawInput, myBazi, partnerBazi, compatibilityPromptSummary: compatibility.promptSummary, goldenWindowSummary };

        // 캘린더 선확정 (inngest와 동일)
        let goldenWindowMonths: any[] = [];
        let bestWindowSummary: string | undefined;
        if (gw.bestMonth) {
            const gd = calculateGoldenDates(gw.bestMonth.year, gw.bestMonth.month, myDayGan, myDayZhi, ptDayGan, ptDayZhi);
            if (gd.length > 0) {
                goldenWindowMonths = [{
                    month: `${gw.bestMonth.year}년 ${gw.bestMonth.month}월`,
                    goodDates: gd.map(d => d.day), badDates: [],
                    dateDetails: gd.map(d => ({ day: d.day, ganzhi: `${d.dayGan}${d.dayZhi}`, reasons: d.reasons })),
                }];
                bestWindowSummary = `${gw.bestMonth.year}년 ${gw.bestMonth.month}월 (길일: ${gd.map(d => `${d.day}일`).join(', ')})`;
            } else bestWindowSummary = `${gw.bestMonth.year}년 ${gw.bestMonth.month}월`;
        }
        const windowSummary = gw.windows.map(w =>
            `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden ? '예' : '아니오'}): ${w.reasons.join(', ')}`
        ).join('\n');

        // 라이트 → (심층 ∥ 골든윈도우) — 시스템 지시문·프롬프트는 Gemini 경로와 동일 문자열
        const d1 = await callTerra(SYSTEM_INSTRUCTION_LITE, buildPrompt1(ctx), 8192);
        const details1: any[] = d1?.details || [];
        const ei = details1.findIndex((d: any) => typeof d?.title === 'string' && d.title.includes('[본질]'));
        const pick = ei >= 0 ? ei : 0;
        const [d2, d3] = await Promise.all([
            callTerra(BASE_SYSTEM_INSTRUCTION, buildPrompt2(ctx, d1?.secretTeaser), 16384),
            callTerra(SYSTEM_INSTRUCTION_GOLDEN_WINDOW, buildPrompt3({
                myName: myRawInput.name, myGender: myRawInput.gender,
                partnerName: partnerRawInput.name, partnerGender: partnerRawInput.gender,
                myDayGan, myDayZhi, partnerDayGan: ptDayGan, partnerDayZhi: ptDayZhi,
                mySipsin: myBazi.sipsinSummary, partnerSipsin: partnerBazi.sipsinSummary,
                windowSummary, bestWindowSummary,
            }), 16384),
        ]);

        const { data: baseJob } = await supabaseAdmin.from("premium_analysis_jobs").select("ai_result").eq("id", baseId).single();
        const aiResult = {
            tier: "premium",
            reunionKeyword: d1?.reunionKeyword, reunionScore: d1?.reunionScore,
            summary: d1?.summary, secretTeaser: d1?.secretTeaser,
            essenceAnalysis: details1[pick] || null,
            details: [...details1.filter((_: any, i: number) => i !== pick), ...(d2?.details || [])],
            partnerManual: d2?.partnerManual || null,
            myManseryeok: myBazi.manseryeok, partnerManseryeok: partnerBazi.manseryeok,
            myOhhaeng: myBazi.ohhaengCounts, partnerOhhaeng: partnerBazi.ohhaengCounts,
            compatibility: {
                reunionScore: compatibility.reunionScore, attractionScore: compatibility.attractionScore,
                conflictScore: compatibility.conflictScore, complementScore: compatibility.complementScore,
                hapList: compatibility.hapList, chungList: compatibility.chungList,
                hyeongList: compatibility.hyeongList, haeList: compatibility.haeList,
                dayMasterRelation: compatibility.dayMasterRelation, spouseHouseRelation: compatibility.spouseHouseRelation,
                ohhaengAnalysis: compatibility.ohhaengAnalysis,
            },
            goldenWindows: {
                windows: gw.windows, bestMonth: gw.bestMonth,
                monthlyEnergies: d3?.monthlyEnergies || [], roadmapStages: d3?.roadmapStages || [],
                goldenWindowMonths,
            },
            compatibilityReport: baseJob?.ai_result?.compatibilityReport || null,
        };
        const { data: ins, error } = await supabaseAdmin.from("premium_analysis_jobs")
            .insert({ status: "completed", ai_result: aiResult, raw_data: { myRawInput, partnerRawInput, packageId: "signature", modelCompare: "terra-full", devE2E: true } })
            .select("id").single();
        if (error) return NextResponse.json({ error: "저장 실패", detail: error }, { status: 500 });
        return NextResponse.json({
            jobId: ins.id,
            counts: { details: aiResult.details.length, manual: !!aiResult.partnerManual, monthly: aiResult.goldenWindows.monthlyEnergies.length, roadmap: aiResult.goldenWindows.roadmapStages.length },
            teaser: (d1?.secretTeaser || "").slice(0, 80),
        });
    }

    // ?model=gemini — Inngest 프로덕션 경로와 동일 구성의 Gemini 재생성 (비교용)
    if (req.nextUrl.searchParams.get("model") === "gemini") {
        const model4 = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION_COMPATIBILITY,
            generationConfig: { responseMimeType: "application/json", responseSchema: schema4, maxOutputTokens: 32768 },
        });
        const report = await callGemini(model4, prompt);
        return NextResponse.json({ model: "gemini-3.5-flash", report });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-5.6-terra",
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION_COMPATIBILITY },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 32768,
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        return NextResponse.json({ error: "OpenAI 호출 실패", detail: data?.error?.message || data }, { status: 502 });
    }
    const text = data.choices?.[0]?.message?.content || "";
    let parsed: any = null;
    try { parsed = parseJsonResponse(text); } catch { /* 원문 반환 */ }

    return NextResponse.json({
        model: data.model,
        usage: data.usage,
        report: parsed,
        raw: parsed ? undefined : text.slice(0, 2000),
    });
}
