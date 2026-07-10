"use client";

import { motion } from "framer-motion";
import { Flag, Compass, Route, CheckCircle2 } from "lucide-react";

export interface RoadmapStage {
    step: string;
    title: string;
    action: string;
}

interface Props {
    stages: RoadmapStage[];
}

export default function LongTermRoadmap({ stages }: Props) {
    if (!stages || stages.length === 0) return null;

    // 아이콘 매핑용
    const getStageIcon = (index: number) => {
        if (index === 0) return <Compass className="w-5 h-5" style={{ color: '#F06A7E' }} />;
        if (index === 1) return <Route className="w-5 h-5" style={{ color: '#F5C842' }} />;
        return <Flag className="w-5 h-5" style={{ color: '#34D399' }} />;
    };

    return (
        <div className="relative pt-4 pb-2">
            {/* 배경 세로선 */}
            <div className="absolute top-8 bottom-8 left-6 sm:left-[39px] w-[2px] rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(240,106,126,0.4), rgba(245,200,66,0.35), rgba(52,211,153,0.35))' }} />

            <div className="space-y-8">
                {stages.map((stage, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.15 }}
                        className="relative flex gap-4 sm:gap-6 items-start"
                    >
                        {/* 스텝 아이콘 */}
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--bg-primary)] border-2 border-[var(--border-glass)] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            {getStageIcon(idx)}
                        </div>

                        {/* 카드 내용 */}
                        <div className="flex-1 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl p-5 hover:bg-[var(--bg-glass)] transition-colors group">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase bg-[var(--bg-glass)] px-2 py-0.5 rounded-full border border-[var(--border-glass)]">
                                    {stage.step}
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
                                {stage.title}
                            </h4>
                            <div className="text-[13.5px] text-[var(--text-secondary)] leading-[1.85] font-medium whitespace-pre-wrap">
                                {stage.action}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
