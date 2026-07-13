"use client";

import { useEffect } from "react";

const TAROT_BG = "#060409";

export default function TarotThemeWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const body = document.body;
        const main = document.querySelector("main");

        const prevBodyBg = body.style.background;
        const prevMainBg = main?.style.background ?? "";

        body.style.background = TAROT_BG;
        if (main) main.style.background = TAROT_BG;

        return () => {
            body.style.background = prevBodyBg;
            if (main) main.style.background = prevMainBg;
        };
    }, []);

    return (
        <div className="tarot-theme" style={{ background: TAROT_BG, minHeight: "100vh" }}>
            {children}
        </div>
    );
}
