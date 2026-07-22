"use client";

/**
 * 운명의 합 전용 배경 — 루트 레이아웃 <body>의 로즈 라디얼 그라디언트를
 * /hap/* 전 구간에서 인장과 금박 톤으로 덮어쓴다 (타로 TarotThemeWrapper와 동일 패턴).
 * 이게 없으면 480px 스테이지 바깥 여백에 루트의 로즈 배경이 그대로 비친다.
 */
import { useEffect } from "react";

const HAP_BG = "radial-gradient(ellipse 1100px 650px at 50% -6%, rgba(140,106,50,0.16) 0%, transparent 55%), #0A0908";

export default function HapThemeWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const body = document.body;
        const main = document.querySelector("main");

        const prevBodyBg = body.style.background;
        const prevMainBg = main?.style.background ?? "";

        body.style.background = HAP_BG;
        if (main) main.style.background = "transparent";

        return () => {
            body.style.background = prevBodyBg;
            if (main) main.style.background = prevMainBg;
        };
    }, []);

    return <div style={{ background: HAP_BG, minHeight: "100vh" }}>{children}</div>;
}
