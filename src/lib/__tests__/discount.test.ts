import { describe, it, expect, vi } from 'vitest';

// discount.ts가 최상단에서 supabaseAdmin을 import하므로, 순수 함수만 테스트할 수 있게 목 처리
vi.mock('@/lib/supabase', () => ({ supabase: {}, supabaseAdmin: {} }));

import { applyDiscount, generateCode, REVIEW_DISCOUNT_PERCENT } from '../discount';

describe('할인 금액 계산 (applyDiscount)', () => {
    it('실제 가격표 × 20% 할인 — 결제 승인 라우트의 기대 금액과 일치해야 함', () => {
        expect(applyDiscount(19900, 20)).toBe(15920); // 재회 프리미엄
        expect(applyDiscount(34900, 20)).toBe(27920); // 재회 시그니처
        expect(applyDiscount(3900, 20)).toBe(3120);   // 타로
    });

    it('경계값 — 0%는 정가, 100%는 0원', () => {
        expect(applyDiscount(19900, 0)).toBe(19900);
        expect(applyDiscount(19900, 100)).toBe(0);
    });

    it('나누어떨어지지 않는 금액은 정수로 반올림', () => {
        expect(applyDiscount(9999, 20)).toBe(7999);   // 7999.2 → 7999
        expect(Number.isInteger(applyDiscount(12345, 33))).toBe(true);
    });
});

describe('할인 코드 생성 (generateCode)', () => {
    it('형식: RE{할인율}-{6자리}, 혼동 문자(0/O/1/I/L) 미포함', () => {
        const re = new RegExp(`^RE${REVIEW_DISCOUNT_PERCENT}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$`);
        for (let i = 0; i < 200; i++) {
            expect(generateCode()).toMatch(re);
        }
    });

    it('무작위성 — 200개 생성 시 중복이 사실상 없어야 함', () => {
        const codes = new Set(Array.from({ length: 200 }, () => generateCode()));
        expect(codes.size).toBeGreaterThan(198);
    });
});
