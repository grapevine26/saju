"use client";

/**
 * 분석 결과 대시보드 — "다시, 우리" 핵심 페이지
 * 재회 가능성 게이지 + 궁합 차트 + 전략 리포트 + 골든 윈도우
 */
import { useSajuStore } from "@/store/useSajuStore";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Sparkles, RefreshCcw, Lock, CalendarHeart, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReunionGauge from "@/components/ReunionGauge";
import CompatibilityChart from "@/components/CompatibilityChart";
import SajuAccordion from "@/components/SajuAccordion";
import GoldenWindowTimeline from "@/components/GoldenWindowTimeline";
import MonthlyEnergyFlow from "@/components/MonthlyEnergyFlow";
import LongTermRoadmap from "@/components/LongTermRoadmap";
import GoldenWindowCalendar from "@/components/GoldenWindowCalendar";
import { Route } from "lucide-react";
import toast from "react-hot-toast";
import LoadingOverlay from "@/components/LoadingOverlay";
import UpgradeModal from "@/components/UpgradeModal";
import PaymentModal from "@/components/PaymentModal";


export default function AnalysisPage() {
    const router = useRouter();
    const {
        name, gender, calendarType, birthYear, birthMonth, birthDay,
        birthCity, birthHour, birthMinute, isTimeUnknown,
        birthTimezone, birthLongitude,
        partnerName, partnerGender, partnerCalendarType,
        partnerBirthYear, partnerBirthMonth, partnerBirthDay,
        partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown,
        partnerBirthTimezone, partnerBirthLongitude,
        currentTier, saveReunionResult, updateReunionResult, setPremiumJobId, resetAll,
        metDate, breakupDate, breakupReason, reunionHistory,
    } = useSajuStore();

    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [discountEndsAt, setDiscountEndsAt] = useState<string>('');
    const hasFetched = useRef(false);
    const recordId = useRef<string | null>(null);
    const [showHeader, setShowHeader] = useState(true);
    const lastScrollY = useRef(0);

    // 프리미엄 백그라운드 처리 관련 상태
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('basic');

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
                    if (recordId.current) {
                        // API에서 준 aiResult(프리미엄 데이터)를 기존 히스토리에 병합
                        updateReunionResult(recordId.current, 'premium', data.aiResult);
                    }
                    clearInterval(interval);
                    // 잠시 대기 후 결과 페이지로 이동 (DB 반영 시간 확보)
                    setTimeout(() => {
                        router.push(`/result/${pollingJobId}`);
                    }, 500);
                } else if (data.success && data.status === 'failed') {
                    clearInterval(interval);
                    toast.error("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
                    setIsPremiumPending(false);
                    setIsUpgrading(false);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000); // 3초마다 확인

        return () => clearInterval(interval);
    }, [pollingJobId, router, result, updateReunionResult]);

    useEffect(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        setDiscountEndsAt(`${date.getMonth() + 1}/${date.getDate()}`);
    }, []);

    // 스크롤 방향 감지: 내리면 헤더 숨김, 올리면 표시
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
        if (hasFetched.current) return;

        // 1. 상태가 아직 로드되지 않은 경우 방어 (Hydration)
        if (!name || !partnerName) {
            const timer = setTimeout(() => {
                // 1초가 지나도 값이 없으면 (진짜 유실된 경우) 튕김
                toast.error("입력 데이터가 초기화되었습니다. 메인으로 돌아갑니다.");
                router.push("/");
            }, 1000);
            return () => clearTimeout(timer);
        }

        hasFetched.current = true;

        // 2. 새로고침 시 무의미한 API 재호출 방지 (이름 + 생년월일이 모두 일치할 때만 캐시 로드)
        const recentHistory = reunionHistory && reunionHistory.length > 0 ? reunionHistory[0] : null;
        if (recentHistory
            && recentHistory.myInfo.name === name
            && recentHistory.partnerInfo.name === partnerName
            && recentHistory.myInfo.birthDate === `${birthYear}-${birthMonth}-${birthDay}`
            && recentHistory.partnerInfo.birthDate === `${partnerBirthYear}-${partnerBirthMonth}-${partnerBirthDay}`
        ) {
            setResult(recentHistory.resultData);
            setIsPremium(recentHistory.tier === 'premium');
            recordId.current = recentHistory.id;
            return;
        }

        const fetchAnalysis = async () => {
            try {
                const res = await fetch("/api/reunion", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        my: {
                            name, gender, calendarType,
                            birthYear, birthMonth, birthDay,
                            birthCity, birthHour, birthMinute, isTimeUnknown,
                            birthTimezone, birthLongitude,
                        },
                        partner: {
                            name: partnerName,
                            gender: partnerGender,
                            calendarType: partnerCalendarType,
                            birthYear: partnerBirthYear,
                            birthMonth: partnerBirthMonth,
                            birthDay: partnerBirthDay,
                            birthCity: partnerBirthCity,
                            birthHour: partnerBirthHour,
                            birthMinute: partnerBirthMinute,
                            isTimeUnknown: partnerIsTimeUnknown,
                            birthTimezone: partnerBirthTimezone,
                            birthLongitude: partnerBirthLongitude,
                        },
                        tier: 'lite',
                        metDate: metDate || undefined,
                        breakupDate: breakupDate || undefined,
                        breakupReason: breakupReason || undefined,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setResult(data.data);
                    recordId.current = saveReunionResult('lite', data.data);
                } else {
                    setError(data.error || "분석 중 오류가 발생했습니다.");
                }
            } catch (err) {
                console.error(err);
                setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
            }
        };

        fetchAnalysis();
    }, [name, partnerName, reunionHistory, router, saveReunionResult, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown, birthTimezone, birthLongitude, partnerGender, partnerCalendarType, partnerBirthYear, partnerBirthMonth, partnerBirthDay, partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, partnerBirthTimezone, partnerBirthLongitude, metDate, breakupDate, breakupReason]);

    const handleRestart = () => {
        resetAll();
        router.push("/");
    };

    const handleUpgradeClick = () => {
        if (!result) return;
        setShowPaymentModal(true);
    };

    const handlePaymentSelect = (method: 'kakao' | 'naver' | 'general', packageId: string) => {
        // 실제 운영 시엔 여기서 PG사(토스/포트원) 결제창을 먼저 띄우거나, 결제 데이터(packageId, method)를 state에 저장
        // 현재는 결제 수단 클릭 시 다음 단계인 '로그인/비회원 선택 모달'을 엽니다.
        setSelectedPackageId(packageId);
        setShowPaymentModal(false);
        setShowUpgradeModal(true);
    }

    const startPremiumAnalysis = async (identifier: { type: 'guest' | 'member', value: string }) => {

        if (identifier.type === 'guest' && (!identifier.value || identifier.value.length < 10)) {
            toast.error("올바른 전화번호를 입력해 주세요.");
            return;
        }

        setShowUpgradeModal(false);

        try {
            const amount = selectedPackageId === 'premium' ? 19900 : 13900;
            const orderName = selectedPackageId === 'premium' ? '완벽한 재회를 위한 궁합 플랜' : '재회사주';
            const customerMobilePhone = identifier.value.replace(/[^0-9]/g, '');

            const orderId = `${recordId.current}${Date.now()}`;

            // localStorage에 임시 저장 (결제 성공 페이지에서 꺼내서 사용)
            localStorage.setItem('pendingPortOnePayment', JSON.stringify({
                paymentId: orderId, // PortOne v2 에서는 paymentId 사용
                packageId: selectedPackageId,
                identifier,
                recordId: recordId.current,
                metDate,
                breakupDate,
                breakupReason
            }));

            const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || 'store-e1332c86-53fa-4ab8-aca7-085909baaebf';
            const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || 'channel-key-819c3a5b-c1a6-4381-aa9a-29c19b34345b';

            const PortOne = await import('@portone/browser-sdk/v2');

            const response = await PortOne.requestPayment({
                storeId,
                channelKey,
                paymentId: orderId,
                orderName,
                totalAmount: amount,
                currency: "CURRENCY_KRW",
                payMethod: "CARD",
                customer: {
                    customerId: identifier.value || 'ANONYMOUS',
                    fullName: name || '익명',
                    phoneNumber: customerMobilePhone,
                    email: 'guest@sajupop.com'
                },
                redirectUrl: `${window.location.origin}/payment/success`
            } as any);

            if (response?.code != null) {
                throw new Error(response.message || "결제에 실패했습니다.");
            }

            // PC 브라우저: 팝업 결제 완료 후 직접 success 페이지로 이동
            if (response?.paymentId) {
                window.location.href = `/payment/success?paymentId=${encodeURIComponent(response.paymentId)}`;
            }

        } catch (err: any) {
            console.error(err);
            if (err.code !== 'USER_CANCEL') {
                toast.error("결제창 호출에 실패했습니다.");
            }
            if (!isDev) setIsPremiumPending(false);
        }
    };

    // 에러 화면
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-rose-400 mb-4 font-medium">{error}</p>
                <button onClick={handleRestart} className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/15 transition-colors">
                    돌아가기
                </button>
            </div>
        );
    }

    // 로딩 화면
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 selection:bg-amber-900/50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="relative w-32 h-32 mb-12 flex items-center justify-center"
                >
                    <div className="absolute inset-0 w-full h-full border border-white/5 rounded-full border-dashed" />
                    <div className="absolute top-0 w-3 h-3 bg-amber-500 rounded-full blur-[2px]" />
                    <div className="absolute bottom-0 w-3 h-3 bg-indigo-500 rounded-full blur-[2px]" />
                    <div className="absolute left-0 w-3 h-3 bg-rose-500 rounded-full blur-[2px]" />
                    <div className="absolute right-0 w-3 h-3 bg-purple-500 rounded-full blur-[2px]" />
                    <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.4)]" />
                </motion.div>

                <div className="space-y-3 text-center">
                    <h2 className="text-2xl font-bold text-gradient-gold">
                        두 사람의 인연을 분석하는 중 🔮
                    </h2>
                    <motion.p
                        className="text-slate-500 text-sm font-medium"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        사주 데이터를 정밀 분석하고 있어요...
                    </motion.p>
                </div>
            </div>
        );
    }

    // 결과 화면
    const compatibility = result.compatibility;

    return (
        <div className="min-h-screen pb-24 relative">
            <header className={`fixed top-0 left-0 right-0 max-w-[480px] mx-auto flex items-center justify-between p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
                <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-white">분석 리포트</span>
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
                    className="glass-card p-8 text-center"
                >
                    <p className="text-sm text-slate-500 mb-1 font-medium">
                        {name || "나"} ✕ {partnerName || "그 사람"}
                    </p>
                    <ReunionGauge score={result.reunionScore || compatibility.reunionScore} />

                    <div className="mt-6 pt-5 border-t border-white/5">
                        <p className="text-xs font-bold text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full mb-3">
                            {result.reunionKeyword}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {result.summary}
                        </p>
                    </div>
                </motion.div>

                {/* 2. 궁합 차트 */}
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

                {/* 2.5. 관계의 본질 독립 카드 */}
                {result.essenceAnalysis && (
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
                            {result.essenceAnalysis.subtitle && (
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">✨</span>
                                    <p className="text-[15px] font-bold text-amber-400 leading-snug">
                                        {result.essenceAnalysis.subtitle}
                                    </p>
                                </div>
                            )}
                            <div className="text-slate-300 text-[14px] leading-[1.85] whitespace-pre-wrap font-medium">
                                {result.essenceAnalysis.content}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2.8. 시크릿 티저 (Lite 전용 블러, Premium 전용 언블러) */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.28 }}
                >
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        {isPremium ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-rose-400" />}
                        {isPremium ? "핵심 행동 지침 요약" : "핵심 행동 지침"}
                    </h2>
                    <div className={`glass-card p-5 relative overflow-hidden ${isPremium ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.05)]'}`}>
                        {!isPremium && <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />}
                        {isPremium && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />}
                        <div className="text-[14px] leading-[1.8] text-slate-300 font-medium whitespace-pre-wrap break-keep relative z-10">
                            {(result.secretTeaser || `분석 결과, 두 사람의 재회 타이밍은 앞으로 [BLUR]1개월 내[/BLUR]에 찾아옵니다. 이때 상대방의 감정 변화는 [BLUR]그리움과 미련[/BLUR] 상태로 접어들며, 먼저 연락을 [BLUR]기다리는[/BLUR] 것이 핵심 전략입니다.`).split(/(\[BLUR\].*?\[\/BLUR\])/g).map((part: string, i: number) => {
                                if (part.startsWith('[BLUR]') && part.endsWith('[/BLUR]')) {
                                    const blurredText = part.replace('[BLUR]', '').replace('[/BLUR]', '');
                                    return isPremium ? (
                                        <span key={i} className="text-amber-400 font-bold mx-1">
                                            {blurredText || '절대하면안되는행동'}
                                        </span>
                                    ) : (
                                        <span key={i} className="inline-flex relative mx-1 align-middle translate-y-[-1px]">
                                            <span className="blur-[4px] select-none opacity-60 bg-slate-700 text-transparent rounded px-2">{blurredText || '절대하면안되는행동'}</span>
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <Lock className="w-3.5 h-3.5 text-amber-400 drop-shadow-md" />
                                            </span>
                                        </span>
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                        {!isPremium && (
                            <button
                                onClick={handleUpgradeClick}
                                className="mt-5 w-full bg-white/5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all text-[14px] active:scale-[0.98] relative z-10"
                            >
                                <Lock className="w-4 h-4" />
                                가려진 내용 확인하기
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* 3. AI 재회 전략 리포트 */}
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
                        details={result.details}
                        isPremium={isPremium}
                        onUpgrade={handleUpgradeClick}
                    />
                </motion.div>

                {/* 4. 골든 윈도우 (Standard만) */}
                {result.goldenWindows ? (
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
                            windows={result.goldenWindows.windows}
                            bestMonth={result.goldenWindows.bestMonth}
                        />

                        {/* 연락 최적기 캘린더 */}
                        {result.goldenWindows.goldenWindowMonths && result.goldenWindows.goldenWindowMonths.length > 0 && (
                            <GoldenWindowCalendar months={result.goldenWindows.goldenWindowMonths} />
                        )}

                        {/* 월별 에너지 흐름 카드 UI */}
                        {result.goldenWindows.monthlyEnergies && result.goldenWindows.monthlyEnergies.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 px-2 tracking-tight">
                                    월별 에너지 흐름
                                </h3>
                                <MonthlyEnergyFlow energies={result.goldenWindows.monthlyEnergies} />
                            </div>
                        )}



                        {/* 장기 전략 로드맵 3단계 타임라인 UI */}
                        {result.goldenWindows.roadmapStages && result.goldenWindows.roadmapStages.length > 0 && (
                            <div className="mt-10 mb-2 p-1">
                                <h3 className="text-sm font-bold text-slate-300 mb-5 px-1 tracking-tight flex items-center gap-2">
                                    <Route className="w-4 h-4 text-emerald-400" />
                                    장기 전략 로드맵
                                </h3>
                                <LongTermRoadmap stages={result.goldenWindows.roadmapStages} />
                            </div>
                        )}

                        {/* 구버전 호환용 Fallback (details가 남아있다면) */}
                        {result.goldenWindows.details && result.goldenWindows.details.length > 0 && (!result.goldenWindows.monthlyEnergies || result.goldenWindows.monthlyEnergies.length === 0) && (
                            <div className="mt-6">
                                <SajuAccordion
                                    details={result.goldenWindows.details}
                                    isPremium={true}
                                />
                            </div>
                        )}
                    </motion.div>
                ) : (
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
                )}

                {/* ─── 클로징 아웃트로: 힐링 위로 섹션 (프리미엄 전용) ─── */}
                {isPremium && (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                        className="relative mt-4"
                    >
                        {/* 배경 글로우 효과 */}
                        <div className="absolute -inset-3 bg-gradient-to-br from-amber-500/8 via-rose-500/6 to-purple-500/5 rounded-3xl blur-2xl animate-soft-glow pointer-events-none" />

                        <div
                            className="relative overflow-hidden rounded-2xl border border-amber-500/15"
                            style={{
                                background: 'linear-gradient(165deg, rgba(245,158,11,0.06) 0%, rgba(244,63,94,0.04) 40%, rgba(15,23,42,0.95) 100%)',
                            }}
                        >
                            {/* 상단 은은한 빛 라인 */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                            <div className="p-7 sm:p-8">
                                {/* 하트 아이콘 + 타이틀 */}
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

                                {/* 감성 위로 메시지 본문 */}
                                <div className="space-y-4 text-center">
                                    <p className="text-[15px] sm:text-[16px] leading-[2] text-slate-300 font-medium break-keep">
                                        얼마나 잠 못 이루며<br className="sm:hidden" /> 불안한 밤들을 보내셨나요.
                                    </p>
                                    <p className="text-[14px] sm:text-[15px] leading-[2] text-slate-400 font-medium break-keep">
                                        어쩌면 그 사람도<br className="sm:hidden" /> 당신과 똑같이 고민하고 있을지도 모릅니다.
                                    </p>
                                    <p className="text-[14px] sm:text-[15px] leading-[2] text-slate-400 font-medium break-keep">
                                        오늘부터는 너무 아파하지만 말고,<br />
                                        당신의 삶을 단단하게 만드세요.
                                    </p>

                                    {/* 구분선 */}
                                    <div className="flex items-center justify-center gap-3 py-2">
                                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-500/30" />
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500/50" />
                                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-500/30" />
                                    </div>

                                    <p className="text-[14px] sm:text-[15px] leading-[2] text-slate-300/90 font-medium break-keep">
                                        저희가 찾아드린 이 골든 윈도우가<br />
                                        두 사람을 다시 이어주는<br />
                                        <span className="text-amber-400 font-bold">튼튼한 다리</span>가 되기를<br />
                                        진심으로 기도합니다.
                                    </p>
                                </div>

                                {/* 하단 서명 */}
                                <div className="mt-7 pt-5 border-t border-white/5 text-center">
                                    <p className="text-[12px] text-slate-500 font-medium tracking-wide">
                                        — 다시, 우리 —
                                    </p>
                                </div>
                            </div>

                            {/* 하단 은은한 빛 라인 */}
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />
                        </div>
                    </motion.div>
                )}
                {/* ─── 업그레이드 전용 로딩 스크린 ─── */}
                <LoadingOverlay isVisible={isUpgrading} />
            </main>

            {/* 하단 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-[#0a0e1a]/90 backdrop-blur-md pb-6 border-t border-white/5 z-50">
                {isPremium ? (
                    <button
                        onClick={handleRestart}
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
                        {isUpgrading ? <span>요청 중...</span> : (
                            <>
                                <span className="text-[15px]">Premium 심층 리포트 즉시 열람하기</span>
                                <span className="text-[12px] font-bold text-amber-100/90 tracking-wider">
                                    <span className="line-through opacity-70 mr-1">39,900원</span>13,900원 (~{discountEndsAt} 마감)
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* 1단계: 결제 패키지 선택 모달 */}
            {showPaymentModal && (
                <PaymentModal
                    onClose={() => setShowPaymentModal(false)}
                    onSelectPayment={handlePaymentSelect}
                />
            )}

            {/* 2단계: 결제 전 선택 모달 (로그인/비회원) */}
            {showUpgradeModal && (

                <UpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    onStartGuest={(phone) => startPremiumAnalysis({ type: 'guest', value: phone })}
                    onStartMember={(userId) => startPremiumAnalysis({ type: 'member', value: userId })}
                />
            )}
        </div>
    );
}
