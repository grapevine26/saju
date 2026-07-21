// ─────────────────────────────────────────────
// Meta 픽셀 이벤트 헬퍼 (클라이언트 전용)
// 픽셀 미설정/미로드 환경에서는 조용히 no-op.
// Purchase는 주문번호 기준으로 1회만 전송 — 결제 성공 페이지
// 새로고침(ALREADY_PROCESSED 복구 경로)에서 중복 집계를 막는다.
// ─────────────────────────────────────────────

export function trackPurchase(orderId: string, valueKrw: number) {
    try {
        const fbq = (window as any).fbq;
        if (!fbq || !orderId) return;

        const dedupKey = `fbq_purchase_${orderId}`;
        if (localStorage.getItem(dedupKey)) return;
        localStorage.setItem(dedupKey, '1');

        fbq('track', 'Purchase', { value: valueKrw, currency: 'KRW' });
    } catch { /* 추적 실패는 결제 흐름과 무관 — 무시 */ }
}
