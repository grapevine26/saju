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
}

/** 코드 조회 + 유효성 판정. 유효하면 레코드 반환, 아니면 null. */
export async function findValidCode(code: string): Promise<DiscountCode | null> {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return null;

    const { data } = await supabaseAdmin
        .from('discount_codes')
        .select('code, percent, expires_at, used_at')
        .eq('code', normalized)
        .maybeSingle();

    if (!data) return null;
    if (data.used_at) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    return data as DiscountCode;
}

/**
 * 코드 소진 처리 — used_at IS NULL 조건부 업데이트로 동시 사용을 차단.
 * 성공(이번 요청이 소진) 시 true, 이미 사용됐거나 없는 코드면 false.
 */
export async function consumeCode(code: string, orderId: string): Promise<boolean> {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return false;

    const { data, error } = await supabaseAdmin
        .from('discount_codes')
        .update({ used_at: new Date().toISOString(), used_order_id: orderId })
        .eq('code', normalized)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .select('code');

    if (error) {
        console.error('[discount] consume 실패:', error);
        return false;
    }
    return !!data?.length;
}
