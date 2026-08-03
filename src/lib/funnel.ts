// ─────────────────────────────────────────────
// 퍼널 이벤트 서버 기록 헬퍼
// paid 이벤트는 결제 승인 라우트에서 잡 생성 직후 호출한다.
// order_key(jobId) UNIQUE 제약으로 새로고침·중복 요청에도 1회만 기록된다.
// 추적 실패는 결제 흐름에 절대 영향을 주지 않는다.
// ─────────────────────────────────────────────

import { supabaseAdmin } from './supabase';

export interface ClientUtm {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
}

/** 결제 유형 — admin 매출 집계(countsAsRevenue)와 동일한 구분 */
export type PaidSource = 'toss' | 'dev' | 'free_pass' | 'zero_won_coupon';

export async function recordPaidEvent(params: {
    service: 'saju' | 'tarot' | 'naming' | 'hap';
    jobId: string;
    amount: number;
    source: PaidSource;
    utm?: ClientUtm | null;
    visitorId?: string | null;
}): Promise<void> {
    try {
        // 개발모드·관리자 프리패스는 실고객 전환이 아니므로 퍼널에서 제외.
        // (0원 쿠폰은 실고객이 결제 플로우를 완주한 것이므로 기록한다)
        if (params.source === 'dev' || params.source === 'free_pass') return;
        const { error } = await supabaseAdmin.from('funnel_events').insert({
            event: 'paid',
            service: params.service,
            order_key: params.jobId,
            amount: params.amount,
            utm_source: params.utm?.source?.slice(0, 80) || null,
            utm_medium: params.utm?.medium?.slice(0, 80) || null,
            utm_campaign: params.utm?.campaign?.slice(0, 120) || null,
            visitor_id: params.visitorId?.slice(0, 64) || null,
        });
        // 중복(order_key unique 충돌)은 정상 — 멱등 재요청이므로 무시
        if (error && error.code !== '23505') {
            console.error('[funnel] paid 이벤트 기록 실패:', error.message);
        }
    } catch (e) {
        console.error('[funnel] paid 이벤트 기록 오류:', e);
    }
}
