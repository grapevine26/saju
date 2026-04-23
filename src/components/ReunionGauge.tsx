"use client";

/**
 * ReunionGauge — 재회 가능성 원형 게이지 컴포넌트
 * SVG 기반 원형 프로그레스 바 + Framer Motion 카운트업 애니메이션
 */
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface ReunionGaugeProps {
    score: number; // 0~100
    size?: number;
    label?: string;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: "#f59e0b", glow: "rgba(245,158,11,0.4)", text: "text-amber-400", label: "매우 높음" };
    if (score >= 60) return { stroke: "#fbbf24", glow: "rgba(251,191,36,0.3)", text: "text-yellow-400", label: "높음" };
    if (score >= 40) return { stroke: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", label: "보통" };
    if (score >= 20) return { stroke: "#94a3b8", glow: "rgba(148,163,184,0.3)", text: "text-slate-400", label: "낮음" };
    return { stroke: "#64748b", glow: "rgba(100,116,139,0.3)", text: "text-slate-500", label: "매우 낮음" };
};

export default function ReunionGauge({ score, size = 200, label = "재회 가능성" }: ReunionGaugeProps) {
    const [displayScore, setDisplayScore] = useState(0);
    const colorInfo = getScoreColor(score);

    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (displayScore / 100) * circumference;

    useEffect(() => {
        const controls = animate(0, score, {
            duration: 2,
            ease: "easeOut",
            onUpdate: (v) => setDisplayScore(Math.round(v)),
        });
        return () => controls.stop();
    }, [score]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* 배경 글로우 */}
                <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-30"
                    style={{ background: `radial-gradient(circle, ${colorInfo.glow}, transparent)` }}
                />

                <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                    {/* 배경 트랙 */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={8}
                    />
                    {/* 진행 바 */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={colorInfo.stroke}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ filter: `drop-shadow(0 0 8px ${colorInfo.glow})` }}
                    />
                </svg>

                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-xs font-medium text-slate-500 mb-1">{label}</span>
                    <span className={`text-5xl font-black ${colorInfo.text} tabular-nums`}>
                        {displayScore}
                    </span>
                    <span className={`text-sm font-bold ${colorInfo.text} mt-1`}>
                        {colorInfo.label}
                    </span>
                </div>
            </div>
        </div>
    );
}
