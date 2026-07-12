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

export async function recordPaidEvent(params: {
    service: 'saju' | 'tarot' | 'naming';
    jobId: string;
    amount: number;
    utm?: ClientUtm | null;
    visitorId?: string | null;
}): Promise<void> {
    try {
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
