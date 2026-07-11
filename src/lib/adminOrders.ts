// ─────────────────────────────────────────────
// 관리자용 주문(작업) 통합 분류 로직
// 3개 서비스가 서로 다른 테이블/스키마에 저장되므로, 하나의 통일된 Order 형태로 정규화한다.
//  - 재회사주 / 작명 → premium_analysis_jobs (raw_data.service로 구분)
//  - 타로            → tarot_reading_jobs (상태값이 'done' — 'completed'로 정규화)
// ─────────────────────────────────────────────

import { NAMING_PRICE, NAMING_PRICE_EVALUATION } from "@/features/naming/constants";
import { TAROT_PRICE } from "@/features/tarot/constants";

// 재회사주 가격 (별도 상수 없이 결제·confirm 라우트와 동일 값)
export const REUNION_PREMIUM_PRICE = 13900;
export const REUNION_SIGNATURE_PRICE = 19900;

export type ServiceKey = "reunion" | "tarot" | "naming";
export type OrderStatus = "pending" | "processing" | "completed" | "failed";

export interface AdminOrder {
    id: string;
    /** 원본 테이블 — 재시도 시 어느 테이블/이벤트를 쓸지 판단 */
    source: "premium" | "tarot";
    service: ServiceKey;
    serviceLabel: string;
    /** 세부 상품명 (프리미엄 / 시그니처 / 감명 / 작명 / 개명 / 타로) */
    plan: string;
    /** 결제 금액 (무료 발급이면 0) */
    price: number;
    status: OrderStatus;
    /** 무료 발급 건(작명 무료 기간 등) — 매출 집계 제외 */
    isFree: boolean;
    customerName: string;
    customerEmail: string | null;
    createdAt: string;
}

const NAMING_PLAN_LABEL: Record<string, string> = {
    newborn: "작명",
    rename: "개명",
    evaluation: "감명",
};

/** premium_analysis_jobs 한 행을 통합 Order로 변환 (재회 또는 작명) */
export function classifyPremiumJob(row: any): AdminOrder {
    const raw = row.raw_data || {};
    const status = normalizeStatus(row.status);
    const createdAt = row.created_at;

    if (raw.service === "naming") {
        const serviceType = raw.namingInput?.serviceType || "newborn";
        const isFree = raw.freeIssue === true;
        const price = isFree ? 0 : serviceType === "evaluation" ? NAMING_PRICE_EVALUATION : NAMING_PRICE;
        const surname = raw.namingInput?.surname || "";
        const currentName = raw.namingInput?.currentName || "";
        return {
            id: row.id,
            source: "premium",
            service: "naming",
            serviceLabel: "작명·감명",
            plan: NAMING_PLAN_LABEL[serviceType] || "작명",
            price,
            status,
            isFree,
            customerName: (surname + currentName).trim() || "이름 미상",
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
        price: pkg === "signature" ? REUNION_SIGNATURE_PRICE : REUNION_PREMIUM_PRICE,
        status,
        isFree: false,
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
        price: TAROT_PRICE,
        status: normalizeStatus(row.status),
        isFree: false,
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

/** 매출로 인정되는 주문인가 (유료 + 환불되지 않음). 실패=자동환불이므로 제외 */
export function countsAsRevenue(o: AdminOrder): boolean {
    return !o.isFree && o.status !== "failed";
}
