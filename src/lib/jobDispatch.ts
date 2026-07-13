// ─────────────────────────────────────────────
// Inngest 이벤트 발송 안전망
//
// 결제 승인 후 잡은 생성됐는데 inngest.send가 일시 장애로 실패하면,
// 예전에는 500이 떨어져 "돈은 나갔는데 에러 화면"이 됐다.
// 이제는 발송 실패를 raw_data.dispatch_failed 플래그로 잡에 남기고
// jobId를 정상 반환한다. 결과 대기 화면의 상태 폴링(job-status/tarot·status)이
// 플래그를 발견하면 자동으로 재발송해 사람 개입 없이 복구된다.
// ─────────────────────────────────────────────

import { inngest } from "@/inngest/client";
import { supabaseAdmin } from "@/lib/supabase";

/** inngest.send를 감싸 실패해도 throw하지 않는다. 성공 여부를 반환. */
export async function safeSend(event: { name: string; data: any }): Promise<boolean> {
    try {
        await inngest.send(event);
        return true;
    } catch (e) {
        console.error(`[inngest] 이벤트 발송 실패 (${event.name}):`, e);
        return false;
    }
}

/** premium_analysis_jobs 행(재회·작명 공용)으로부터 원본과 동일한 형태의 이벤트를 복원 */
export function buildPremiumEventFromJob(job: {
    id: string;
    phone_number?: string | null;
    user_id?: string | null;
    raw_data?: any;
}) {
    const isNaming = job.raw_data?.service === "naming";
    return {
        name: isNaming ? "naming.premium.requested" : "analysis.premium.requested",
        data: {
            jobId: job.id,
            phone_number: job.phone_number || undefined,
            user_id: job.user_id || undefined,
            customerEmail: job.raw_data?.customerEmail || undefined,
            raw_data: job.raw_data,
            // onFailure 자동 환불이 이벤트의 paymentKey를 읽으므로 재발송에도 포함
            paymentKey: job.raw_data?.paymentKey || undefined,
        },
    };
}

/** tarot_reading_jobs 행으로부터 원본과 동일한 형태의 이벤트를 복원 */
export function buildTarotEventFromJob(job: {
    id: string;
    payment_key?: string | null;
    raw_data?: any;
}) {
    return {
        name: "tarot.reading.requested",
        data: {
            jobId: job.id,
            input: job.raw_data?.input,
            rounds: job.raw_data?.rounds,
            freeResult: job.raw_data?.freeResult,
            paymentKey: job.raw_data?.paymentKey || job.payment_key || undefined,
            customerEmail: job.raw_data?.customerEmail,
        },
    };
}

/** 발송 실패 플래그 기록 — 이 업데이트마저 실패해도 흐름은 막지 않는다 */
export async function markDispatchFailed(
    table: "premium_analysis_jobs" | "tarot_reading_jobs",
    jobId: string,
    rawData: any,
): Promise<void> {
    try {
        await supabaseAdmin
            .from(table)
            .update({ raw_data: { ...rawData, dispatch_failed: true } })
            .eq("id", jobId);
    } catch (e) {
        console.error(`[inngest] dispatch_failed 플래그 기록 실패 (${jobId}):`, e);
    }
}

/**
 * pending + dispatch_failed 잡의 이벤트 재발송.
 * 플래그를 먼저 조건부 업데이트로 내려(선점) 동시 폴링에 의한 중복 발송을 막고,
 * 발송이 실패하면 플래그를 복원해 다음 폴링이 다시 시도하게 한다.
 */
export async function redispatchIfNeeded(
    table: "premium_analysis_jobs" | "tarot_reading_jobs",
    job: { id: string; status: string; raw_data?: any; [k: string]: any },
): Promise<void> {
    if (job.status !== "pending" || job.raw_data?.dispatch_failed !== true) return;

    try {
        // 선점: dispatch_failed=true인 행만 플래그를 내린다. 0행이면 다른 요청이 이미 처리 중.
        const { data: claimed } = await supabaseAdmin
            .from(table)
            .update({ raw_data: { ...job.raw_data, dispatch_failed: false } })
            .eq("id", job.id)
            .filter("raw_data->>dispatch_failed", "eq", "true")
            .select("id");

        if (!claimed?.length) return;

        const event = table === "tarot_reading_jobs"
            ? buildTarotEventFromJob(job as any)
            : buildPremiumEventFromJob(job as any);

        const ok = await safeSend(event);
        if (ok) {
            console.log(`[inngest] 유실 이벤트 재발송 성공: ${job.id} (${event.name})`);
        } else {
            // 실패 시 플래그 복원 → 다음 폴링에서 재시도
            await markDispatchFailed(table, job.id, job.raw_data);
        }
    } catch (e) {
        console.error(`[inngest] 재발송 처리 오류 (${job.id}):`, e);
    }
}
