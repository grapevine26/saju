// ─────────────────────────────────────────────
// 관리자용 주문(작업) 통합 분류 로직
// 3개 서비스가 서로 다른 테이블/스키마에 저장되므로, 하나의 통일된 Order 형태로 정규화한다.
//  - 재회사주 / 궁합 → premium_analysis_jobs (raw_data.packageId로 구분)
//  - 타로            → tarot_reading_jobs (상태값이 'done' — 'completed'로 정규화)
// ─────────────────────────────────────────────

import { TAROT_PRICE } from "@/features/tarot/constants";
import { isFreePassKey } from "@/lib/freePass";

// 재회사주 · 궁합 · 타로 정가 — raw_data에 실결제 금액(paidAmount)이 없는 구(舊) 잡의 폴백값으로만 쓰인다.
export const REUNION_PREMIUM_PRICE = 19900;
export const REUNION_SIGNATURE_PRICE = 34900;
export const COMPATIBILITY_PRICE = 19900;

export type ServiceKey = "reunion" | "tarot" | "compatibility";
export type OrderStatus = "pending" | "processing" | "completed" | "failed";
/** 잡이 어떻게 결제됐는지 — 매출 집계는 'toss'만 인정한다 */
export type PaymentSource = "toss" | "dev" | "free_pass" | "zero_won_coupon";

export interface AdminOrder {
    id: string;
    /** 원본 테이블 — 재시도 시 어느 테이블/이벤트를 쓸지 판단 */
    source: "premium" | "tarot";
    service: ServiceKey;
    serviceLabel: string;
    /** 세부 상품명 (프리미엄 / 시그니처 / 궁합 / 타로) */
    plan: string;
    /** 실제 결제 금액 (무료 발급이면 0) */
    price: number;
    status: OrderStatus;
    /** 무료 발급 건 — 매출 집계 제외 */
    isFree: boolean;
    /** 결제 경로 — 실 토스 결제가 아니면(dev/프리패스/0원쿠폰) 매출 집계에서 제외 */
    paymentSource: PaymentSource;
    customerName: string;
    customerEmail: string | null;
    createdAt: string;
}

/**
 * paidAmount/paymentSource가 기록되기 전(구) 잡의 폴백 판정.
 * paymentKey가 'free_pass_'로 시작하면 프리패스로 확실히 알 수 있고,
 * 그 외엔 실토스 결제로 간주한다 (0원 쿠폰은 도입 이후 20% 고정이라 구 잡엔 존재하지 않았음).
 */
function inferLegacyPaymentSource(paymentKey: string | undefined | null): PaymentSource {
    return isFreePassKey(paymentKey) ? "free_pass" : "toss";
}

/** premium_analysis_jobs 한 행을 통합 Order로 변환 (재회 또는 궁합) */
export function classifyPremiumJob(row: any): AdminOrder {
    const raw = row.raw_data || {};
    const status = normalizeStatus(row.status);
    const createdAt = row.created_at;

    const paymentSource: PaymentSource = raw.paymentSource || inferLegacyPaymentSource(raw.paymentKey);

    if (raw.packageId === "compatibility") {
        const myName = raw.myRawInput?.name || "익명";
        const partnerName = raw.partnerRawInput?.name || "상대";
        return {
            id: row.id,
            source: "premium",
            service: "compatibility",
            serviceLabel: "궁합",
            plan: "궁합",
            price: typeof raw.paidAmount === "number" ? raw.paidAmount : COMPATIBILITY_PRICE,
            status,
            isFree: false,
            paymentSource,
            customerName: `${myName} ✕ ${partnerName}`,
            customerEmail: raw.customerEmail || null,
            createdAt,
        };
    }

    // 재회사주
    const pkg = raw.packageId === "signature" ? "signature" : "premium";
    return {
        id: row.id,
        source: "premium",
        service: "reunion",
        serviceLabel: "재회 사주",
        plan: pkg === "signature" ? "시그니처" : "프리미엄",
        price: typeof raw.paidAmount === "number"
            ? raw.paidAmount
            : pkg === "signature" ? REUNION_SIGNATURE_PRICE : REUNION_PREMIUM_PRICE,
        status,
        isFree: false,
        paymentSource,
        customerName: raw.myRawInput?.name || "익명",
        customerEmail: raw.customerEmail || null,
        createdAt,
    };
}

/** tarot_reading_jobs 한 행을 통합 Order로 변환 */
export function classifyTarotJob(row: any): AdminOrder {
    const raw = row.raw_data || {};
    return {
        id: row.id,
        source: "tarot",
        service: "tarot",
        serviceLabel: "타로",
        plan: "타로 7장",
        price: typeof raw.paidAmount === "number" ? raw.paidAmount : TAROT_PRICE,
        status: normalizeStatus(row.status),
        isFree: false,
        paymentSource: raw.paymentSource || inferLegacyPaymentSource(raw.paymentKey),
        customerName: raw.input?.myName || "익명",
        customerEmail: raw.customerEmail || null,
        createdAt: row.created_at,
    };
}

/** 타로의 'done'을 'completed'로 통일 */
function normalizeStatus(s: string): OrderStatus {
    if (s === "done") return "completed";
    if (s === "pending" || s === "processing" || s === "completed" || s === "failed") return s;
    return "pending";
}

/** 매출로 인정되는 주문인가 (유료 + 환불되지 않음 + 실토스 결제). 실패=자동환불이므로 제외 */
export function countsAsRevenue(o: AdminOrder): boolean {
    return !o.isFree && o.status !== "failed" && o.paymentSource === "toss";
}
