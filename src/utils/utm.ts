// ─────────────────────────────────────────────
// UTM 유입 추적 (클라이언트 전용)
// URL의 utm_* 파라미터를 localStorage에 저장해두고(라스트 터치, 30일),
// 무료 분석·결제 등 퍼널 이벤트 발생 시 함께 기록한다.
// 추적 실패는 어떤 경우에도 본 기능을 막지 않는다 (fire-and-forget).
// ─────────────────────────────────────────────

const UTM_KEY = 'myoyeon_utm';
const VISITOR_KEY = 'myoyeon_visitor_id';
const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

export interface StoredUtm {
    source: string;
    medium: string | null;
    campaign: string | null;
    ts: number;
}

/** URL에 utm_source가 있으면 저장하고 반환 (라스트 터치 — 새 유입이 기존 값을 덮음) */
export function captureUtmFromUrl(): StoredUtm | null {
    try {
        const params = new URLSearchParams(window.location.search);
        const source = params.get('utm_source');
        if (!source) return null;
        const utm: StoredUtm = {
            source: source.slice(0, 80),
            medium: params.get('utm_medium')?.slice(0, 80) ?? null,
            campaign: params.get('utm_campaign')?.slice(0, 120) ?? null,
            ts: Date.now(),
        };
        localStorage.setItem(UTM_KEY, JSON.stringify(utm));
        return utm;
    } catch {
        return null;
    }
}

/** 저장된 UTM (30일 경과 시 null) */
export function getUtm(): StoredUtm | null {
    try {
        const raw = localStorage.getItem(UTM_KEY);
        if (!raw) return null;
        const utm: StoredUtm = JSON.parse(raw);
        if (Date.now() - utm.ts > UTM_TTL_MS) {
            localStorage.removeItem(UTM_KEY);
            return null;
        }
        return utm;
    } catch {
        return null;
    }
}

/** 익명 방문자 ID (기기 단위) */
export function getVisitorId(): string | null {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

/** 경로 → 서비스 구분 */
export function serviceFromPath(pathname: string): string {
    if (pathname.startsWith('/tarot')) return 'tarot';
    if (pathname.startsWith('/hap')) return 'hap';
    if (pathname.startsWith('/yunmyeong')) return 'naming';
    if (pathname === '/') return 'hub';
    return 'saju';
}

/**
 * 퍼널 이벤트 기록 (fire-and-forget).
 * visit은 UTM이 있을 때만, free는 항상 기록해 유입/전체 비율을 볼 수 있게 한다.
 */
export function trackFunnelEvent(event: 'visit' | 'free', service: string): void {
    try {
        const utm = getUtm();
        if (event === 'visit' && !utm) return;
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                event,
                service,
                utm,
                visitorId: getVisitorId(),
            }),
        }).catch(() => {});
    } catch { /* 추적 실패 무시 */ }
}
