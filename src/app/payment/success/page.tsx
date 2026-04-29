"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSajuStore } from "@/store/useSajuStore";
import toast from "react-hot-toast";import { Suspense } from "react";

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("paymentId");

    const [status, setStatus] = useState<"confirming" | "analyzing" | "success" | "error">("confirming");
    const [errorMessage, setErrorMessage] = useState("");
    const { setPremiumJobId } = useSajuStore();
    const hasStarted = useRef(false);

    // Zustand persist hydration이 완료될 때까지 대기하는 헬퍼
    const waitForHydration = (): Promise<void> => {
        return new Promise((resolve) => {
            // persist의 onRehydrateStorage가 완료되었는지 확인
            const checkHydration = () => {
                const state = useSajuStore.getState();
                if (state.reunionHistory && state.reunionHistory.length > 0) {
                    resolve();
                    return;
                }
                // localStorage에서 직접 확인하여 hydration 대기
                const raw = localStorage.getItem('saju-storage');
                if (raw) {
                    // 데이터가 있으면 약간의 딜레이 후 재확인 (hydration 완료 대기)
                    setTimeout(checkHydration, 100);
                } else {
                    resolve(); // 데이터 자체가 없는 경우
                }
            };
            checkHydration();
        });
    };

    useEffect(() => {
        if (!paymentId) {
            setErrorMessage("유효하지 않은 결제 정보입니다.");
            setStatus("error");
            return;
        }

        if (hasStarted.current) return;
        hasStarted.current = true;

        const processPaymentAndAnalysis = async () => {
            try {
                // 1. LocalStorage에서 임시 결제 정보 불러오기
                const pendingDataStr = localStorage.getItem('pendingPortOnePayment');
                if (!pendingDataStr) {
                    throw new Error("결제 정보(세션)를 찾을 수 없습니다.");
                }
                const pendingData = JSON.parse(pendingDataStr);

                if (pendingData.paymentId !== paymentId) {
                    throw new Error("주문 번호가 일치하지 않습니다.");
                }

                // 2. 포트원 결제 승인 API 호출
                const confirmRes = await fetch("/api/portone/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId }),
                });

                const confirmData = await confirmRes.json();
                if (!confirmRes.ok || !confirmData.success) {
                    if (confirmData.code === 'ALREADY_PROCESSED_PAYMENT') {
                        console.log("React Strict Mode: ALREADY_PROCESSED_PAYMENT ignored");
                        return;
                    } else {
                        throw new Error(confirmData.message || "결제 승인에 실패했습니다.");
                    }
                }

                // 3. 결제 승인 성공 -> AI 분석 시작
                setStatus("analyzing");
                
                // Zustand hydration 완료 대기 후 최신 상태에서 원본 데이터 복원
                await waitForHydration();
                const { reunionHistory } = useSajuStore.getState();
                const targetRecord = reunionHistory.find(r => r.id === pendingData.recordId);
                if (!targetRecord) {
                    throw new Error("원본 분석 데이터를 찾을 수 없습니다. 다시 시도해주세요.");
                }

                const liteResult = targetRecord.resultData;
                
                const rawData = {
                    myRawInput: targetRecord.myRawInput,
                    partnerRawInput: targetRecord.partnerRawInput,
                    liteResult: liteResult,
                    myDayGan: liteResult.myManseryeok?.day?.gan,
                    myDayZhi: liteResult.myManseryeok?.day?.zhi,
                    partnerDayGan: liteResult.partnerManseryeok?.day?.gan,
                    partnerDayZhi: liteResult.partnerManseryeok?.day?.zhi,
                    metDate: pendingData.metDate,
                    breakupDate: pendingData.breakupDate,
                    breakupReason: pendingData.breakupReason,
                    months: 6
                };

                const payload: any = { rawData, packageId: pendingData.packageId };
                if (pendingData.identifier.type === 'guest') {
                    payload.phoneNumber = pendingData.identifier.value;
                } else {
                    payload.userId = pendingData.identifier.value;
                }

                const startRes = await fetch("/api/premium-analysis/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const startData = await startRes.json();
                
                if (startData.success) {
                    setPremiumJobId(pendingData.recordId, startData.jobId);
                    
                    // 폴링 로직 시작
                    pollJobStatus(startData.jobId, pendingData.recordId);
                } else {
                    throw new Error(startData.error || "분석 요청에 실패했습니다.");
                }

                // 처리 완료된 결제 세션 삭제
                localStorage.removeItem('pendingPortOnePayment');

            } catch (err: any) {
                console.error(err);
                setErrorMessage(err.message || "오류가 발생했습니다.");
                setStatus("error");
            }
        };

        processPaymentAndAnalysis();
    }, [paymentId, setPremiumJobId]);

    const pollJobStatus = (jobId: string, recordId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/job-status?jobId=${jobId}`);
                const data = await res.json();

                if (data.success && data.status === 'completed') {
                    clearInterval(interval);
                    
                    // 결과 병합
                    const { updateReunionResult } = useSajuStore.getState();
                    updateReunionResult(recordId, 'premium', data.aiResult);

                    setStatus("success");
                    toast.success("분석이 완료되었습니다!");
                    
                    setTimeout(() => {
                        router.replace(`/result/${jobId}`);
                    }, 1000);

                } else if (data.success && data.status === 'failed') {
                    clearInterval(interval);
                    setErrorMessage("분석 중 오류가 발생했습니다. 카카오톡 채널로 문의해 주세요.");
                    setStatus("error");
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0e1a] text-white selection:bg-amber-900/50">
            {status === "confirming" && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full mx-auto"
                    />
                    <h2 className="text-xl font-bold">결제 정보를 확인하고 있습니다...</h2>
                </motion.div>
            )}

            {status === "analyzing" && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm mx-auto w-full"
                >
                    {/* 체크 아이콘 */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 rounded-full mx-auto flex items-center justify-center text-3xl mb-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                    >
                        ✓
                    </motion.div>

                    <motion.h2 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-white mb-2"
                    >
                        결제가 완료되었습니다
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-slate-400 text-sm mb-8"
                    >
                        프리미엄 심층 분석을 준비하고 있어요
                    </motion.p>

                    {/* 분석 단계 체크리스트 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6 text-left space-y-3.5"
                    >
                        {[
                            { text: "결제 승인 완료", done: true },
                            { text: "사주 원국 정밀 재분석", done: true },
                            { text: "15장 분량 심층 리포트 생성 중", done: false, active: true },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.15 }}
                                className="flex items-center gap-3"
                            >
                                {step.done ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-400 text-[10px]">✓</span>
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="w-2 h-2 rounded-full bg-amber-500"
                                        />
                                    </div>
                                )}
                                <span className={`text-[13px] font-medium ${step.done ? 'text-slate-500' : step.active ? 'text-white' : 'text-slate-500'}`}>
                                    {step.text}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* SMS 알림 안내 */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">📱</span>
                            <div className="text-left">
                                <p className="text-[13px] font-bold text-amber-300 mb-1">이 화면을 닫아도 괜찮아요</p>
                                <p className="text-[12px] text-slate-400 leading-relaxed break-keep">
                                    분석이 완료되면 <span className="text-white font-medium">문자(SMS)</span>로 결과 링크를 보내드립니다. 약 2~3분 정도 소요돼요.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 홈으로 돌아가기 버튼 */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        onClick={() => router.push('/')}
                        className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors font-medium underline underline-offset-4 decoration-slate-700"
                    >
                        홈으로 돌아가기
                    </motion.button>
                </motion.div>
            )}

            {status === "success" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 rounded-full mx-auto flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                    >
                        ✓
                    </motion.div>
                    <h2 className="text-2xl font-bold">분석이 완료되었습니다!</h2>
                    <p className="text-slate-400 text-sm">결과 페이지로 이동합니다...</p>
                </motion.div>
            )}

            {status === "error" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 max-w-sm mx-auto"
                >
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full mx-auto flex items-center justify-center text-3xl">
                        !
                    </div>
                    <h2 className="text-xl font-bold text-rose-400">결제/분석 오류</h2>
                    <p className="text-slate-400 text-sm break-keep">{errorMessage}</p>
                    <button 
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors text-sm"
                    >
                        홈으로 돌아가기
                    </button>
                </motion.div>
            )}
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a]"></div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
