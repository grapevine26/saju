// ─────────────────────────────────────────────
// 개인정보 보유기간 만료 데이터 파기
//
// 개인정보처리방침: "유료서비스 결과 다시보기 — 결제일로부터 최대 5년 보유 후 파기"
// 이 모듈이 그 약속을 실제로 집행한다. 결제·분석 잡(raw_data에 실명·생년월일·
// 사연·이메일 포함)과 그에 딸린 후기·할인코드·퍼널 이벤트를 함께 삭제한다.
//
// 삭제 순서 (FK 제약: discount_codes.review_id → reviews.id):
//   1. discount_codes (만료 잡의 후기가 발급한 코드)
//   2. reviews        (만료 잡의 후기 — comment에 개인 서술 포함 가능)
//   3. funnel_events  (만료 잡의 결제 이벤트)
//   4. 잡 본체        (premium_analysis_jobs / tarot_reading_jobs)
// ─────────────────────────────────────────────

import { supabaseAdmin } from '@/lib/supabase';

export const RETENTION_YEARS = 5;
const BATCH = 500;

export interface PurgeResult {
    premiumJobs: number;
    tarotJobs: number;
    reviews: number;
    discountCodes: number;
    funnelEvents: number;
    cutoff: string;
}

/** 보유기간(5년)이 지난 잡과 부속 데이터를 배치 단위로 파기한다. */
export async function purgeExpiredResults(now: Date = new Date()): Promise<PurgeResult> {
    const cutoffDate = new Date(now);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);
    const cutoff = cutoffDate.toISOString();

    const result: PurgeResult = { premiumJobs: 0, tarotJobs: 0, reviews: 0, discountCodes: 0, funnelEvents: 0, cutoff };

    for (const table of ['premium_analysis_jobs', 'tarot_reading_jobs'] as const) {
        // 무한 루프 방지 상한 (배치 500 × 200 = 최대 10만 행/실행)
        for (let i = 0; i < 200; i++) {
            const { data: expired, error: selErr } = await supabaseAdmin
                .from(table)
                .select('id')
                .lt('created_at', cutoff)
                .limit(BATCH);
            if (selErr) throw new Error(`[retention] ${table} 조회 실패: ${selErr.message}`);
            if (!expired || expired.length === 0) break;

            const ids = expired.map((r) => r.id);

            // 1) 이 잡들의 후기 → 후기가 발급한 할인코드부터 제거 (FK 순서)
            const { data: reviewRows } = await supabaseAdmin
                .from('reviews').select('id').in('job_id', ids);
            const reviewIds = (reviewRows ?? []).map((r) => r.id);
            if (reviewIds.length > 0) {
                const { data: codes } = await supabaseAdmin
                    .from('discount_codes').delete().in('review_id', reviewIds).select('code');
                result.discountCodes += codes?.length ?? 0;
                const { data: revs } = await supabaseAdmin
                    .from('reviews').delete().in('id', reviewIds).select('id');
                result.reviews += revs?.length ?? 0;
            }

            // 2) 퍼널 이벤트 (order_key = jobId)
            const { data: funnel } = await supabaseAdmin
                .from('funnel_events').delete().in('order_key', ids).select('id');
            result.funnelEvents += funnel?.length ?? 0;

            // 3) 잡 본체
            const { data: deleted, error: delErr } = await supabaseAdmin
                .from(table).delete().in('id', ids).select('id');
            if (delErr) throw new Error(`[retention] ${table} 삭제 실패: ${delErr.message}`);
            const n = deleted?.length ?? 0;
            if (table === 'premium_analysis_jobs') result.premiumJobs += n;
            else result.tarotJobs += n;

            if (expired.length < BATCH) break;
        }
    }

    return result;
}
