import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from "@/lib/supabase";
import { NAMING_PAYMENT_ENABLED } from "@/features/naming/constants";
import { safeSend, markDispatchFailed } from "@/lib/jobDispatch";
import { resolveSurname } from "@/features/naming/data/surnames";
import { NamingInput } from "@/features/naming/types";

// ─────────────────────────────────────────────
// 작명 리포트 무료 발급 API (결제 보류 기간 전용)
// 결제 없이 바로 작업을 생성하고 Inngest 이벤트를 발송한다.
// NAMING_PAYMENT_ENABLED가 true가 되면 이 엔드포인트는 자동 차단되어
// 결제 우회 경로로 악용될 수 없다.
// ─────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        // 결제가 활성화되면 무료 발급 경로를 봉쇄한다
        if (NAMING_PAYMENT_ENABLED) {
            return NextResponse.json(
                { success: false, error: "무료 발급 기간이 종료되었습니다. 결제 후 이용해 주세요." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const namingInput = body.namingInput as NamingInput;
        const customerEmail = (body.customerEmail as string) || null;

        // ── 입력 검증 ──
        if (!namingInput?.surname || !namingInput?.birthYear || !namingInput?.birthMonth || !namingInput?.birthDay) {
            return NextResponse.json(
                { success: false, error: "필수 입력값이 누락되었습니다." },
                { status: 400 }
            );
        }
        if (!resolveSurname(namingInput.surname, namingInput.surnameHanja)) {
            return NextResponse.json(
                { success: false, error: "지원하지 않는 성씨입니다." },
                { status: 400 }
            );
        }

        // ── 호출 제한 (무료 전체 리포트 3회/일 — Gemini 비용 보호) ──
        try {
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count } = await supabaseAdmin
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('action', 'naming_report_free')
                .gte('created_at', today.toISOString());

            if (count !== null && count >= 3 && process.env.NODE_ENV !== 'development') {
                return NextResponse.json(
                    { success: false, error: "오늘의 무료 리포트 발급 한도(3회)를 모두 사용하셨습니다. 내일 다시 시도해 주세요!" },
                    { status: 429 }
                );
            }

            supabaseAdmin.from('api_usage_logs').insert({
                ip_address: ip,
                action: 'naming_report_free'
            }).then(({ error }) => {
                if (error) console.error("[작명] 무료 발급 로그 기록 실패:", error);
            });
        } catch (e) {
            console.error("[작명] 무료 발급 Rate limit 확인 실패 (발급은 계속 진행):", e);
        }

        // ── 작업 생성 + 백그라운드 리포트 생성 시작 ──
        const rawData = {
            service: 'naming',
            namingInput,
            customerEmail,
            // 무료 발급 표시 (결제 건과 구분, paymentKey 없음 → 환불 로직 자동 스킵)
            freeIssue: true,
        };

        const { data: job, error } = await supabaseAdmin
            .from("premium_analysis_jobs")
            .insert({
                // phone_number는 NOT NULL 제약이 있으나 작명은 전화번호를 받지 않으므로
                // 서비스 식별용 플레이스홀더를 저장한다 (관리자 대시보드에서 구분 용도로도 활용)
                phone_number: "naming-free",
                status: "pending",
                raw_data: rawData
            })
            .select()
            .single();

        if (error || !job) {
            console.error("[작명] 무료 발급 작업 생성 실패:", error);
            return NextResponse.json(
                { success: false, error: "시스템 오류로 리포트 생성을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요." },
                { status: 500 }
            );
        }

        // 발송 실패해도 잡은 살아있으므로 jobId를 반환 — 상태 폴링이 자동 재발송한다.
        const sent = await safeSend({
            name: "naming.premium.requested",
            data: {
                jobId: job.id,
                customerEmail: customerEmail || undefined,
                raw_data: rawData,
                // paymentKey 없음 → 실패 시 환불 로직은 동작하지 않음
            }
        });
        if (!sent) {
            await markDispatchFailed("premium_analysis_jobs", job.id, rawData);
        }

        return NextResponse.json({ success: true, jobId: job.id });

    } catch (error) {
        console.error('[작명] 무료 발급 API 에러:', error);
        return NextResponse.json(
            { success: false, error: "서버 내부 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
