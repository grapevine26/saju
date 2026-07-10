"use client";

import { motion } from "framer-motion";
import { Sparkles, CalendarDays } from "lucide-react";

export interface MonthlyEnergy {
    month: string;
    theme: string;
    advice: string;
}

interface Props {
    energies: MonthlyEnergy[];
}

const accent = '#F06A7E';
const accentSoft = 'rgba(216,72,94,0.10)';
const accentBorder = 'rgba(216,72,94,0.35)';

export default function MonthlyEnergyFlow({ energies }: Props) {
    if (!energies || energies.length === 0) return null;

    return (
        <div className="space-y-4">
            {energies.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative overflow-hidden rounded-2xl"
                    style={{ border: `1px solid ${accentBorder}`, background: 'rgba(255,255,255,0.03)' }}
                >
                    <div className="relative p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">

                        {/* 달 표시 뱃지 */}
                        <div className="flex-shrink-0 flex sm:flex-col items-center gap-2 sm:gap-1 px-4 py-2 sm:p-4 rounded-xl" style={{ background: accentSoft, border: `1px solid ${accentBorder}` }}>
                            <CalendarDays className="w-5 h-5" style={{ color: accent }} />
                            <span className="font-black text-lg tabular-nums tracking-tighter" style={{ color: accent }}>
                                {item.month}
                            </span>
                        </div>

                        {/* 텍스트 내용 */}
                        <div className="flex-1 space-y-2 relative">
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4" style={{ color: accent, opacity: 0.25 }} />
                            <h4 className="text-[15px] font-bold flex items-center gap-2" style={{ color: accent }}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                                {item.theme}
                            </h4>
                            <p className="text-[13px] leading-[1.8] font-medium break-keep whitespace-pre-wrap text-[var(--text-secondary)]">
                                {item.advice}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
