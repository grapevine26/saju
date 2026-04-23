"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertCircle, Heart, Briefcase, Coins, Activity, Users, Clock, Compass, MessageCircle, Shield, CalendarHeart, Lock, Flame, Skull, HeartCrack, Timer, Eye, Zap, Cherry } from "lucide-react";

interface SajuDetail {
    title: string;
    subtitle?: string;
    content: string;
}

interface Props {
    details: SajuDetail[];
    isPremium?: boolean;
    onUpgrade?: () => void;
}

const PREMIUM_DUMMY_DETAILS: SajuDetail[] = [
    { title: "🎭 [심리] 상대방의 회피와 방어기제", content: "Premium 분석 시 공개됩니다." },
    { title: "🧲 [애착] 끊어질 듯 끊어지지 않는 인연의 끈", content: "Premium 분석 시 공개됩니다." },
    { title: "⏱️ [타이밍] 이별의 진짜 사유와 현재 운기", content: "Premium 분석 시 공개됩니다." },
    { title: "🔮 [속마음] 그 사람, 아직 미련이 있을까?", content: "Premium 분석 시 공개됩니다." },
    { title: "⚠️ [경고] 절대 하면 안 되는 최악의 실수", content: "Premium 분석 시 공개됩니다." },
    { title: "🎯 [길일] 가장 확률 높은 연락 타이밍", content: "Premium 분석 시 공개됩니다." },
    { title: "😈 [전략] 재회 확률 200% 극대화 시크릿 비법", content: "Premium 분석 시 공개됩니다." },
    { title: "🌸 [선택] 재회 성공 후 미래 vs 더 좋은 새로운 인연", content: "Premium 분석 시 공개됩니다." }
];

// 챕터 구분 정보 (9개 섹션 기준 — 본질은 독립 카드로 분리됨)
const CHAPTER_DIVIDERS: Record<number, { label: string; emoji: string; color: string; chapter: string }> = {
    0: { label: "왜 우리는 헤어졌을까?", emoji: "💔", color: "from-rose-500/20 to-transparent", chapter: "1" },
    4: { label: "그 사람, 아직 미련이 있을까?", emoji: "🔮", color: "from-purple-500/20 to-transparent", chapter: "2" },
    6: { label: "다시, 우리: 완벽한 재회 전략", emoji: "🚀", color: "from-emerald-500/20 to-transparent", chapter: "3" },
};

export default function SajuAccordion({ details, isPremium = true, onUpgrade }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const displayDetails = !isPremium && details.length < 10 
        ? [...details, ...PREMIUM_DUMMY_DETAILS].slice(0, 10) 
        : details;

    const toggleAccordion = (index: number) => {
        if (!isPremium && index >= details.length) {
            return; // 잠겨있는 항목은 아무런 반응이 없도록 처리
        }
        setOpenIndex(openIndex === index ? null : index);
    };

    const getIcon = (title: string) => {
        // 10개 챕터 매핑
        if (title.includes("본질") || title.includes("운명")) return <Heart className="w-5 h-5 text-rose-400" />;
        if (title.includes("심리") || title.includes("회피") || title.includes("방어")) return <Shield className="w-5 h-5 text-orange-400" />;
        if (title.includes("애착") || title.includes("끊어")) return <HeartCrack className="w-5 h-5 text-pink-400" />;
        if (title.includes("타이밍") && title.includes("이별")) return <Timer className="w-5 h-5 text-slate-400" />;
        if (title.includes("결론") || title.includes("진짜 사유")) return <Skull className="w-5 h-5 text-red-400" />;
        if (title.includes("속마음") || title.includes("미련")) return <Eye className="w-5 h-5 text-purple-400" />;
        if (title.includes("경고") || title.includes("실수") || title.includes("금지")) return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (title.includes("길일") || title.includes("연락") && title.includes("타이밍")) return <CalendarHeart className="w-5 h-5 text-blue-400" />;
        if (title.includes("비법") || title.includes("극대화") || title.includes("전략")) return <Zap className="w-5 h-5 text-amber-400" />;
        if (title.includes("선택") || title.includes("새로운 인연") || title.includes("미래")) return <Cherry className="w-5 h-5 text-emerald-400" />;
        // 기존 사주 분석용 아이콘 (호환성)
        if (title.includes("관계")) return <Heart className="w-5 h-5 text-rose-400" />;
        if (title.includes("이별") || title.includes("원인")) return <AlertCircle className="w-5 h-5 text-orange-400" />;
        if (title.includes("마음")) return <Sparkles className="w-5 h-5 text-purple-400" />;
        if (title.includes("전략") || title.includes("접근")) return <Compass className="w-5 h-5 text-amber-400" />;
        if (title.includes("메시지")) return <MessageCircle className="w-5 h-5 text-blue-400" />;
        if (title.includes("⚠️")) return <Shield className="w-5 h-5 text-red-400" />;
        if (title.includes("에너지") || title.includes("월별")) return <CalendarHeart className="w-5 h-5 text-indigo-400" />;
        if (title.includes("로드맵") || title.includes("장기")) return <Clock className="w-5 h-5 text-emerald-400" />;
        if (title.includes("오행")) return <Compass className="w-5 h-5 text-purple-400" />;
        if (title.includes("성격")) return <Sparkles className="w-5 h-5 text-pink-400" />;
        if (title.includes("연애")) return <Heart className="w-5 h-5 text-rose-400" />;
        if (title.includes("대인")) return <Users className="w-5 h-5 text-blue-400" />;
        if (title.includes("직업")) return <Briefcase className="w-5 h-5 text-emerald-400" />;
        if (title.includes("재물")) return <Coins className="w-5 h-5 text-yellow-400" />;
        if (title.includes("건강")) return <Activity className="w-5 h-5 text-red-400" />;
        if (title.includes("대운")) return <Clock className="w-5 h-5 text-indigo-400" />;
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    };

    // 챕터 섹션 나뉘는 기준 (10개 기준이 아닐 때는 구분선 없이 렌더링)
    const showChapters = displayDetails.length >= 8;

    return (
        <div className="space-y-5">
            {displayDetails.map((detail, idx) => {
                const isOpen = openIndex === idx;
                const isLocked = !isPremium && idx >= details.length;
                const chapterInfo = showChapters ? CHAPTER_DIVIDERS[idx] : undefined;

                return (
                    <div key={idx}>
                        {/* 챕터 구분선 */}
                        {chapterInfo && (
                            <div className="mb-4">
                                <div className={`flex items-center gap-3 py-3 px-4 rounded-2xl bg-gradient-to-r ${chapterInfo.color} border border-white/5`}>
                                    <span className="text-xl">{chapterInfo.emoji}</span>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-0.5">
                                            Chapter {chapterInfo.chapter}
                                        </p>
                                        <p className="text-[14px] font-bold text-white tracking-tight">
                                            {chapterInfo.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 카드 아이템 */}
                        <div className="glass-card overflow-hidden">
                            <button
                                onClick={() => toggleAccordion(idx)}
                                className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-3 pr-3">
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${isLocked ? 'bg-white/[0.03] border-white/5' : 'bg-white/5 border-white/10'}`}>
                                        {isLocked ? <Lock className="w-4 h-4 text-slate-600" /> : getIcon(detail.title)}
                                    </div>
                                    <div className={`font-bold text-[13px] leading-snug ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                        {detail.title}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-slate-600">
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="px-4 pb-5 pt-1 relative">
                                    <div className={`mt-2 p-4 bg-white/[0.02] rounded-xl border border-white/5 transition-all ${isLocked ? 'blur-sm select-none opacity-40' : ''}`}>
                                        {detail.subtitle && (
                                            <div className="font-bold text-amber-400 text-[15px] mb-4 leading-snug flex items-start gap-2">
                                                <span>✨</span> 
                                                <span>{detail.subtitle}</span>
                                            </div>
                                        )}
                                        <div className="text-slate-300 text-[14px] leading-[1.8] whitespace-pre-wrap font-medium pb-2">
                                            {isLocked ? detail.content.substring(0, 100) + '...' : detail.content}
                                        </div>
                                    </div>
                                    
                                    {/* 잠금 오버레이 */}
                                    {isLocked && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/80 to-transparent">
                                            <div className="flex flex-col items-center justify-center pb-2">
                                                <div className="flex items-center gap-2 mb-2 relative">
                                                    <span className="text-[11px] font-bold text-amber-500 bg-[#0a0e1a] px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                        🔒 Premium 전용
                                                    </span>
                                                </div>
                                                <p className="text-[13px] text-slate-300 font-medium mb-4">
                                                    더 깊은 분석은 업그레이드 후 확인할 수 있어요
                                                </p>
                                                <button
                                                    onClick={onUpgrade}
                                                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0a0e1a] font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
                                                >
                                                    Premium 심층 리포트 열기 (1,900원)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
