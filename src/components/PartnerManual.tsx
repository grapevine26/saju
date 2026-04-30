"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface PartnerManualProps {
    data: {
        forbiddenWords: { word: string; reason: string }[];
        magicKeywords: { keyword: string; effect: string }[];
        dateSpots: { place: string; reason: string }[];
        textExamples: { situation: string; good: string; bad: string }[];
    };
}

// 탭 정의
const tabs = [
    { key: "forbidden", label: "🚫 금기어", color: "rose" },
    { key: "magic", label: "💎 마법 키워드", color: "emerald" },
    { key: "date", label: "📍 데이트 장소", color: "indigo" },
    { key: "text", label: "💬 문자 예시", color: "amber" },
] as const;

type TabKey = typeof tabs[number]["key"];

export default function PartnerManual({ data }: PartnerManualProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("forbidden");

    return (
        <div className="space-y-4">
            {/* 탭 바 */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                            activeTab === tab.key
                                ? tab.color === "rose" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : tab.color === "emerald" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : tab.color === "indigo" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-white/5 text-slate-500 border border-transparent hover:bg-white/8 hover:text-slate-400"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 콘텐츠 영역 */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
            >
                {/* 🚫 금기어 */}
                {activeTab === "forbidden" && data.forbiddenWords.map((item, i) => (
                    <div key={i} className="bg-rose-500/[0.04] border border-rose-500/15 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-[11px] font-black text-rose-400">
                                ✕
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-rose-300 mb-1.5 break-keep">
                                    &ldquo;{item.word}&rdquo;
                                </p>
                                <p className="text-[12px] text-slate-400 leading-relaxed break-keep">
                                    {item.reason}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 💎 마법 키워드 */}
                {activeTab === "magic" && data.magicKeywords.map((item, i) => (
                    <div key={i} className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-[11px] font-black text-emerald-400">
                                ♡
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-emerald-300 mb-1.5 break-keep">
                                    &ldquo;{item.keyword}&rdquo;
                                </p>
                                <p className="text-[12px] text-slate-400 leading-relaxed break-keep">
                                    {item.effect}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 📍 데이트 장소 */}
                {activeTab === "date" && data.dateSpots.map((item, i) => (
                    <div key={i} className="bg-indigo-500/[0.04] border border-indigo-500/15 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-[13px]">
                                📍
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-indigo-300 mb-1.5 break-keep">
                                    {item.place}
                                </p>
                                <p className="text-[12px] text-slate-400 leading-relaxed break-keep">
                                    {item.reason}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 💬 문자 예시 */}
                {activeTab === "text" && data.textExamples.map((item, i) => (
                    <div key={i} className="bg-amber-500/[0.04] border border-amber-500/15 rounded-xl p-4 space-y-3">
                        <p className="text-[12px] font-bold text-amber-400/80 tracking-wide">
                            💬 상황: {item.situation}
                        </p>
                        <div className="space-y-2">
                            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg px-3.5 py-2.5">
                                <p className="text-[10px] font-bold text-emerald-500 mb-1">✓ 이렇게 보내세요</p>
                                <p className="text-[13px] text-slate-300 break-keep leading-relaxed">{item.good}</p>
                            </div>
                            <div className="bg-rose-500/[0.06] border border-rose-500/15 rounded-lg px-3.5 py-2.5">
                                <p className="text-[10px] font-bold text-rose-500 mb-1">✕ 이건 절대 안 돼요</p>
                                <p className="text-[13px] text-slate-400 break-keep leading-relaxed line-through decoration-rose-500/30">{item.bad}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
