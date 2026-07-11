"use client";

import { ArrowLeft, Sparkles, AlertCircle, CalendarHeart, Heart, Share2, Route } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
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
import PartnerManual from "@/components/PartnerManual";

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

    // 이메일 링크로 생성 도중(pending/processing) 진입했을 때 완료되면 자동 새로고침.
    // 서버 컴포넌트라 job은 최초 1회만 조회되므로, 클라이언트에서 상태를 폴링해 갱신한다.
    useEffect(() => {
        if (!job?.id || (job.status !== 'pending' && job.status !== 'processing')) return;
        let tries = 0;
        const timer = setInterval(async () => {
            tries += 1;
            if (tries > 100) { clearInterval(timer); return; } // 약 5분 상한
            try {
                const res = await fetch(`/api/job-status?jobId=${job.id}`);
                const data = await res.json();
                if (data.success && (data.status === 'completed' || data.status === 'failed')) {
                    clearInterval(timer);
                    window.location.reload();
                }
            } catch { /* 네트워크 일시 오류는 무시하고 다음 틱에 재시도 */ }
        }, 3000);
        return () => clearInterval(timer);
    }, [job?.id, job?.status]);

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">기록을 찾을 수 없어요</h2>
                <p className="text-[var(--text-secondary)] mb-6">존재하지 않거나 삭제된 분석 결과입니다.</p>
                <Link href="/saju" className="px-6 py-3 bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-secondary)] rounded-xl font-medium">홈으로 돌아가기</Link>
            </div>
        );
    }

    if (job.status === "pending" || job.status === "processing") {
        return <LoadingOverlay isVisible={true} />;
    }

    const resultData = job.ai_result;
    if (!resultData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">분석에 실패했어요</h2>
                <p className="text-[var(--text-secondary)] mb-6">데이터를 처리하는 중 문제가 발생했습니다.</p>
            </div>
        );
    }

    const compatibility = resultData.compatibility;

    return (
        <div className="min-h-screen pb-24 relative" style={{ background: '#0A090C' }}>
            <header className={`fixed top-0 left-0 right-0 max-w-[480px] mx-auto flex items-center justify-between p-4 bg-[var(--bg-primary)]/90 backdrop-blur-md z-50 border-b border-[var(--line-soft)] transition-transform duration-300 relative ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
                <Link href="/saju" className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[var(--text-primary)]">프리미엄 분석 리포트</span>
                <button className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="p-6 pt-20 space-y-8">
                {/* 탭 헤더 (궁합 패키지 데이터가 있을 때만 노출) */}
                {resultData.compatibilityReport && (
                    <div className="sticky top-[60px] z-40 bg-[var(--bg-primary)]/95 backdrop-blur-xl py-2 -mx-2 px-2 shadow-lg">
                        <div className="flex bg-[var(--bg-glass)] rounded-2xl p-1 border border-[var(--border-glass)]">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-colors ${activeTab === 'personal' ? 'bg-[var(--accent-soft)] text-[var(--accent-gold)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                🔮 재회 리포트
                            </button>
                            <button
                                onClick={() => setActiveTab('compatibility')}
                                className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-colors ${activeTab === 'compatibility' ? 'bg-indigo-500/20 text-indigo-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                💫 1:1 궁합 리포트
                            </button>
                        </div>
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
                    <p className="text-sm text-[var(--text-secondary)] mb-1 font-medium">
                        프리미엄 심층 진단 결과
                    </p>
                    <ReunionGauge score={resultData.reunionScore || (compatibility && compatibility.reunionScore) || 50} />

                    <div className="mt-6 pt-5 border-t border-[var(--line-soft)]">
                        <p className="text-xs font-bold text-[var(--accent-gold)] bg-[var(--accent-soft)] inline-block px-3 py-1 rounded-full mb-3">
                            {resultData.reunionKeyword || "분석 완료"}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
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
                        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
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
                        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-400" />
                            두 사람의 관계 본질
                        </h2>
                        <div className="glass-card p-5 space-y-4">
                            {resultData.essenceAnalysis.subtitle && (
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">✨</span>
                                    <p className="text-[15px] font-bold text-[var(--accent-gold)] leading-snug">
                                        {resultData.essenceAnalysis.subtitle}
                                    </p>
                                </div>
                            )}
                            <div className="text-[var(--text-primary)] text-[14px] leading-[1.85] whitespace-pre-wrap font-medium">
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
                        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
                            심층 재회 전략 리포트
                        </h2>
                        <SajuAccordion
                            details={resultData.details}
                            isPremium={true}
                        />
                    </motion.div>
                )}

                {/* 3.5. 상대방 공략 매뉴얼 */}
                {resultData.partnerManual && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                    >
                        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <span className="text-base">🎯</span>
                            상대방 공략 매뉴얼
                        </h2>
                        <PartnerManual data={resultData.partnerManual} />
                    </motion.div>
                )}

                {/* 4. 골든 윈도우 (Premium) */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <CalendarHeart className="w-4 h-4 text-[var(--accent-gold)]" />
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
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#F06A7E' }} />
                                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight m-0">월별 에너지 흐름</h3>
                            </div>
                            <MonthlyEnergyFlow energies={resultData.goldenWindows?.monthlyEnergies || resultData.monthlyEnergies} />
                        </div>
                    )}


                    {/* 연락 최적기 캘린더 */}
                    { (resultData.goldenWindows?.goldenWindowMonths || resultData.goldenWindowMonths)?.length > 0 && (
                        <GoldenWindowCalendar months={resultData.goldenWindows?.goldenWindowMonths || resultData.goldenWindowMonths} />
                    )}


                    { (resultData.goldenWindows?.roadmapStages || resultData.roadmapStages)?.length > 0 && (
                        <div className="mt-10 mb-2 p-1">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-5 px-1 tracking-tight flex items-center gap-2">
                                <Route className="w-4 h-4 text-emerald-400" />
                                장기 전략 로드맵
                            </h3>
                            <LongTermRoadmap stages={resultData.goldenWindows?.roadmapStages || resultData.roadmapStages} />
                        </div>
                    )}

                    {/* ── 타로 브릿지 — 골든윈도우까지 기다리는 동안의 "지금 마음" 수요를 타로로 연결 ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-10 rounded-2xl p-6 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(150deg, rgba(61,44,109,0.35) 0%, rgba(13,16,38,0.6) 60%)',
                            border: '1px solid rgba(176,123,180,0.3)',
                        }}
                    >
                        <div className="absolute pointer-events-none" style={{
                            top: -40, right: -30, width: 170, height: 160,
                            background: 'radial-gradient(circle, rgba(120,86,196,0.22) 0%, transparent 70%)',
                        }} />
                        <p className="text-[11px] font-bold tracking-widest mb-2.5" style={{ color: '#B07BB4' }}>
                            ✦ 골든 윈도우까지 기다리는 동안
                        </p>
                        <p className="text-[17px] font-bold text-white leading-relaxed mb-2.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                            운의 흐름은 정해졌지만,<br />마음은 매일 움직입니다
                        </p>
                        <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(237,232,248,0.75)' }}>
                            연락 최적기가 올 때까지 — 오늘 그 사람이 당신을 어떻게 생각하는지,
                            7장의 카드가 지금 이 순간의 마음을 읽어드립니다.
                        </p>
                        <Link href="/tarot" className="block text-center py-3.5 rounded-xl text-[14px] font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #6B3FA8 100%)',
                                color: '#F3EDFB', boxShadow: '0 6px 24px rgba(107,63,168,0.35)',
                            }}>
                            오늘 그 사람의 마음 보기
                        </Link>
                        <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(176,123,180,0.7)' }}>
                            첫 리딩 무료 · 전체 해석 3,900원
                        </p>
                    </motion.div>

                </motion.div>
                </div>
                </div>

                {activeTab === 'compatibility' && resultData.compatibilityReport && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 커플 유형 진단 */}
                        {resultData.compatibilityReport.coupleType && (
                            <section>
                                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-lg">💘</span>
                                    커플 유형 진단
                                </h2>
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="relative overflow-hidden rounded-2xl border border-indigo-500/20"
                                    style={{ background: 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(15,23,42,0.95) 100%)' }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
                                    <div className="p-6 text-center">
                                        <div className="text-5xl mb-3">{resultData.compatibilityReport.coupleType.emoji}</div>
                                        <h3 className="text-xl font-black text-white mb-1">
                                            {resultData.compatibilityReport.coupleType.label}
                                        </h3>
                                        <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto my-4 rounded-full" />
                                        <p className="text-[13px] text-[var(--text-primary)] leading-[1.85] whitespace-pre-wrap font-medium text-left">
                                            {resultData.compatibilityReport.coupleType.description}
                                        </p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                                </motion.div>
                            </section>
                        )}

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
                            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
                                심층 궁합 해부 리포트
                            </h2>
                            <SajuAccordion 
                                details={resultData.compatibilityReport.compatibilityDetails} 
                                isPremium={true} 
                                mode="compatibility"
                            />
                        </section>

                        {/* 궁합 종합 등급 */}
                        {resultData.compatibilityReport.overallGrade && (
                            <section>
                                <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <span className="text-lg">📊</span>
                                    궁합 종합 등급
                                </h2>
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="relative overflow-hidden rounded-2xl border border-[var(--accent-border)]"
                                    style={{ background: 'linear-gradient(165deg, rgba(216,72,94,0.06) 0%, rgba(240,106,126,0.04) 40%, rgba(10,9,12,0.95) 100%)' }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-amber)]/30 to-transparent" />
                                    <div className="p-6">
                                        {/* 등급 뱃지 */}
                                        <div className="text-center mb-5">
                                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl font-black mb-2 ${
                                                resultData.compatibilityReport.overallGrade.grade === 'S' ? 'bg-gradient-to-br from-[#F06A7E]/20 to-[#D8485E]/10 text-[#F06A7E] border border-[#D8485E]/30 shadow-[0_0_30px_rgba(216,72,94,0.20)]' :
                                                resultData.compatibilityReport.overallGrade.grade === 'A' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/30' :
                                                resultData.compatibilityReport.overallGrade.grade === 'B' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 border border-blue-500/30' :
                                                resultData.compatibilityReport.overallGrade.grade === 'C' ? 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 text-slate-400 border border-slate-500/30' :
                                                'bg-gradient-to-br from-rose-500/20 to-rose-600/10 text-rose-400 border border-rose-500/30'
                                            }`}>
                                                {resultData.compatibilityReport.overallGrade.grade}
                                            </div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">{resultData.compatibilityReport.overallGrade.label}</p>
                                        </div>

                                        {/* 강점/약점 */}
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3.5">
                                                <p className="text-[11px] font-bold text-emerald-400 mb-2.5 tracking-wide">✦ 강점</p>
                                                <div className="space-y-1.5">
                                                    {resultData.compatibilityReport.overallGrade.strengths.map((s: string, i: number) => (
                                                        <p key={i} className="text-[12px] text-[var(--text-secondary)] leading-snug">• {s}</p>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-rose-500/[0.06] border border-rose-500/15 rounded-xl p-3.5">
                                                <p className="text-[11px] font-bold text-rose-400 mb-2.5 tracking-wide">✦ 약점</p>
                                                <div className="space-y-1.5">
                                                    {resultData.compatibilityReport.overallGrade.weaknesses.map((w: string, i: number) => (
                                                        <p key={i} className="text-[12px] text-[var(--text-secondary)] leading-snug">• {w}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 최종 메시지 */}
                                        <div className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-4">
                                            <p className="text-[13px] text-[var(--text-secondary)] leading-[1.8] whitespace-pre-wrap font-medium">
                                                {resultData.compatibilityReport.overallGrade.finalMessage}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-gold)]/20 to-transparent" />
                                </motion.div>
                            </section>
                        )}
                    </div>
                )}

                {/* ─── 클로징 아웃트로: 힐링 위로 섹션 ─── */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    className="relative mt-4"
                >
                    <div className="absolute -inset-3 bg-gradient-to-br from-[var(--accent-soft)] via-rose-500/6 to-purple-500/5 rounded-3xl blur-2xl animate-soft-glow pointer-events-none" />

                    <div
                        className="relative overflow-hidden rounded-2xl border border-[var(--accent-border)]"
                        style={{
                            background: 'linear-gradient(165deg, rgba(216,72,94,0.06) 0%, rgba(240,106,126,0.04) 40%, rgba(10,9,12,0.95) 100%)',
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-amber)]/30 to-transparent" />

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
                                <p className="text-[13px] font-bold tracking-widest text-[var(--accent-amber)] uppercase" style={{opacity:0.8}}>
                                    💌 [다시, 우리]가 당신을 응원합니다
                                </p>
                            </div>

                            <p className="text-[14px] text-[var(--text-secondary)] leading-[1.8] text-center font-medium">
                                사주라는 것은 절대적인 미래를 정해놓은 것이 아니라,
                                <span className="text-[var(--text-primary)] font-bold"> 우리가 나아갈 수 있는 여러 길 중 가장 지혜로운 방향</span>을 알려주는 지도와 같습니다.<br /><br />
                                분석 결과가 생각보다 좋게 나왔다면 그 운을 믿고 용기를 내시고,<br />
                                아쉬운 결과가 나왔더라도 너무 상심하지 마세요.<br /><br />
                                <span className="text-[var(--accent-gold)] font-bold">당신의 진심과 노력</span>이 언제나 운명보다 더 강한 힘을 발휘한다는 사실을 잊지 마시길 바랍니다.<br />
                                앞으로 걸어갈 당신의 모든 시간에 따뜻한 빛이 함께하기를 진심으로 응원합니다.
                            </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-gold)]/20 to-transparent" />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
