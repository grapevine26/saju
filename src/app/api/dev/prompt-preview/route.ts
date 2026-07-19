import { NextResponse } from "next/server";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { calculateGoldenWindows, calculateGoldenDates } from "@/utils/goldenWindowCalc";
import { buildCommonPrompt, buildPrompt2, buildPrompt3 } from "@/constants/aiPrompts";

export const dynamic = "force-dynamic";

/**
 * [개발 전용] 프롬프트 빌더 검증 라우트 — Gemini 호출 없이 실제 빌더가 만드는
 * 프롬프트 전문을 반환한다. 프롬프트 개편 검증이 끝나면 삭제해도 무방.
 */
export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "not available" }, { status: 404 });
    }

    const my = {
        name: "나영", gender: "female", calendarType: "solar" as const,
        birthYear: "1995", birthMonth: "7", birthDay: "15",
        birthCity: "seoul", birthHour: "", birthMinute: "", isTimeUnknown: true,
    };
    const partner = {
        name: "혁준", gender: "male", calendarType: "solar" as const,
        birthYear: "1993", birthMonth: "11", birthDay: "2",
        birthCity: "seoul", birthHour: "14", birthMinute: "30", isTimeUnknown: false,
    };

    const myBazi = calculateBazi(my.gender as any, my.calendarType, my.birthYear, my.birthMonth, my.birthDay, my.birthCity, my.birthHour, my.birthMinute, my.isTimeUnknown);
    const partnerBazi = calculateBazi(partner.gender as any, partner.calendarType, partner.birthYear, partner.birthMonth, partner.birthDay, partner.birthCity, partner.birthHour, partner.birthMinute, partner.isTimeUnknown);
    const compatibility = calculateCompatibility(myBazi, partnerBazi);
    const gw = calculateGoldenWindows(
        myBazi.manseryeok.day.gan, myBazi.manseryeok.day.zhi,
        partnerBazi.manseryeok.day.gan, partnerBazi.manseryeok.day.zhi, 6,
    );
    const goldenList = gw.windows.filter(w => w.isGolden).map(w => `${w.year}년 ${w.month}월`);
    const gwSummary = gw.bestMonth
        ? `- 연락 최적기(향후 6개월 중 최고점): ${gw.bestMonth.year}년 ${gw.bestMonth.month}월 (에너지 ${gw.bestMonth.score}점)${goldenList.length > 1 ? `\n- 그 외 좋은 달: ${goldenList.join(', ')}` : ''}`
        : undefined;

    const ctx = {
        myRawInput: my, partnerRawInput: partner, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
        metDate: "2024년 5월", breakupDate: "2026-03", breakupReason: "연락 문제로 다투다가 상대가 지쳤다며 이별을 통보했어요.",
        goldenWindowSummary: gwSummary,
    };

    const windowSummary = gw.windows.map(w =>
        `- ${w.year}년 ${w.month}월 (에너지 점수: ${w.score}점, 골든 여부: ${w.isGolden ? '예' : '아니오'}): ${w.reasons.join(', ')}`
    ).join('\n');

    const goldenDates = gw.bestMonth ? calculateGoldenDates(gw.bestMonth.year, gw.bestMonth.month, myBazi.manseryeok.day.gan, myBazi.manseryeok.day.zhi, partnerBazi.manseryeok.day.gan, partnerBazi.manseryeok.day.zhi) : [];
    const bestWindowSummary = gw.bestMonth
        ? `${gw.bestMonth.year}년 ${gw.bestMonth.month}월${goldenDates.length ? ` (길일: ${goldenDates.map(d => `${d.day}일`).join(', ')})` : ''}`
        : undefined;

    const body = [
        "═══════════ 검증 메타 ═══════════",
        `나의 대운: ${myBazi.daeunStr}`,
        `상대 대운: ${partnerBazi.daeunStr}`,
        `나의 신살: ${myBazi.uniqueShinsal}`,
        `상대 신살: ${partnerBazi.uniqueShinsal}`,
        `길일: ${goldenDates.map(d => `${d.day}일(${d.dayGan}${d.dayZhi}, ${d.score}점)`).join(', ')}`,
        "",
        "═══════════ COMMON PROMPT ═══════════",
        buildCommonPrompt(ctx),
        "",
        "═══════════ PROMPT 2 (앞부분 3000자) ═══════════",
        buildPrompt2(ctx, "분석 결과, 결정적 시기는 [BLUR]12월[/BLUR]입니다.").slice(0, 3000),
        "",
        "═══════════ PROMPT 3 ═══════════",
        buildPrompt3({
            myName: my.name, myGender: my.gender, partnerName: partner.name, partnerGender: partner.gender,
            myDayGan: myBazi.manseryeok.day.gan, myDayZhi: myBazi.manseryeok.day.zhi,
            partnerDayGan: partnerBazi.manseryeok.day.gan, partnerDayZhi: partnerBazi.manseryeok.day.zhi,
            mySipsin: myBazi.sipsinSummary, partnerSipsin: partnerBazi.sipsinSummary,
            windowSummary, bestWindowSummary, metDate: ctx.metDate, breakupDate: ctx.breakupDate, breakupReason: ctx.breakupReason,
        }),
    ].join('\n');

    return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
