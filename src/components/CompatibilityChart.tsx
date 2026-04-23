"use client";

/**
 * CompatibilityChart — 두 사람의 합/충 관계를 시각적으로 표현하는 컴포넌트
 */
import { motion } from "framer-motion";
import { Heart, Zap, Shield, AlertTriangle } from "lucide-react";

interface CompatibilityChartProps {
    attractionScore: number;
    conflictScore: number;
    complementScore: number;
    hapList: { type: string; description: string }[];
    chungList: { type: string; description: string }[];
    hyeongList: { type: string; description: string }[];
    haeList: { type: string; description: string }[];
    dayMasterRelation: string;
    spouseHouseRelation: string;
}

const ScoreBar = ({ label, score, color, icon: Icon, delay }: {
    label: string; score: number; color: string; icon: any; delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="flex items-center gap-3"
    >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-400">{label}</span>
                <span className="text-xs font-bold text-slate-300">{score}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                        label === '갈등 지수' ? 'bg-gradient-to-r from-rose-500 to-red-400'
                        : label === '끌림 지수' ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                    }`}
                />
            </div>
        </div>
    </motion.div>
);

export default function CompatibilityChart({
    attractionScore, conflictScore, complementScore,
    hapList, chungList, hyeongList, haeList,
    dayMasterRelation, spouseHouseRelation
}: CompatibilityChartProps) {
    return (
        <div className="space-y-6">
            {/* 점수 바 */}
            <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-300 mb-3">관계 에너지 분석</h3>
                <ScoreBar label="끌림 지수" score={attractionScore} color="bg-amber-500/20 text-amber-400" icon={Heart} delay={0} />
                <ScoreBar label="오행 보완도" score={complementScore} color="bg-indigo-500/20 text-indigo-400" icon={Shield} delay={0.1} />
                <ScoreBar label="갈등 지수" score={conflictScore} color="bg-rose-500/20 text-rose-400" icon={Zap} delay={0.2} />
            </div>

            {/* 일주 관계 */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-slate-300 mb-3">핵심 관계 요약</h3>
                <div className="space-y-2">
                    <p className="text-sm text-slate-400 leading-relaxed">🌟 {dayMasterRelation}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">💑 {spouseHouseRelation}</p>
                </div>
            </div>

            {/* 합/충 목록 */}
            {(hapList.length > 0 || chungList.length > 0 || hyeongList.length > 0 || haeList.length > 0) && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-bold text-slate-300 mb-3">합(合)·충(沖) 관계도</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {hapList.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Heart className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400">합 (끌림)</span>
                                </div>
                                {hapList.map((h, i) => (
                                    <p key={i} className="text-xs text-amber-300/80 leading-relaxed">{h.description}</p>
                                ))}
                            </div>
                        )}
                        {chungList.length > 0 && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Zap className="w-3.5 h-3.5 text-rose-400" />
                                    <span className="text-xs font-bold text-rose-400">충 (갈등)</span>
                                </div>
                                {chungList.map((c, i) => (
                                    <p key={i} className="text-xs text-rose-300/80 leading-relaxed">{c.description}</p>
                                ))}
                            </div>
                        )}
                        {hyeongList.length > 0 && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                    <span className="text-xs font-bold text-orange-400">형 (시련)</span>
                                </div>
                                {hyeongList.map((h, i) => (
                                    <p key={i} className="text-xs text-orange-300/80 leading-relaxed">{h.description}</p>
                                ))}
                            </div>
                        )}
                        {haeList.length > 0 && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs font-bold text-purple-400">해 (피해)</span>
                                </div>
                                {haeList.map((h, i) => (
                                    <p key={i} className="text-xs text-purple-300/80 leading-relaxed">{h.description}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
