import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility, calculateHapScores } from "@/utils/compatibilityCalc";
import { SYSTEM_INSTRUCTION_HAP_LITE, buildPromptHapLite } from "@/constants/aiPrompts";
import { callTerra } from "@/utils/openaiCall";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * 운명의 합 — 무료 미리보기용 AI 진단 + 블러 티저 (재회사주 lite/prompt1과 같은 원칙).
 * 결정론 점수만으로는 "내 얘기다" 싶은 순간이 없어 전환이 약하다는 판단 —
 * 짧은 AI 진단(essence) + 결제를 유도하는 블러 티저(secretTeaser)를 별도 호출로 얹는다.
 * 실제 AI 호출이라 원가가 있으므로 /api/hap/preview(결정론, 0원)와 달리 레이트리밋 적용.
 */
export async function POST(request: Request) {
    try {
        if (process.env.NODE_ENV !== 'development') {
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabaseAdmin
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('action', 'hap_lite')
                .gte('created_at', today.toISOString());

            if (countError) {
                console.error("[hap/preview-ai] Rate limit check error:", countError);
            } else if (count !== null && count >= 5) {
                return NextResponse.json({ success: false, error: "오늘의 무료 진단 한도를 모두 사용하셨습니다." }, { status: 429 });
            }

            supabaseAdmin.from('api_usage_logs').insert({ ip_address: ip, action: 'hap_lite' }).then(({ error }) => {
                if (error) console.error("[hap/preview-ai] Usage logging error:", error);
            });
        }

        const { my, partner, relationshipStatus } = await request.json();
        if (!my?.birthYear || !partner?.birthYear) {
            return NextResponse.json({ success: false, error: "생년월일 정보가 필요합니다." }, { status: 400 });
        }

        const myBazi = calculateBazi(
            my.gender, my.calendarType || 'solar',
            my.birthYear, my.birthMonth, my.birthDay,
            my.birthCity || 'seoul', my.birthHour || '', my.birthMinute || '',
            !!my.isTimeUnknown, my.birthTimezone, my.birthLongitude
        );
        const partnerBazi = calculateBazi(
            partner.gender, partner.calendarType || 'solar',
            partner.birthYear, partner.birthMonth, partner.birthDay,
            partner.birthCity || 'seoul', partner.birthHour || '', partner.birthMinute || '',
            !!partner.isTimeUnknown, partner.birthTimezone, partner.birthLongitude
        );
        const compatibility = calculateCompatibility(myBazi, partnerBazi);
        const hapScores = calculateHapScores(compatibility);

        const teaser = await callTerra(
            SYSTEM_INSTRUCTION_HAP_LITE,
            buildPromptHapLite({
                myRawInput: my, partnerRawInput: partner, myBazi, partnerBazi,
                compatibilityPromptSummary: compatibility.promptSummary,
                relationshipStatus, hapScores,
            }),
            4096,
        );

        if (!teaser?.essence || !teaser?.secretTeaser) {
            return NextResponse.json({ success: false, error: "진단 생성에 실패했습니다." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                coreLine: teaser.coreLine || null,
                essence: teaser.essence,
                secretTeaser: teaser.secretTeaser,
            },
        });
    } catch (e) {
        console.error("[hap/preview-ai] 계산 실패:", e);
        return NextResponse.json({ success: false, error: "진단 생성에 실패했습니다." }, { status: 500 });
    }
}
