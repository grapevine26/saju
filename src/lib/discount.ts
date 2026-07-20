// ─────────────────────────────────────────────
// 후기 보상 할인 코드 (서버 전용)
// 발급: 후기 제출 시 20% · 30일 · 1회용
// 사용: 결제 승인 시점에 원자적으로 소진 처리
// 금액 검증은 항상 서버 가격표 기준 — 클라이언트 금액은 신뢰하지 않는다.
// ─────────────────────────────────────────────

import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const REVIEW_DISCOUNT_PERCENT = 20;
export const DISCOUNT_VALID_DAYS = 30;

/** 정가에 percent 할인을 적용한 결제 금액 (10원 단위 내림 없이 정수 반올림) */
export function applyDiscount(price: number, percent: number): number {
    return Math.round(price * (100 - percent) / 100);
}

/** 혼동 문자(0/O, 1/I/L) 제외 32진 코드 생성 — 예: RE20-A3F9K2 */
export function generateCode(): string {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const bytes = randomBytes(6);
    let body = '';
    for (let i = 0; i < 6; i++) body += chars[bytes[i] % chars.length];
    return `RE${REVIEW_DISCOUNT_PERCENT}-${body}`;
}

export interface DiscountCode {
    code: string;
    percent: number;
    expires_at: string;
    used_at: string | null;
    max_uses: number | null;
    use_count: number;
}

/**
 * 코드 조회 + 유효성 판정. 유효하면 레코드 반환, 아니면 null.
 * max_uses가 NULL이면 1회용(used_at 기준), 값이 있으면 공유 코드(use_count < max_uses).
 */
export async function findValidCode(code: string): Promise<DiscountCode | null> {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return null;

    const { data } = await supabaseAdmin
        .from('discount_codes')
        .select('code, percent, expires_at, used_at, max_uses, use_count')
        .eq('code', normalized)
        .maybeSingle();

    if (!data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    if (data.max_uses == null) {
        if (data.used_at) return null;            // 1회용: 이미 사용됨
    } else {
        if (data.use_count >= data.max_uses) return null; // 공유: 한도 소진
    }
    return data as DiscountCode;
}

/**
 * 코드 소진 처리 — 조건부 업데이트로 동시 사용을 차단.
 * 1회용: used_at IS NULL 조건. 공유 코드: use_count < max_uses 조건 + 카운트 증가.
 * 성공(이번 요청이 소진) 시 true.
 */
export async function consumeCode(code: string, orderId: string): Promise<boolean> {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return false;

    const { data: row } = await supabaseAdmin
        .from('discount_codes')
        .select('max_uses, use_count')
        .eq('code', normalized)
        .maybeSingle();
    if (!row) return false;

    const now = new Date().toISOString();
    let query;
    if (row.max_uses == null) {
        // 1회용 — 원자적 소진
        query = supabaseAdmin
            .from('discount_codes')
            .update({ used_at: now, used_order_id: orderId })
            .eq('code', normalized)
            .is('used_at', null)
            .gt('expires_at', now);
    } else {
        // 공유 코드 — 조건부 카운트 증가 (읽은 값 기준 CAS: 동시 요청이 겹치면 한쪽만 성공하고
        // 다른 쪽은 재검증 없이 실패 처리되는데, 웰컴 쿠폰 특성상 손해가 아니라 허용)
        query = supabaseAdmin
            .from('discount_codes')
            .update({ use_count: row.use_count + 1, used_order_id: orderId })
            .eq('code', normalized)
            .eq('use_count', row.use_count)
            .lt('use_count', row.max_uses)
            .gt('expires_at', now);
    }

    const { data, error } = await query.select('code');
    if (error) {
        console.error('[discount] consume 실패:', error);
        return false;
    }
    return !!data?.length;
}
