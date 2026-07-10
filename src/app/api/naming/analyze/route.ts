import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { calculateBazi } from "@/utils/baziCalc";
import { genAI, callGemini } from "@/utils/geminiCall";
import { supabaseAdmin } from "@/lib/supabase";
import { NamingInput } from "@/features/naming/types";
import { resolveSurname } from "@/features/naming/data/surnames";
import { diagnoseOhaeng } from "@/features/naming/ohaengAnalysis";
import { generateNameCandidates } from "@/features/naming/nameGenerator";
import {
    NAMING_SYSTEM_INSTRUCTION,
    buildTeaserPrompt,
    teaserSchema,
} from "@/features/naming/namingPrompt";

// ─────────────────────────────────────────────
// 작명 무료 진단 API (퍼널 3단계: 결핍의 자각)
// 구성: 결정론 연산(명식·오행·균형) + flash-lite 개인화 소견(teaser)
// - teaser는 명식의 실제 글자를 인용하는 '정밀 소견' 전용. 실패해도
//   진단은 결정론 데이터만으로 계속 진행된다 (비치명적).
// - 이름 후보는 '개수'만 노출하고 실제 이름은 리포트 발급 후 공개한다.
// ─────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const input = body.input as NamingInput;

        // ── 0. 입력 검증 ──
        if (!input?.surname || !input?.birthYear || !input?.birthMonth || !input?.birthDay) {
            return NextResponse.json(
                { success: false, error: "필수 입력값이 누락되었습니다." },
                { status: 400 }
            );
        }

        // 동음이성 성씨는 유저가 선택한 한자로 확정 (미지정 시 대표 한자)
        const surname = resolveSurname(input.surname, input.surnameHanja);
        if (!surname) {
            return NextResponse.json(
                { success: false, error: "아직 지원하지 않는 성씨입니다. 카카오톡 채널로 문의해 주시면 빠르게 추가해 드릴게요." },
                { status: 400 }
            );
        }

        // ── 1. 호출 제한 (무료 진단 5회/일, 기존 api_usage_logs 테이블 재사용) ──
        try {
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count } = await supabaseAdmin
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('action', 'naming_lite')
                .gte('created_at', today.toISOString());

            if (count !== null && count >= 5 && process.env.NODE_ENV !== 'development') {
                return NextResponse.json(
                    { success: false, error: "오늘의 무료 작명 진단 한도(5회)를 모두 사용하셨습니다. 내일 다시 시도해 주세요!" },
                    { status: 429 }
                );
            }

            supabaseAdmin.from('api_usage_logs').insert({
                ip_address: ip,
                action: 'naming_lite'
            }).then(({ error }) => {
                if (error) console.error("[작명] 사용량 로그 기록 실패:", error);
            });
        } catch (e) {
            console.error("[작명] Rate limit 확인 실패 (진단은 계속 진행):", e);
        }

        // ── 2. 사주 명식 + 오행 결핍 연산 (100% 규칙 기반) ──
        const bazi = calculateBazi(
            input.gender, input.calendarType,
            input.birthYear, input.birthMonth, input.birthDay,
            'seoul', input.birthHour || '', input.birthMinute || '',
            input.isTimeUnknown
        );

        const diagnosis = diagnoseOhaeng(bazi.ohhaengCounts);

        // 결제 전 신뢰 요소: 사격 길수를 만족하는 후보가 실제 몇 개 확보되는지 미리 연산
        const candidates = generateNameCandidates(surname, input.gender, diagnosis, 10, input.value);

        // ── 3. flash-lite 개인화 소견 (비치명적 — 실패 시 결정론 진단만 노출) ──
        let teaser: any = null;
        if (process.env.GEMINI_API_KEY) {
            try {
                const model = genAI.getGenerativeModel({
                    model: "gemini-3.1-flash-lite",
                    systemInstruction: NAMING_SYSTEM_INSTRUCTION,
                    generationConfig: { responseMimeType: "application/json", responseSchema: teaserSchema },
                });
                teaser = await callGemini(model, buildTeaserPrompt({
                    input, surname, baziStr: bazi.baziStr, diagnosis,
                }));
            } catch (e) {
                console.error("[작명] 무료 진단 AI 소견 생성 실패 (결정론 진단으로 계속):", e);
            }
        }

        // ── 4. 응답 (이름 후보 자체는 절대 노출하지 않음) ──
        return NextResponse.json({
            success: true,
            data: {
                surname: { hangul: surname.hangul, hanja: surname.hanja, strokes: surname.strokes },
                baziStr: bazi.baziStr,
                manseryeok: bazi.manseryeok,
                diagnosis: {
                    counts: diagnosis.counts,
                    percentages: diagnosis.percentages,
                    missing: diagnosis.missing,
                    weakest: diagnosis.weakest,
                    strongest: diagnosis.strongest,
                    complement: diagnosis.complement,
                },
                teaser,
                candidateCount: candidates.length,
            }
        });

    } catch (error) {
        console.error("[작명] 무료 진단 API 에러:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
