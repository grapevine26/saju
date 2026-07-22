import { NextRequest, NextResponse } from "next/server";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility, calculateHapScores, hapGradeFromScore, hapStarsFromScore } from "@/utils/compatibilityCalc";
import { SYSTEM_INSTRUCTION_HAP, buildPromptHap } from "@/constants/aiPrompts";
import { callTerra } from "@/utils/openaiCall";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * [개발 전용] 운명의 합 파이프라인 E2E — Inngest compatibility 분기 미러.
 * ?my=이름,성별,YYYY-MM-DD,HH:MM,도시&partner=...&status=dating|some|marriage
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "not available" }, { status: 404 });
    }

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
        name: "최혁준", gender: "male", calendarType: "solar",
        birthYear: "1995", birthMonth: "12", birthDay: "23",
        birthCity: "seoul", birthHour: "16", birthMinute: "30", isTimeUnknown: false,
    });
    const partnerRawInput = parsePerson(req.nextUrl.searchParams.get("partner"), {
        name: "이나영", gender: "female", calendarType: "solar",
        birthYear: "2002", birthMonth: "9", birthDay: "24",
        birthCity: "seoul", birthHour: "", birthMinute: "", isTimeUnknown: true,
    });
    const relationshipStatus = req.nextUrl.searchParams.get("status") || "dating";

    // ── Inngest compatibility 분기 미러
    const myBazi = calculateBazi(myRawInput.gender as any, myRawInput.calendarType as any, myRawInput.birthYear, myRawInput.birthMonth, myRawInput.birthDay, myRawInput.birthCity, myRawInput.birthHour, myRawInput.birthMinute, myRawInput.isTimeUnknown);
    const partnerBazi = calculateBazi(partnerRawInput.gender as any, partnerRawInput.calendarType as any, partnerRawInput.birthYear, partnerRawInput.birthMonth, partnerRawInput.birthDay, partnerRawInput.birthCity, partnerRawInput.birthHour, partnerRawInput.birthMinute, partnerRawInput.isTimeUnknown);
    const compatibility = calculateCompatibility(myBazi, partnerBazi);
    const hapScores = calculateHapScores(compatibility);

    const report = await callTerra(SYSTEM_INSTRUCTION_HAP, buildPromptHap({
        myRawInput, partnerRawInput, myBazi, partnerBazi,
        compatibilityPromptSummary: compatibility.promptSummary,
        relationshipStatus, hapScores,
    }), 32768);

    const gradeTable = [
        { area: '연애', score: hapScores.romance, grade: hapGradeFromScore(hapScores.romance) },
        { area: '결혼', score: hapScores.marriage, grade: hapGradeFromScore(hapScores.marriage) },
        { area: '재물', score: hapScores.wealth, grade: hapGradeFromScore(hapScores.wealth) },
        { area: '성격', score: hapScores.personality, grade: hapGradeFromScore(hapScores.personality) },
        { area: '가정', score: hapScores.family, grade: hapGradeFromScore(hapScores.family) },
        { area: '소통', score: hapScores.communication, grade: hapGradeFromScore(hapScores.communication) },
    ];

    const aiResult = {
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

    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .insert({ status: "completed", ai_result: aiResult, raw_data: { myRawInput, partnerRawInput, relationshipStatus, packageId: "compatibility", devE2E: true } })
        .select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── 구조 검사
    const rep = report || {};
    const p1 = rep.part1 || {}, p2 = rep.part2 || {}, p3 = rep.part3 || {}, fin = rep.final || {};
    const raw = JSON.stringify(rep);
    const forbidden = ['재회', '헤어졌', '이별했', '무토', '을목', '오행', '십성', '일간', '식신', '상관', '정재', '편재', '정관', '편관', '도화살', '역마살'];
    const leaks = forbidden.filter(w => raw.includes(w));

    return NextResponse.json({
        jobId: job.id,
        hapScores,
        totalGrade: aiResult.totalGrade,
        checks: {
            hero: !!rep.hero?.metaphorLine,
            part1Fields: ['firstImpression', 'scoreComment', 'ohaengHarmony', 'yinYang', 'attraction', 'mutualGrowth', 'conversation', 'loveTemperature', 'pastLife', 'charmPoints', 'bestStrength', 'biggestRisk', 'expertReview', 'quote'].filter(k => !p1[k]),
            part2Fields: ['whoOpensFirst', 'earlyDays', 'deepening', 'fightReasons', 'reconciliation', 'slump', 'dangerSignals', 'affection', 'marriedLife', 'parenting', 'review'].filter(k => !p2[k]),
            part3Fields: ['wealthStructure', 'wealthComment', 'moneyControl', 'business', 'moneyAfterMarriage', 'children', 'lifelong', 'riskyMoment', 'secret', 'oldAge', 'learning', 'review'].filter(k => !p3[k]),
            finalFields: ['oneLineDestiny', 'synergy', 'marriageTiming', 'afterMarriage', 'cautionPeriod', 'avoidActions', 'lastingTips', 'finalReview', 'lastQuote'].filter(k => !fin[k]),
            fightReasonsCount: (p2.fightReasons || []).length,
            charmCounts: [(p1.charmPoints?.myCharms || []).length, (p1.charmPoints?.partnerCharms || []).length],
            termLeaks: leaks,
        },
    });
}
