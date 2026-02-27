"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import ManseryeokTable from "@/components/ManseryeokTable";
import OhhaengRadarChart from "@/components/OhhaengRadarChart";
import SajuAccordion from "@/components/SajuAccordion";

export default function HistoryDetailPage() {
    const { history } = useSajuStore();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    // URL id를 바탕으로 기록 찾기
    const record = history.find(r => r.id === id);

    if (!record) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">기록을 찾을 수 없어요</h2>
                <p className="text-slate-500 mb-6">삭제되었거나 존재하지 않는 사주 결과입니다.</p>
                <button onClick={() => router.push('/history')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium">목록으로 돌아가기</button>
            </div>
        );
    }

    const { userInfo, resultData } = record;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-slate-50/80 backdrop-blur z-10 border-b border-slate-100">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors mr-1">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-semibold text-slate-800">지난 사주팝 분석 결과</span>
                <div className="w-10"></div> {/* 우측 여백 맞춤용 */}
            </header>

            <main className="p-6">
                {/* 만세력 표 */}
                {resultData.manseryeok && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <ManseryeokTable data={resultData.manseryeok} userInfo={userInfo} />
                        <div className="mt-6 mb-6">
                            <OhhaengRadarChart manseryeok={resultData.manseryeok as any} />
                        </div>
                    </motion.div>
                )}

                {/* 요약 카드 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3">
                        <span className="text-xs bg-slate-100 text-slate-400 font-medium px-2 py-1 rounded-bl-xl rounded-tr-xl">과거 기록</span>
                    </div>

                    <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
                        <Sparkles className="w-8 h-8" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                            {userInfo.gender === 'male' ? '남자' : '여자'}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                            {userInfo.calendarType === 'solar' ? '양력' : '음력'} {userInfo.birthDate}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                            {userInfo.birthTime}
                        </span>
                    </div>

                    <p className="text-slate-500 mb-1">{userInfo.name}님의 키워드는</p>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">"{resultData.keyword}"</h1>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="text-sm font-bold text-pink-600 mb-2 bg-pink-50 inline-block px-3 py-1 rounded-full">총점 {resultData.score}점</div>
                        <p className="text-slate-700 leading-relaxed font-medium mt-2">
                            {resultData.summary}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <SajuAccordion details={resultData.details} />
                </motion.div>
            </main>
        </div>
    );
}
