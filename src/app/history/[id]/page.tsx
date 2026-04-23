"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, Sparkles, AlertCircle, CalendarHeart, Heart, Lock, RefreshCcw, Share2, Route } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ReunionGauge from "@/components/ReunionGauge";
import CompatibilityChart from "@/components/CompatibilityChart";
import SajuAccordion from "@/components/SajuAccordion";
import GoldenWindowTimeline from "@/components/GoldenWindowTimeline";
import MonthlyEnergyFlow from "@/components/MonthlyEnergyFlow";
import LongTermRoadmap from "@/components/LongTermRoadmap";
import GoldenWindowCalendar from "@/components/GoldenWindowCalendar";
import LoadingOverlay from "@/components/LoadingOverlay";
import PhoneInput from "@/components/PhoneInput";

export default function HistoryDetailPage() {
    const { reunionHistory, updateReunionResult, setPremiumJobId } = useSajuStore();
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPremiumPending, setIsPremiumPending] = useState(false);
    const [pollingJobId, setPollingJobId] = useState<string | null>(null);

    const isDev = process.env.NODE_ENV === 'development';

    // 폴링 로직: 백그라운드 작업 완료를 기다림 (로컬/운영 모두 동작)
    useEffect(() => {
        if (!pollingJobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/job-status?jobId=${pollingJobId}`);
                const data = await res.json();
                if (data.success && data.status === 'completed') {
                    clearInterval(interval);
                    // localStorage tier를 premium으로 즉시 갱신
                    const record = reunionHistory.find(r => r.id === id);
                    if (record) {
                        updateReunionResult(record.id, 'premium', record.resultData);
                    }
                    router.push(`/result/${pollingJobId}`);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pollingJobId, router, reunionHistory, id, updateReunionResult]);
    const [discountEndsAt, setDiscountEndsAt] = useState<string>('');
    const [showHeader, setShowHeader] = useState(true);
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

    useEffect(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        setDiscountEndsAt(`${date.getMonth() + 1}/${date.getDate()}`);
    }, []);

    // URL id를 바탕으로 기록 찾기
    const record = reunionHistory.find(r => r.id === id);

    // 페이지 진입 시 premiumJobId가 있으면 자동으로 완료 여부 확인
    useEffect(() => {
        if (!record || record.tier === 'premium' || !record.premiumJobId) return;

        const checkPremiumStatus = async () => {
            try {
                const res = await fetch(`/api/job-status?jobId=${record.premiumJobId}`);
                const data = await res.json();
                if (data.success && data.status === 'completed') {
                    // tier를 즉시 premium으로 갱신한 뒤 결과 페이지로 이동
                    updateReunionResult(record.id, 'premium', record.resultData);
                    router.push(`/result/${record.premiumJobId}`);
                } else if (data.success && data.status === 'processing') {
                    setIsPremiumPending(true);
                    // 아직 처리 중이면 폴링 시작
                    setPollingJobId(record.premiumJobId!);
                }
            } catch (err) {
                console.error("프리미엄 상태 확인 실패:", err);
            }
        };

        checkPremiumStatus();
    }, [record, router, updateReunionResult]);

    if (!record) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">기록을 찾을 수 없어요</h2>
                <p className="text-slate-400 mb-6">삭제되었거나 존재하지 않는 분석 결과입니다.</p>
                <button onClick={() => router.push('/history')} className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium">목록으로 돌아가기</button>
            </div>
        );
    }

    const { myInfo, partnerInfo, tier } = record;
    // resultData를 state로 관리하여 업그레이드 시 즉시 반영
    const resultData = record.resultData;
    const compatibility = resultData.compatibility;
    const isLite = tier !== 'premium';

    const handleUpgradeClick = () => {
        if (!record.myRawInput || !record.partnerRawInput) {
            toast.error("초기 버전의 데이터는 상세 정보가 부족하여 업그레이드할 수 없습니다. 새로 분석을 진행해주세요.");
            return;
        }
        if (isDev) {
            setPhoneNumber('01000000000');
        }
        setShowPhoneModal(true);
    };

    const startPremiumAnalysis = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error("올바른 전화번호를 입력해 주세요.");
            return;
        }

        if (isDev) {
            setIsUpgrading(true);
        } else {
            setIsPremiumPending(true);
        }
        setShowPhoneModal(false);

        try {
            const rawData = {
                myRawInput: record.myRawInput,
                partnerRawInput: record.partnerRawInput,
                liteResult: record, // History의 record 전체 (liteResult)
                myDayGan: resultData.myManseryeok?.day?.gan,
                myDayZhi: resultData.myManseryeok?.day?.zhi,
                partnerDayGan: resultData.partnerManseryeok?.day?.gan,
                partnerDayZhi: resultData.partnerManseryeok?.day?.zhi,
                metDate: (record as any).metDate || '',
                breakupDate: (record as any).breakupDate || '',
                breakupReason: (record as any).breakupReason || '',
                months: 6
            };

            const res = await fetch("/api/premium-analysis/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber,
                    rawData
                }),
            });

            const data = await res.json();

            if (data.success) {
                // localStorage에 jobId 기록
                setPremiumJobId(record.id, data.jobId);
                // 환경 무관하게 폴링 시작
                setPollingJobId(data.jobId);
                if (isDev) {
                    toast.success("로컬 테스트: 백그라운드 분석을 시작합니다. 화면을 유지해주세요.");
                } else {
                    toast.success("접수 완료! 분석이 끝나면 자동으로 이동됩니다. 문자로도 알려드릴게요.");
                    setIsPremiumPending(true);
                    setIsUpgrading(false);
                }
            } else {
                toast.error(data.error || "요청에 실패했습니다.");
                setIsUpgrading(false);
            }
        } catch (err) {
            console.error(err);
            toast.error("네트워크 오류가 발생했습니다.");
            setIsUpgrading(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 relative">
            <header className={`fixed top-0 left-0 right-0 max-w-[480px] mx-auto flex items-center justify-between p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors mr-1">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-semibold text-white">지난 분석 리포트</span>
                <button className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="p-6 pt-20 space-y-8">
                {/* 1. 재회 가능성 게이지 */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="glass-card p-8 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3">
                        <span className="text-xs bg-white/10 text-slate-400 font-medium px-2 py-1 rounded-bl-xl rounded-tr-xl">과거 기록</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1 font-medium mt-2">
                        {myInfo.name} ✕ {partnerInfo.name}
                    </p>
                    <ReunionGauge score={resultData.reunionScore || (compatibility && compatibility.reunionScore)} />

                    <div className="mt-6 pt-5 border-t border-white/5">
                        <p className="text-xs font-bold text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full mb-3">
                            {resultData.reunionKeyword}
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
                            isPremium={tier === 'premium'}
                        />
                    </motion.div>
                )}

                {/* 4. 골든 윈도우 (Premium) */}
                {resultData.goldenWindows && !isLite ? (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <CalendarHeart className="w-4 h-4 text-amber-400" />
                            골든 윈도우 캘린더
                        </h2>
                        <GoldenWindowTimeline
                            windows={resultData.goldenWindows.windows}
                            bestMonth={resultData.goldenWindows.bestMonth}
                        />

                        {resultData.goldenWindows.monthlyEnergies && resultData.goldenWindows.monthlyEnergies.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 px-2 tracking-tight">월별 에너지 흐름</h3>
                                <MonthlyEnergyFlow energies={resultData.goldenWindows.monthlyEnergies} />
                            </div>
                        )}

                        {/* 연락 최적기 캘린더 */}
                        {resultData.goldenWindows.goldenWindowMonths && resultData.goldenWindows.goldenWindowMonths.length > 0 && (
                            <GoldenWindowCalendar months={resultData.goldenWindows.goldenWindowMonths} />
                        )}

                        {resultData.goldenWindows.roadmapStages && resultData.goldenWindows.roadmapStages.length > 0 && (
                            <div className="mt-10 mb-2 p-1">
                                <h3 className="text-sm font-bold text-slate-300 mb-5 px-1 tracking-tight flex items-center gap-2">
                                    <Route className="w-4 h-4 text-emerald-400" />
                                    장기 전략 로드맵
                                </h3>
                                <LongTermRoadmap stages={resultData.goldenWindows.roadmapStages} />
                            </div>
                        )}

                        {resultData.goldenWindows.details && resultData.goldenWindows.details.length > 0 && (!resultData.goldenWindows.monthlyEnergies || resultData.goldenWindows.monthlyEnergies.length === 0) && (
                            <div className="mt-6">
                                <SajuAccordion details={resultData.goldenWindows.details} isPremium={true} />
                            </div>
                        )}
                    </motion.div>
                ) : isLite ? (
                    /* Lite 유저: 프리미엄 업그레이드 CTA */
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card py-10 px-6 text-center relative overflow-hidden my-8 min-h-[420px] flex flex-col items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0e1a]/90 z-10" />
                        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none flex flex-col items-center justify-center w-full px-6">
                            <div className="h-6 bg-white/5 rounded-lg mb-4 w-3/4" />
                            <div className="h-4 bg-white/5 rounded-lg mb-6 w-1/2" />
                            <div className="space-y-3 w-full">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-8 bg-white/5 rounded-lg w-full" />
                                ))}
                            </div>
                        </div>
                        <div className="relative z-20 flex flex-col items-center justify-center w-full">
                            <Lock className="w-10 h-10 text-amber-400 mb-6 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                            <h3 className="text-[19px] font-bold text-white mb-6 tracking-tight">프리미엄 재회 전략</h3>
                            <ul className="text-[14px] text-slate-300 mb-8 space-y-3.5 text-center font-medium bg-white/5 py-6 px-6 rounded-2xl border border-white/10 w-full max-w-[90%] shadow-inner">
                                <li className="flex items-center gap-2 justify-center"><Heart className="w-4 h-4 text-rose-400" /> 재회 전략 리포트 전체 공개</li>
                                <li className="flex items-center gap-2 justify-center"><CalendarHeart className="w-4 h-4 text-amber-500" /> 연락 최적기 <strong>골든 윈도우 캘린더</strong></li>
                                <li className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4 text-indigo-400" /> 향후 6개월의 <strong>월별 에너지 흐름</strong></li>
                                <li className="flex items-center gap-2 justify-center"><Route className="w-4 h-4 text-emerald-400" /> 재회 골인 <strong>3단계 장기 로드맵</strong></li>
                            </ul>
                        </div>
                    </motion.div>
                ) : null}

                {/* 힐링 아웃트로 (Premium 전용) */}
                {!isLite && (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                        className="relative mt-4"
                    >
                        <div className="absolute -inset-3 bg-gradient-to-br from-amber-500/8 via-rose-500/6 to-purple-500/5 rounded-3xl blur-2xl pointer-events-none" />
                        <div className="relative overflow-hidden rounded-2xl border border-amber-500/15" style={{ background: 'linear-gradient(165deg, rgba(245,158,11,0.06) 0%, rgba(244,63,94,0.04) 40%, rgba(15,23,42,0.95) 100%)' }}>
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                            <div className="p-7 sm:p-8">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl" />
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                            <Heart className="w-7 h-7 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]" fill="currentColor" />
                                        </div>
                                    </div>
                                    <p className="text-[13px] font-bold tracking-widest text-amber-400/80 uppercase">💌 [다시, 우리]가 당신을 응원합니다</p>
                                </div>
                                <div className="space-y-4 text-center">
                                    <p className="text-[15px] leading-[2] text-slate-300 font-medium break-keep">얼마나 잠 못 이루며<br className="sm:hidden" /> 불안한 밤들을 보내셨나요.</p>
                                    <p className="text-[14px] leading-[2] text-slate-400 font-medium break-keep">어쩌면 그 사람도<br className="sm:hidden" /> 당신과 똑같이 고민하고 있을지도 모릅니다.</p>
                                    <p className="text-[14px] leading-[2] text-slate-400 font-medium break-keep">오늘부터는 너무 아파하지만 말고,<br />당신의 삶을 단단하게 만드세요.</p>
                                    <div className="flex items-center justify-center gap-3 py-2">
                                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-500/30" />
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500/50" />
                                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-500/30" />
                                    </div>
                                    <p className="text-[14px] leading-[2] text-slate-300/90 font-medium break-keep">저희가 찾아드린 이 골든 윈도우가<br />두 사람을 다시 이어주는<br /><span className="text-amber-400 font-bold">튼튼한 다리</span>가 되기를<br />진심으로 기도합니다.</p>
                                </div>
                                <div className="mt-7 pt-5 border-t border-white/5 text-center">
                                    <p className="text-[12px] text-slate-500 font-medium tracking-wide">— 다시, 우리 —</p>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
                        </div>
                    </motion.div>
                )}
                {/* ─── 업그레이드 전용 로딩 스크린 ─── */}
                <LoadingOverlay isVisible={isUpgrading} />
            </main>

            {/* 하단 고정 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-[#0a0e1a]/90 backdrop-blur-md pb-6 border-t border-white/5 z-50">
                {!isLite ? (
                    <button
                        onClick={() => router.push('/input')}
                        className="w-full bg-white/5 border border-white/10 text-slate-300 active:bg-white/10 font-semibold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        새로운 분석 시작
                    </button>
                ) : isPremiumPending ? (
                    <button
                        disabled
                        className="w-full bg-white/10 border border-white/20 text-white font-semibold py-4 rounded-2xl flex justify-center items-center gap-2"
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                            <RefreshCcw className="w-5 h-5 opacity-70" />
                        </motion.div>
                        분석 중입니다. 문자를 기다려주세요!
                    </button>
                ) : (
                    <button
                        onClick={handleUpgradeClick}
                        disabled={isUpgrading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1 shadow-[0_8px_32px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isUpgrading ? <span>분석 준비 중...</span> : (
                            <>
                                <span className="text-[15px]">Premium 심층 리포트 열람하기</span>
                                <span className="text-[12px] font-bold text-amber-100/90 tracking-wider">
                                    <span className="line-through opacity-70 mr-1">39,900원</span>13,900원 (~{discountEndsAt} 마감)
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* 전화번호 입력 모달 */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f1423] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-2 text-center">알림 받으실 연락처</h3>
                        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
                            프리미엄 분석은 약 2~3분이 소요됩니다.<br/>화면을 끄셔도 완성 시 문자로 알려드려요!
                        </p>
                        
                        <PhoneInput 
                            value={phoneNumber} 
                            onChange={setPhoneNumber} 
                        />
                        
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setShowPhoneModal(false)}
                                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={startPremiumAnalysis}
                                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                            >
                                분석 시작
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
