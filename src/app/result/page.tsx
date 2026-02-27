"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Sparkles, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ManseryeokTable from "@/components/ManseryeokTable";
import OhhaengRadarChart from "@/components/OhhaengRadarChart";
import SajuAccordion from "@/components/SajuAccordion";

// 더미 데이터 스키마 (기존 잔재 제거)
import { SavedResult } from "@/store/useSajuStore";

export default function ResultPage() {
    const router = useRouter();
    const { name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown, saveResult, resetInput } = useSajuStore();
    const [result, setResult] = useState<SavedResult['resultData'] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // React 18 StrictMode 이중 호출 방지용 Ref
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchSaju = async () => {
            try {
                const res = await fetch("/api/saju", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        gender,
                        calendarType,
                        birthYear,
                        birthMonth,
                        birthDay,
                        birthCity,
                        birthHour,
                        birthMinute,
                        isTimeUnknown
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setResult(data.data);

                    // 로컬스토리지 전역 상태에 결과 저장
                    saveResult(data.data);
                } else {
                    setError(data.error || "분석 중 오류가 발생했습니다.");
                }
            } catch (err) {
                console.error(err);
                setError("네트워크 오류가 발생했습니다.");
            }
        };

        fetchSaju();
    }, [name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown, error, saveResult]);

    const handleRestart = () => {
        resetInput();
        router.push("/");
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={handleRestart} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium">돌아가기</button>
            </div>
        );
    }

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900 text-white selection:bg-purple-900">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="relative w-32 h-32 mb-12 flex items-center justify-center"
            >
                <div className="absolute inset-x-0 w-full h-full border-[1px] border-slate-700 rounded-full border-dashed" />
                <div className="absolute top-0 w-3 h-3 bg-purple-500 rounded-full blur-[2px]" />
                <div className="absolute bottom-0 w-3 h-3 bg-blue-500 rounded-full blur-[2px]" />
                <div className="absolute left-0 w-3 h-3 bg-indigo-500 rounded-full blur-[2px]" />
                <div className="absolute right-0 w-3 h-3 bg-pink-500 rounded-full blur-[2px]" />

                {/* 중앙 태극 마크 느낌 대체 */}
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
            </motion.div>

            <div className="space-y-3 text-center">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    운세를 팝(POP)! 터트리는 중 🍿
                </h2>
                <motion.p
                    className="text-slate-400 text-sm font-medium"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    복잡한 명리학을 가장 쉽고 재밌게 푸는 중...
                </motion.p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-slate-50/80 backdrop-blur z-10 border-b border-slate-100">
                <Link href="/" className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-slate-800">사주팝 분석 결과</span>
                <button className="p-2 -mr-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="p-6">
                {/* 만세력 원국 표 */}
                {result.manseryeok && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <ManseryeokTable
                            data={result.manseryeok as any}
                            userInfo={{
                                name,
                                gender,
                                calendarType,
                                birthDate: `${birthYear}년 ${birthMonth}월 ${birthDay}일`,
                                birthTime: isTimeUnknown ? "시간 모름" : `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
                            }}
                        />
                        <div className="mt-6 mb-6">
                            <OhhaengRadarChart manseryeok={result.manseryeok as any} />
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 text-center"
                >
                    <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 mb-1">{name || "익명"}님의 올해 키워드는</p>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">"{result.keyword}"</h1>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="text-sm font-bold text-pink-600 mb-2 bg-pink-50 inline-block px-3 py-1 rounded-full">총점 {result.score}점</div>
                        <p className="text-slate-700 leading-relaxed font-medium mt-2">
                            {result.summary}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <SajuAccordion details={result.details} />
                </motion.div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white/90 backdrop-blur pb-6 border-t border-slate-100">
                <button
                    onClick={handleRestart}
                    className="w-full bg-slate-100 text-slate-700 active:bg-slate-200 font-semibold py-4 rounded-2xl flex justify-center items-center gap-2 transition-transform active:scale-[0.98]"
                >
                    <RefreshCcw className="w-5 h-5" />
                    다시 검사하기
                </button>
            </div>
        </div>
    );
}
