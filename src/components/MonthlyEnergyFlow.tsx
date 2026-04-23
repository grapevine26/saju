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
                    className="relative overflow-hidden rounded-2xl p-[1px] group"
                >
                    {/* 카드 테두리 그라디언트 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-white/5 to-amber-500/30 opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative bg-[#0F1423] p-5 rounded-2xl h-full flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                        
                        {/* 달 표시 뱃지 */}
                        <div className="flex-shrink-0 flex sm:flex-col items-center gap-2 sm:gap-1 bg-white/5 px-4 py-2 sm:p-4 rounded-xl border border-white/5 shadow-inner">
                            <CalendarDays className="w-5 h-5 text-indigo-400" />
                            <span className="font-black text-lg text-white tabular-nums tracking-tighter">
                                {item.month}
                            </span>
                        </div>

                        {/* 텍스트 내용 */}
                        <div className="flex-1 space-y-2 relative">
                            {/* 데코 엘리먼트 */}
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-500/20" />
                            
                            <h4 className="text-[15px] font-bold text-amber-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {item.theme}
                            </h4>
                            <p className="text-[13px] text-slate-300 leading-[1.8] font-medium break-keep whitespace-pre-wrap">
                                {item.advice}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
