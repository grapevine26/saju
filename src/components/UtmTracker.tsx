'use client';

// ─────────────────────────────────────────────
// UTM 방문 추적 — 루트 레이아웃에 마운트되는 무형 컴포넌트
// URL에 utm_*이 붙어 들어오면 저장하고, 세션당 1회 visit 이벤트를 기록한다.
// ─────────────────────────────────────────────

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureUtmFromUrl, serviceFromPath, trackFunnelEvent } from '@/utils/utm';

const SESSION_FLAG = 'myoyeon_visit_logged';

export default function UtmTracker() {
    const pathname = usePathname();

    useEffect(() => {
        try {
            const fresh = captureUtmFromUrl();
            // URL에 UTM이 새로 달려 온 경우에만, 세션당 1회 기록
            if (fresh && !sessionStorage.getItem(SESSION_FLAG)) {
                sessionStorage.setItem(SESSION_FLAG, '1');
                trackFunnelEvent('visit', serviceFromPath(pathname || '/'));
            }
        } catch { /* 추적 실패 무시 */ }
        // 최초 랜딩 1회만 — pathname 변경마다 재실행할 필요 없음
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
