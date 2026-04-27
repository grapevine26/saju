"use client";

import { ArrowLeft, Sparkles, AlertCircle, CalendarHeart, Heart, Share2, Route } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ReunionGauge from "@/components/ReunionGauge";
import CompatibilityChart from "@/components/CompatibilityChart";
import SajuAccordion from "@/components/SajuAccordion";
import GoldenWindowTimeline from "@/components/GoldenWindowTimeline";
import MonthlyEnergyFlow from "@/components/MonthlyEnergyFlow";
import LongTermRoadmap from "@/components/LongTermRoadmap";
import GoldenWindowCalendar from "@/components/GoldenWindowCalendar";
import PremiumRadarChart from "@/components/PremiumRadarChart";
import VsCard from "@/components/VsCard";

export default function ResultClient({ job }: { job: any }) {
    const [showHeader, setShowHeader] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'compatibility'>('personal');
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setShowHeader(currentY < lastScrollY.current || currentY < 50);
            lastScrollY.current = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">기록을 찾을 수 없어요</h2>
                <p className="text-slate-400 mb-6">존재하지 않거나 삭제된 분석 결과입니다.</p>
                <Link href="/" className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium">홈으로 돌아가기</Link>
            </div>
        );
    }

    if (job.status === "pending" || job.status === "processing") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-3">운명의 흐름을 읽고 있습니다...</h2>
                <p className="text-slate-400 text-sm max-w-[260px] mx-auto leading-relaxed">
                    프리미엄 AI가 수만 건의 명리학 데이터를 바탕으로 심층 분석을 진행 중입니다. 잠시만 기다려주세요 (약 2~3분 소요).
                </p>
            </div>
        );
    }

    const resultData = job.ai_result;
    if (!resultData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">분석에 실패했어요</h2>
                <p className="text-slate-400 mb-6">데이터를 처리하는 중 문제가 발생했습니다.</p>
            </div>
        );
    }

    const compatibility = resultData.compatibility;

    return (
        <div className="min-h-screen pb-24 relative">
            <header className={`fixed top-0 left-0 right-0 max-w-[480px] mx-auto flex items-center justify-between p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
                <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-white">프리미엄 분석 리포트</span>
                <button className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="p-6 pt-20 space-y-8">
                {/* 탭 헤더 (궁합 패키지 데이터가 있을 때만 노출) */}
                {resultData.compatibilityReport && (
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-colors ${activeTab === 'personal' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            🔮 심리 & 타이밍
                        </button>
                        <button
                            onClick={() => setActiveTab('compatibility')}
                            className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-colors ${activeTab === 'compatibility' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            💫 1:1 궁합 리포트
                        </button>
                    </div>
                )}

                <div className={activeTab === 'personal' ? 'block' : 'hidden'}>
                    <div className="space-y-8">
                        {/* 1. 재회 가능성 게이지 */}
                        <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="glass-card p-8 text-center"
                >
                    <p className="text-sm text-slate-500 mb-1 font-medium">
                        프리미엄 심층 진단 결과
                    </p>
                    <ReunionGauge score={resultData.reunionScore || (compatibility && compatibility.reunionScore) || 50} />

                    <div className="mt-6 pt-5 border-t border-white/5">
                        <p className="text-xs font-bold text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full mb-3">
                            {resultData.reunionKeyword || "분석 완료"}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {resultData.summary}
                        </p>
                    </div>
                </motion.div>

                {/* 2. 궁합 차트 */}
                {compatibility && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            관계 에너지 분석
                        </h2>
                        <CompatibilityChart
                            attractionScore={compatibility.attractionScore}
                            conflictScore={compatibility.conflictScore}
                            complementScore={compatibility.complementScore}
                            hapList={compatibility.hapList}
                            chungList={compatibility.chungList}
                            hyeongList={compatibility.hyeongList}
                            haeList={compatibility.haeList}
                            dayMasterRelation={compatibility.dayMasterRelation}
                            spouseHouseRelation={compatibility.spouseHouseRelation}
                        />
                    </motion.div>
                )}

                {/* 2.5. 관계의 본질 독립 카드 */}
                {resultData.essenceAnalysis && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                    >
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-400" />
                            두 사람의 관계 본질
                        </h2>
                        <div className="glass-card p-5 space-y-4">
                            {resultData.essenceAnalysis.subtitle && (
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">✨</span>
                                    <p className="text-[15px] font-bold text-amber-400 leading-snug">
                                        {resultData.essenceAnalysis.subtitle}
                                    </p>
                                </div>
                            )}
                            <div className="text-slate-300 text-[14px] leading-[1.85] whitespace-pre-wrap font-medium">
                                {resultData.essenceAnalysis.content}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. AI 재회 전략 리포트 */}
                {resultData.details && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            재회 전략 리포트
                        </h2>
                        <SajuAccordion
                            details={resultData.details}
                            isPremium={true}
                        />
                    </motion.div>
                )}

                {/* 4. 골든 윈도우 (Premium) */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <CalendarHeart className="w-4 h-4 text-amber-400" />
                        골든 윈도우 캘린더
                    </h2>
                    { (resultData.goldenWindows?.windows || resultData.windows) && (
                        <GoldenWindowTimeline
                            windows={resultData.goldenWindows?.windows || resultData.windows}
                            bestMonth={resultData.goldenWindows?.bestMonth || resultData.bestMonth}
                        />
                    )}


                    { (resultData.goldenWindows?.monthlyEnergies || resultData.monthlyEnergies)?.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-slate-300 mb-4 px-2 tracking-tight">월별 에너지 흐름</h3>
                            <MonthlyEnergyFlow energies={resultData.goldenWindows?.monthlyEnergies || resultData.monthlyEnergies} />
                        </div>
                    )}


                    {/* 연락 최적기 캘린더 */}
                    { (resultData.goldenWindows?.goldenWindowMonths || resultData.goldenWindowMonths)?.length > 0 && (
                        <GoldenWindowCalendar months={resultData.goldenWindows?.goldenWindowMonths || resultData.goldenWindowMonths} />
                    )}


                    { (resultData.goldenWindows?.roadmapStages || resultData.roadmapStages)?.length > 0 && (
                        <div className="mt-10 mb-2 p-1">
                            <h3 className="text-sm font-bold text-slate-300 mb-5 px-1 tracking-tight flex items-center gap-2">
                                <Route className="w-4 h-4 text-emerald-400" />
                                장기 전략 로드맵
                            </h3>
                            <LongTermRoadmap stages={resultData.goldenWindows?.roadmapStages || resultData.roadmapStages} />
                        </div>
                    )}

                </motion.div>
                </div>
                </div>

                {activeTab === 'compatibility' && resultData.compatibilityReport && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 레이더 차트 */}
                        <section>
                            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                5대 궁합 지표 분석
                            </h2>
                            <PremiumRadarChart data={resultData.compatibilityReport.radarChart} />
                        </section>

                        {/* VS 카드 */}
                        <section>
                            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-rose-400" />
                                극과 극 성향 비교
                            </h2>
                            <div className="space-y-4">
                                {resultData.compatibilityReport.vsCards.map((card: any, idx: number) => (
                                    <VsCard key={idx} index={idx} {...card} />
                                ))}
                            </div>
                        </section>

                        {/* 궁합 디테일 (9개 아코디언) */}
                        <section>
                            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                심층 궁합 해부 리포트
                            </h2>
                            <SajuAccordion 
                                details={resultData.compatibilityReport.compatibilityDetails} 
                                isPremium={true} 
                            />
                        </section>
                    </div>
                )}

                {/* ─── 클로징 아웃트로: 힐링 위로 섹션 ─── */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    className="relative mt-4"
                >
                    <div className="absolute -inset-3 bg-gradient-to-br from-amber-500/8 via-rose-500/6 to-purple-500/5 rounded-3xl blur-2xl animate-soft-glow pointer-events-none" />

                    <div
                        className="relative overflow-hidden rounded-2xl border border-amber-500/15"
                        style={{
                            background: 'linear-gradient(165deg, rgba(245,158,11,0.06) 0%, rgba(244,63,94,0.04) 40%, rgba(15,23,42,0.95) 100%)',
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                        <div className="p-7 sm:p-8">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-soft-glow" />
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <Heart
                                            className="w-7 h-7 text-rose-400 animate-heartbeat drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                                            fill="currentColor"
                                        />
                                    </div>
                                </div>
                                <p className="text-[13px] font-bold tracking-widest text-amber-400/80 uppercase">
                                    💌 [다시, 우리]가 당신을 응원합니다
                                </p>
                            </div>

                            <p className="text-[14px] text-slate-300 leading-[1.8] text-center font-medium">
                                사주라는 것은 절대적인 미래를 정해놓은 것이 아니라,
                                <span className="text-white font-bold"> 우리가 나아갈 수 있는 여러 길 중 가장 지혜로운 방향</span>을 알려주는 지도와 같습니다.<br /><br />
                                분석 결과가 생각보다 좋게 나왔다면 그 운을 믿고 용기를 내시고,<br />
                                아쉬운 결과가 나왔더라도 너무 상심하지 마세요.<br /><br />
                                <span className="text-amber-400/90 font-bold">당신의 진심과 노력</span>이 언제나 운명보다 더 강한 힘을 발휘한다는 사실을 잊지 마시길 바랍니다.<br />
                                앞으로 걸어갈 당신의 모든 시간에 따뜻한 빛이 함께하기를 진심으로 응원합니다.
                            </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
