// ─────────────────────────────────────────────
// 관리자 프리패스 클라이언트 헬퍼
// 결제창을 띄울지 프리패스로 건너뛸지 UX 분기에만 사용한다.
// 실제 승인 우회 여부는 서버(confirm/start)가 세션 쿠키로 재검증하므로
// 이 값이 조작되어도 무료 발급은 불가능하다.
// ─────────────────────────────────────────────

export async function checkFreePass(): Promise<boolean> {
    try {
        const res = await fetch('/api/free-pass');
        if (!res.ok) return false;
        const data = await res.json();
        return !!data.freePass;
    } catch {
        return false;
    }
}

/** 프리패스 결제 성공 페이지 리다이렉트용 paymentKey 생성 */
export function makeFreePassKey(): string {
    return `free_pass_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
