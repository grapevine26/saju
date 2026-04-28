"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSajuStore } from "@/store/useSajuStore";
import toast from "react-hot-toast";import { Suspense } from "react";

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    const [status, setStatus] = useState<"confirming" | "analyzing" | "success" | "error">("confirming");
    const [errorMessage, setErrorMessage] = useState("");
    const { reunionHistory, setPremiumJobId } = useSajuStore();
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!paymentKey || !orderId || !amount) {
            setErrorMessage("유효하지 않은 결제 정보입니다.");
            setStatus("error");
            return;
        }

        if (hasStarted.current) return;
        hasStarted.current = true;

        const processPaymentAndAnalysis = async () => {
            try {
                // 1. LocalStorage에서 임시 결제 정보 불러오기
                const pendingDataStr = localStorage.getItem('pendingTossPayment');
                if (!pendingDataStr) {
                    throw new Error("결제 정보(세션)를 찾을 수 없습니다.");
                }
                const pendingData = JSON.parse(pendingDataStr);

                if (pendingData.orderId !== orderId) {
                    throw new Error("주문 번호가 일치하지 않습니다.");
                }

                // 2. 토스페이먼츠 결제 승인 API 호출
                const confirmRes = await fetch("/api/toss/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
                });

                const confirmData = await confirmRes.json();
                if (!confirmRes.ok || !confirmData.success) {
                    if (confirmData.code === 'ALREADY_PROCESSED_PAYMENT') {
                        // React Strict Mode로 인한 중복 호출 무시
                        console.log("React Strict Mode: ALREADY_PROCESSED_PAYMENT ignored");
                        return;
                    } else {
                        throw new Error(confirmData.message || "결제 승인에 실패했습니다.");
                    }
                }

                // 3. 결제 승인 성공 -> AI 분석 시작
                setStatus("analyzing");
                
                // reunionHistory에서 원본 데이터 복원
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
                localStorage.removeItem('pendingTossPayment');

            } catch (err: any) {
                console.error(err);
                setErrorMessage(err.message || "오류가 발생했습니다.");
                setStatus("error");
            }
        };

        processPaymentAndAnalysis();
    }, [paymentKey, orderId, amount, reunionHistory, setPremiumJobId]);

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
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0e1a] text-white">
            {status === "confirming" && (
                <div className="text-center space-y-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full mx-auto"
                    />
                    <h2 className="text-xl font-bold">결제 정보를 확인하고 있습니다...</h2>
                </div>
            )}

            {status === "analyzing" && (
                <div className="text-center space-y-8 max-w-sm mx-auto">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="relative w-32 h-32 mx-auto flex items-center justify-center"
                    >
                        <div className="absolute inset-0 w-full h-full border border-white/5 rounded-full border-dashed" />
                        <div className="absolute top-0 w-3 h-3 bg-amber-500 rounded-full blur-[2px]" />
                        <div className="absolute bottom-0 w-3 h-3 bg-indigo-500 rounded-full blur-[2px]" />
                        <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.4)]" />
                    </motion.div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-amber-400 mb-2">결제 완료!</h2>
                        <h3 className="text-xl font-bold text-white mb-4">두 사람의 인연을 딥러닝 중입니다</h3>
                        <p className="text-slate-400 text-sm break-keep leading-relaxed">
                            수만 건의 사주 데이터를 기반으로<br/>
                            최적의 타이밍과 전략을 계산하고 있습니다.<br/>
                            <span className="text-amber-500 font-bold mt-2 inline-block">화면을 닫지 말고 잠시만 기다려주세요!</span>
                        </p>
                    </div>
                </div>
            )}

            {status === "success" && (
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl"
                    >
                        ✓
                    </motion.div>
                    <h2 className="text-2xl font-bold">분석이 완료되었습니다!</h2>
                    <p className="text-slate-400">결과 페이지로 이동합니다...</p>
                </div>
            )}

            {status === "error" && (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full mx-auto flex items-center justify-center text-4xl">
                        !
                    </div>
                    <h2 className="text-xl font-bold text-rose-400">결제/분석 오류</h2>
                    <p className="text-slate-400">{errorMessage}</p>
                    <button 
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
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
