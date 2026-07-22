"use client";

/**
 * 운명의 합 전용 배경 — 루트 레이아웃 <body>의 로즈 라디얼 그라디언트를
 * /hap/* 전 구간에서 인장과 금박 톤으로 덮어쓴다 (타로 TarotThemeWrapper와 동일 패턴).
 * 이게 없으면 480px 스테이지 바깥 여백에 루트의 로즈 배경이 그대로 비친다.
 *
 * 은은한 금빛 비네트는 문서(body) 배경이 아니라 뷰포트에 고정된 별도 레이어로
 * 그린다 — body 배경은 콘텐츠가 길어지면(궁합 리포트는 18,000px가 넘는다)
 * 그라디언트가 문서 맨 위 기준으로만 그려져 스크롤하면 바로 안 보이게 된다.
 * (iOS 웹뷰에서 잘 깨지는 background-attachment:fixed 대신 position:fixed
 * div를 쓴다 — 이 서비스는 인스타 인앱 브라우저 유입이 많아 그쪽이 더 안전하다)
 */
import { useEffect } from "react";

const HAP_BASE = "#0A0908";

export default function HapThemeWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const body = document.body;
        const main = document.querySelector("main");

        const prevBodyBg = body.style.background;
        const prevMainBg = main?.style.background ?? "";

        body.style.background = HAP_BASE;
        if (main) main.style.background = "transparent";

        return () => {
            body.style.background = prevBodyBg;
            if (main) main.style.background = prevMainBg;
        };
    }, []);

    return (
        <div style={{ background: HAP_BASE, minHeight: "100vh" }}>
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                background:
                    "radial-gradient(ellipse 900px 560px at 50% -4%, rgba(201,161,92,0.14) 0%, transparent 58%), " +
                    "radial-gradient(ellipse 620px 620px at 100% 100%, rgba(140,106,50,0.10) 0%, transparent 60%)",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </div>
    );
}
