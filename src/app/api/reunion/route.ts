import { NextResponse } from "next/server";
import { SYSTEM_INSTRUCTION_LITE, buildPrompt1 } from "@/constants/aiPrompts";
import { schema1 } from "@/constants/aiSchemas";
import { calculateBazi, BaziCalculationResult } from "@/utils/baziCalc";
import { calculateCompatibility } from "@/utils/compatibilityCalc";
import { calculateGoldenWindows } from "@/utils/goldenWindowCalc";
import { genAI, callGemini } from "@/utils/geminiCall";
import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";

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

        // ─────────────────────────────────────
        // 0. API 호출 제한 (Rate Limit - 5회/일)
        //    tier는 클라이언트 입력이므로 신뢰하지 않는다. 이 엔드포인트는 무료 분석 경로이며
        //    (유료 심층 분석은 결제 후 Inngest에서 별도 처리) 항상 IP 기준으로 제한한다.
        // ─────────────────────────────────────
        if (process.env.NODE_ENV !== 'development') { // 개발 모드는 무료 한도 미적용 (타로 free-reading과 동일)
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabaseAdmin
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('action', 'lite_analysis')
                .gte('created_at', today.toISOString());

            if (countError) {
                console.error("Rate limit check error:", countError);
            } else if (count !== null && count >= 5) {
                return NextResponse.json(
                    { success: false, error: "오늘의 무료 분석 한도(5회)를 모두 사용하셨습니다. 내일 다시 시도해 주세요!" },
                    { status: 429 }
                );
            }

            // 호출 로그 기록 (비동기)
            supabaseAdmin.from('api_usage_logs').insert({
                ip_address: ip,
                action: 'lite_analysis'
            }).then(({ error }) => {
                if (error) console.error("Usage logging error:", error);
            });
        }

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

        // 3-1. 연락 최적 시기 사전 계산 — 티저(secretTeaser)가 임의의 시기("1개월 내" 등)를
        // 지어내면 프리미엄의 골든 윈도우 캘린더와 모순되므로, 같은 결정론 계산 결과를
        // 프롬프트에 주입해 무료 단계부터 시기를 일치시킨다.
        const gwPreview = calculateGoldenWindows(
            myBazi.manseryeok.day.gan, myBazi.manseryeok.day.zhi,
            partnerBazi.manseryeok.day.gan, partnerBazi.manseryeok.day.zhi,
            6,
        );
        const goldenMonths = gwPreview.windows.filter(w => w.isGolden).map(w => `${w.year}년 ${w.month}월`);
        const gwSummaryForPrompt = gwPreview.bestMonth
            ? `- 연락 최적기(향후 6개월 중 최고점): ${gwPreview.bestMonth.year}년 ${gwPreview.bestMonth.month}월 (에너지 ${gwPreview.bestMonth.score}점)${goldenMonths.length > 1 ? `\n- 그 외 좋은 달: ${goldenMonths.join(', ')}` : ''}`
            : null;

        // ─────────────────────────────────────
        // 4. Gemini AI 재회 분석 호출
        // 프롬프트·스키마는 공유 상수 사용 (Inngest 폴백과 동일 소스 — 드리프트 방지)
        // 모델: 티저가 결제 전환의 핵심 문구이므로 lite가 아닌 flash 사용
        // ─────────────────────────────────────
        const model1 = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION_LITE,
            generationConfig: { responseMimeType: "application/json", responseSchema: schema1 }
        });

        const prompt1 = buildPrompt1({
            myRawInput: my,
            partnerRawInput: partner,
            myBazi,
            partnerBazi,
            compatibilityPromptSummary: compatibility.promptSummary,
            metDate, breakupDate, breakupReason,
            goldenWindowSummary: gwSummaryForPrompt || undefined,
        });

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

        // [본질]을 독립 카드용 데이터로 분리 — 모델이 순서를 바꿔도 안전하도록
        // 제목 매칭을 우선하고, 못 찾으면 첫 항목으로 폴백
        const details1: any[] = parsedData1.details || [];
        const essenceIdx = details1.findIndex((d: any) => typeof d?.title === 'string' && d.title.includes('[본질]'));
        const pickIdx = essenceIdx >= 0 ? essenceIdx : 0;
        const essenceAnalysis = details1.length > 0 ? details1[pickIdx] : null;
        const remainingDetails1 = details1.filter((_: any, i: number) => i !== pickIdx);

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
