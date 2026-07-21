'use client';

// ─────────────────────────────────────────────
// Meta 픽셀 (광고 전환 추적)
// NEXT_PUBLIC_META_PIXEL_ID가 없으면 아무것도 하지 않는다 —
// 픽셀 발급 전에 배포해도 안전하고, ID만 넣으면 켜진다.
// 기본 스니펫이 첫 PageView를 쏘고, SPA 라우트 전환은 여기서 수동 추적.
// ─────────────────────────────────────────────

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
    const pathname = usePathname();
    const isFirst = useRef(true);

    useEffect(() => {
        if (!PIXEL_ID) return;
        // 최초 렌더는 기본 스니펫이 PageView를 이미 전송 — 중복 방지
        if (isFirst.current) { isFirst.current = false; return; }
        (window as any).fbq?.('track', 'PageView');
    }, [pathname]);

    if (!PIXEL_ID) return null;

    return (
        <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
    );
}
