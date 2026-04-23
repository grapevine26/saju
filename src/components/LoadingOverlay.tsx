"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
    isVisible: boolean;
}

const LOADING_MESSAGES = [
    "두 사람의 명식 데이터를 교차 분석 중입니다...",
    "과거의 흐름과 현재의 운기를 대조하는 중...",
    "숨겨진 속마음과 무의식을 깊이 들여다보고 있어요.",
    "재회를 위한 맞춤형 행동 가이드라인을 작성 중입니다...",
    "거의 다 완료되었습니다. 잠시만 기다려주세요!"
];

export default function LoadingOverlay({ isVisible }: Props) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
        }, 12000); // 12초마다 문구 변경

        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* 블러 백그라운드 */}
                    <div className="absolute inset-0 bg-[#0a0e1a]/80 backdrop-blur-md" />
                    
                    {/* 로딩 콘텐츠 박스 */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                        className="relative bg-[#0d1222] border border-white/10 rounded-3xl p-8 max-w-[340px] w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* 은은한 빛 효과 */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 h-[100px] bg-amber-500/5 blur-[50px] rounded-full" />
                        
                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="bg-[#0a0e1a] border border-amber-500/30 w-16 h-16 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                    <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                                Premium 심층 분석 중
                            </h3>
                            
                            <div className="h-12 flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={messageIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-[14px] text-slate-300 font-medium leading-relaxed"
                                    >
                                        {LOADING_MESSAGES[messageIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            <div className="mt-8 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 180, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                                />
                            </div>
                            <p className="mt-3 text-[11px] text-slate-500 font-medium">
                                전체 섹션을 분석하기까지<br/>약 2~3분 정도 소요될 수 있습니다.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
