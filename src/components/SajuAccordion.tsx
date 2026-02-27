"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertCircle, Heart, Briefcase, Coins, Activity, Users, Clock, Compass } from "lucide-react";

interface SajuDetail {
    title: string;
    subtitle?: string;
    content: string;
}

interface Props {
    details: SajuDetail[];
}

export default function SajuAccordion({ details }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const getIcon = (title: string) => {
        if (title.includes("오행")) return <Compass className="w-[22px] h-[22px] text-purple-500" />;
        if (title.includes("성격") || title.includes("기질")) return <Sparkles className="w-[22px] h-[22px] text-pink-500" />;
        if (title.includes("연애") || title.includes("결혼")) return <Heart className="w-[22px] h-[22px] text-rose-500" />;
        if (title.includes("대인")) return <Users className="w-[22px] h-[22px] text-blue-500" />;
        if (title.includes("직업") || title.includes("적성")) return <Briefcase className="w-[22px] h-[22px] text-emerald-500" />;
        if (title.includes("재물")) return <Coins className="w-[22px] h-[22px] text-yellow-500" />;
        if (title.includes("건강")) return <Activity className="w-[22px] h-[22px] text-red-500" />;
        if (title.includes("대운")) return <Clock className="w-[22px] h-[22px] text-indigo-500" />;
        if (title.includes("주의")) return <AlertCircle className="w-[22px] h-[22px] text-orange-500" />;
        return <Sparkles className="w-[22px] h-[22px] text-emerald-600" />;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
            <div className="bg-emerald-600 text-white text-center py-3.5 font-bold text-lg tracking-wide">
                상세 사주해설
            </div>
            <div className="text-center py-2.5 text-[13px] text-slate-500 border-b border-slate-100 bg-slate-50 font-medium">
                각 제목을 클릭하면 해설이 펼쳐져요 👆
            </div>
            <div className="divide-y divide-slate-100">
                {details.map((detail, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div key={idx} className="transition-colors hover:bg-slate-50/50">
                            <button
                                onClick={() => toggleAccordion(idx)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <div className="flex items-center gap-4 pr-4">
                                    <div className="flex-shrink-0 bg-slate-50 p-2 rounded-full border border-slate-100">
                                        {getIcon(detail.title)}
                                    </div>
                                    <div className="font-bold text-slate-800 text-[17px]">
                                        {detail.title}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-slate-400">
                                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </button>

                            {/* 아코디언 내용 영역 */}
                            {isOpen && (
                                <div className="px-5 pb-7 pt-1 bg-slate-50/30">
                                    <div className="ml-14 pl-1 border-l-[3px] border-purple-200">
                                        {/* 펼쳤을 때 나오는 부제목 (Subtitle) */}
                                        {detail.subtitle && (
                                            <div className="font-extrabold text-slate-800 text-[17px] mb-3 leading-snug">
                                                ✨ {detail.subtitle}
                                            </div>
                                        )}
                                        {/* 상세 본문 내용 */}
                                        <div className="text-slate-600 text-[15px] leading-[1.7] whitespace-pre-wrap font-medium">
                                            {detail.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
