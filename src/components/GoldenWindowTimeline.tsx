"use client";

/**
 * GoldenWindowTimeline — 골든 윈도우 타임라인 시각화 컴포넌트
 */
import { motion } from "framer-motion";
import { CalendarHeart, Sparkles, AlertTriangle } from "lucide-react";

interface WindowData {
    year: number;
    month: number;
    monthGan: string;
    monthZhi: string;
    score: number;
    isGolden: boolean;
    reasons: string[];
}

interface GoldenWindowTimelineProps {
    windows: WindowData[];
    bestMonth: (WindowData & { advice?: string }) | null;
}

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const getBarColor = (score: number, isGolden: boolean) => {
    if (isGolden) return 'from-amber-500 to-yellow-400';
    if (score >= 55) return 'from-indigo-500 to-purple-400';
    if (score >= 40) return 'from-slate-500 to-slate-400';
    return 'from-rose-500/60 to-rose-400/60';
};

export default function GoldenWindowTimeline({ windows, bestMonth }: GoldenWindowTimelineProps) {
    const maxScore = Math.max(...windows.map(w => w.score), 1);

    return (
        <div className="space-y-6">
            {/* 베스트 월 하이라이트 */}
            {bestMonth && bestMonth.isGolden && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-glow-gold glass-card-strong p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-bold text-amber-400">🏆 최적의 골든 윈도우</h3>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-3xl font-black text-gradient-gold">
                            {bestMonth.year}년 {MONTH_NAMES[bestMonth.month]}
                        </span>
                        <span className="text-lg font-bold text-amber-500/60">
                            ({bestMonth.monthGan}{bestMonth.monthZhi}월)
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                        {bestMonth.reasons[0]}
                    </p>
                    {bestMonth.advice && (
                        <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-3 mt-3">
                            <p className="text-xs text-amber-300/80 leading-relaxed whitespace-pre-line">
                                💡 {bestMonth.advice}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 타임라인 바 차트 */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-5">
                    <CalendarHeart className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-300">월별 재회 에너지 흐름</h3>
                </div>

                <div className="space-y-3">
                    {windows.map((w, i) => (
                        <motion.div
                            key={`${w.year}-${w.month}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`flex items-center gap-3 ${w.isGolden ? 'py-1' : ''}`}
                        >
                            {/* 월 라벨 */}
                            <div className="w-12 text-right shrink-0">
                                <span className={`text-xs font-bold ${w.isGolden ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {MONTH_NAMES[w.month]}
                                </span>
                            </div>

                            {/* 바 */}
                            <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(w.score / maxScore) * 100}%` }}
                                    transition={{ delay: 0.5 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-lg bg-gradient-to-r ${getBarColor(w.score, w.isGolden)} ${w.isGolden ? 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' : ''}`}
                                />
                                {w.isGolden && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                    </div>
                                )}
                            </div>

                            {/* 점수 */}
                            <div className="w-10 text-right shrink-0">
                                <span className={`text-xs font-bold tabular-nums ${w.isGolden ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {w.score}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400" />
                    <span>골든 윈도우</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-500 to-purple-400" />
                    <span>양호</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-rose-500/60 to-rose-400/60" />
                    <span>주의</span>
                </div>
            </div>
        </div>
    );
}
