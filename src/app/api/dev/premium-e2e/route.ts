import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { calculateGoldenWindows, calculateGoldenDates } from "@/utils/goldenWindowCalc";
import { callTerra } from "@/utils/openaiCall";
import {
    BASE_SYSTEM_INSTRUCTION,
    SYSTEM_INSTRUCTION_GOLDEN_WINDOW,
    SYSTEM_INSTRUCTION_COMPATIBILITY,
    buildPrompt2, buildPrompt3, buildPrompt4,
} from "@/constants/aiPrompts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * [개발 전용] 프리미엄/시그니처 생성 E2E 검증 — Inngest analyze-with-gemini 스텝과
 * 동일한 프롬프트·모델·병합 로직을 실행해 완료 잡을 DB에 만들고, 프롬프트 산출물이
 * UI 기대 구조와 일치하는지 자동 점검 결과를 반환한다.
 * ?package=basic | signature
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "not available" }, { status: 404 });
    }
    const packageId = req.nextUrl.searchParams.get("package") === "signature" ? "signature" : "basic";

    // 인물 커스텀: ?my=이름,성별,YYYY-MM-DD,HH:MM,도시&partner=... (시간 미상은 HH:MM 자리에 "?" )
    const parsePerson = (raw: string | null, fallback: any) => {
        if (!raw) return fallback;
        const [name, gender, birth, time, city] = raw.split(",");
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
    const myRawInput = parsePerson(req.nextUrl.searchParams.get("my"), {
        name: "나영", gender: "female", calendarType: "solar",
        birthYear: "1995", birthMonth: "7", birthDay: "15",
        birthCity: "seoul", birthHour: "", birthMinute: "", isTimeUnknown: true,
    });
    const partnerRawInput = parsePerson(req.nextUrl.searchParams.get("partner"), {
        name: "혁준", gender: "male", calendarType: "solar",
        birthYear: "1993", birthMonth: "11", birthDay: "2",
        birthCity: "seoul", birthHour: "14", birthMinute: "30", isTimeUnknown: false,
    });
    // 관계 컨텍스트는 파라미터로 준 경우에만 주입 — 기본값으로 지어내지 않는다
    // (비어 있으면 프롬프트의 관계 컨텍스트·시점 운 블록이 통째로 생략됨)
    const metDate = req.nextUrl.searchParams.get("metDate") || undefined;
    const breakupDate = req.nextUrl.searchParams.get("breakupDate") || undefined;
    const breakupReason = req.nextUrl.searchParams.get("breakupReason") || undefined;

    // ── 0. 라이트 결과 (essence/teaser/성향) — 실제 결제 흐름과 동일하게 내부 API 호출
    const liteRes = await fetch(`${req.nextUrl.origin}/api/reunion`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ my: myRawInput, partner: partnerRawInput, tier: "lite", metDate, breakupDate, breakupReason }),
    });
    const liteJson = await liteRes.json();
    if (!liteJson.success) return NextResponse.json({ error: "lite 생성 실패", detail: liteJson }, { status: 500 });
    const liteResult = liteJson.data;

    // ── 1. Inngest analyze 스텝과 동일한 계산·프롬프트·모델 (src/inngest/functions.ts 미러)
    const months = 6;
    const myBazi = calculateBazi(myRawInput.gender as any, myRawInput.calendarType as any, myRawInput.birthYear, myRawInput.birthMonth, myRawInput.birthDay, myRawInput.birthCity, myRawInput.birthHour, myRawInput.birthMinute, myRawInput.isTimeUnknown);
    const partnerBazi = calculateBazi(partnerRawInput.gender as any, partnerRawInput.calendarType as any, partnerRawInput.birthYear, partnerRawInput.birthMonth, partnerRawInput.birthDay, partnerRawInput.birthCity, partnerRawInput.birthHour, partnerRawInput.birthMinute, partnerRawInput.isTimeUnknown);
    const myDayGan = myBazi.manseryeok.day.gan, myDayZhi = myBazi.manseryeok.day.zhi;
    const partnerDayGan = partnerBazi.manseryeok.day.gan, partnerDayZhi = partnerBazi.manseryeok.day.zhi;
    const compatibility = calculateCompatibility(myBazi, partnerBazi);
    const result = calculateGoldenWindows(myDayGan, myDayZhi, partnerDayGan, partnerDayZhi, months);

    const goldenList = result.windows.filter(w => w.isGolden).map(w => `${w.year}년 ${w.month}월`);
    const goldenWindowSummary = result.bestMonth
        ? `- 연락 최적기(향후 ${months}개월 중 최고점): ${result.bestMonth.year}년 ${result.bestMonth.month}월 (에너지 ${result.bestMonth.score}점)${goldenList.length > 1 ? `\n- 그 외 좋은 달: ${goldenList.join(', ')}` : ''}`
        : undefined;

    const promptCtx = {
        myRawInput, partnerRawInput, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
        metDate, breakupDate, breakupReason, goldenWindowSummary,
    };
    const prompt2 = buildPrompt2(promptCtx, liteResult?.secretTeaser);

    // 캘린더 선확정 → prompt3 주입 (inngest와 동일)
    let goldenWindowMonths: any[] = [];
    let bestWindowSummary: string | undefined;
    if (result.bestMonth) {
        const goldenDates = calculateGoldenDates(result.bestMonth.year, result.bestMonth.month, myDayGan, myDayZhi, partnerDayGan, partnerDayZhi);
        if (goldenDates.length > 0) {
            goldenWindowMonths = [{
                month: `${result.bestMonth.year}년 ${result.bestMonth.month}월`,
                goodDates: goldenDates.map(d => d.day),
                badDates: [],
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
        windowSummary, bestWindowSummary, metDate, breakupDate, breakupReason,
    });

    let compatibilityReport: any = null;
    const [parsedData2, parsedData3] = await Promise.all([
        callTerra(BASE_SYSTEM_INSTRUCTION, prompt2, 16384),
        callTerra(SYSTEM_INSTRUCTION_GOLDEN_WINDOW, prompt3, 16384),
        (async () => {
            if (packageId === "signature") {
                compatibilityReport = await callTerra(SYSTEM_INSTRUCTION_COMPATIBILITY, buildPrompt4(promptCtx), 32768);
            }
        })(),
    ]);

    // ── 3. 최종 병합 (inngest와 동일 — 캘린더는 위에서 선확정)
    const aiResult = {
        ...liteResult,
        details: [...(liteResult.details || []), ...(parsedData2.details || [])],
        partnerManual: parsedData2.partnerManual || null,
        goldenWindows: {
            windows: result.windows, bestMonth: result.bestMonth,
            monthlyEnergies: parsedData3.monthlyEnergies, roadmapStages: parsedData3.roadmapStages,
            goldenWindowMonths,
        },
        compatibilityReport,
    };

    // ── 4. 완료 잡 저장
    const { data: ins, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .insert({ status: "completed", ai_result: aiResult, raw_data: { myRawInput, partnerRawInput, metDate, breakupDate, breakupReason, packageId, liteResult, devE2E: true } })
        .select("id").single();
    if (error) return NextResponse.json({ error: "저장 실패", detail: error }, { status: 500 });

    // ── 5. 자동 점검: 프롬프트 산출물 ↔ UI 기대 구조
    const EXPECTED_TITLES = [
        "✨ [본질]", "🧬 [성향]", "🛡️ [심리]", "⏳ [타이밍]", "☠️ [결론]",
        "🫀 [속마음]", "🚨 [경고]", "🥲 [타이밍]", "😈 [전략]", "🌸 [선택]",
    ];
    const detailTitles: string[] = [aiResult.essenceAnalysis?.title, ...aiResult.details.map((d: any) => d.title)].filter(Boolean);
    const titleCheck = EXPECTED_TITLES.map((prefix, i) => ({
        expected: prefix, actual: detailTitles[i] || "(없음)",
        ok: (detailTitles[i] || "").startsWith(prefix),
    }));

    const BANNED = ['오행', '십성', '비견', '겁재', '편관', '정관', '편인', '정인 ', '식신', '상관 ', '편재', '정재 ', '대운', '세운', '월운', '천간', '지지', '합충', '신강', '신약'];
    const allText = JSON.stringify({ d: aiResult.details, e: aiResult.essenceAnalysis, m: aiResult.partnerManual, g: aiResult.goldenWindows.monthlyEnergies, r: aiResult.goldenWindows.roadmapStages, c: compatibilityReport, t: aiResult.secretTeaser, s: aiResult.summary });
    const leaks = BANNED.filter(w => allText.includes(w));

    const pm = aiResult.partnerManual || {};
    const monthly = aiResult.goldenWindows.monthlyEnergies || [];
    const windowMonths = result.windows.map(w => `${w.month}월`);
    const rc = compatibilityReport?.radarChart;

    const checks = {
        jobId: ins.id,
        package: packageId,
        titles: { ok: titleCheck.every(t => t.ok), detail: titleCheck },
        counts: {
            details_9: detailTitles.length === 10 ? '10(본질 포함) OK' : `${detailTitles.length} (기대: 본질1+성향1+심층8=10)`,
            forbiddenWords: pm.forbiddenWords?.length, magicKeywords: pm.magicKeywords?.length,
            dateSpots: pm.dateSpots?.length, textExamples: pm.textExamples?.length,
            monthlyEnergies: monthly.length, roadmapStages: aiResult.goldenWindows.roadmapStages?.length,
            vsCards: compatibilityReport?.vsCards?.length ?? null,
            compatibilityDetails: compatibilityReport?.compatibilityDetails?.length ?? null,
        },
        monthlyEnergyMonths: monthly.map((m: any) => m.month),
        expectedWindowMonths: windowMonths,
        goldenWindowMonths: goldenWindowMonths.map((m: any) => ({ month: m.month, good: m.goodDates, bad: m.badDates })),
        teaserUsesGoldenMonth: result.bestMonth ? (aiResult.secretTeaser || '').includes(`${result.bestMonth.month}월`) : null,
        radarInRange: rc ? Object.entries({ communication: rc.communication, affection: rc.affection, intimacy: rc.intimacy, future: rc.future, conflict: rc.conflict }).every(([, v]) => typeof v === 'number' && v >= 0 && v <= 100) : null,
        coupleType: compatibilityReport?.coupleType ? { emoji: compatibilityReport.coupleType.emoji, label: compatibilityReport.coupleType.label } : null,
        overallGrade: compatibilityReport?.overallGrade ? { grade: compatibilityReport.overallGrade.grade, strengths: compatibilityReport.overallGrade.strengths?.length, weaknesses: compatibilityReport.overallGrade.weaknesses?.length } : null,
        termLeaks: leaks.length ? leaks : "없음(문자열 포함 기준 — 오탐 가능, 별도 확인)",
        secretTeaserPresent: !!aiResult.secretTeaser,
    };

    return NextResponse.json(checks);
}
