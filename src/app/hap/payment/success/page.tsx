"use client";

/**
 * 운명의 합 — 결제 성공 → 승인 → 잡 생성 → 완료 폴링 → 결과 이동
 * 타로 success 패턴 미러 (보관함/reunionHistory 의존 없음).
 */
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUtm, getVisitorId } from "@/utils/utm";
import { trackPurchase } from "@/utils/metaPixel";
import { upgradeToPremium } from "@/features/hap/history";

const C = {
    bg: '#0A090C',
    accentBright: '#D9B872',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    serif: "'Noto Serif KR', serif",
};

const STEPS = [
    '결제를 확인하고 있어요',
    '두 분의 만세력을 계산하고 있어요',
    '타고난 기질의 합을 맞춰보고 있어요',
    '첫 만남부터 노년까지 흐름을 읽고 있어요',
    '리포트를 정리하고 있어요',
];

function HapPaymentSuccessContent() {
    const router = useRouter();
    const params = useSearchParams();
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amountStr = params.get('amount');

    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [stepIdx, setStepIdx] = useState(0);
    const hasStarted = useRef(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (status !== 'loading') return;
        const t = setInterval(() => setStepIdx(s => Math.min(s + 1, STEPS.length - 1)), 5000);
        return () => clearInterval(t);
    }, [status]);

    useEffect(() => {
        if (!paymentKey || !orderId || !amountStr) {
            setErrorMsg('유효하지 않은 결제 정보입니다.'); setStatus('error'); return;
        }
        if (hasStarted.current) return;
        hasStarted.current = true;

        const run = async () => {
            try {
                const pendingRaw = localStorage.getItem('pendingHapPayment');
                if (!pendingRaw) {
                    throw new Error('결제 정보 세션을 찾을 수 없습니다. 결제가 완료되었다면 이메일로 결과 링크가 발송됩니다.');
                }
                const pending = JSON.parse(pendingRaw);
                if (pending.orderId !== orderId) throw new Error('주문 번호가 일치하지 않습니다.');

                const payload = {
                    rawData: {
                        myRawInput: pending.myRawInput,
                        partnerRawInput: pending.partnerRawInput,
                    },
                    packageId: 'compatibility',
                    customerEmail: pending.customerEmail,
                    discountCode: pending.discountCode || null,
                    phoneNumber: 'hap-guest',
                    utm: getUtm(), visitorId: getVisitorId(),
                };

                const confirmRes = await fetch('/api/tosspayments/confirm', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentKey, orderId, amount: Number(amountStr), payload }),
                });
                const confirmData = await confirmRes.json();
                if (!confirmRes.ok || !confirmData.success) {
                    throw new Error(confirmData.message || '결제 승인에 실패했습니다. 결제가 완료되었다면 이메일로 결과 링크를 보내드립니다.');
                }
                const jobId = confirmData.jobId;
                if (!jobId) throw new Error('분석 작업 ID를 받지 못했습니다.');

                trackPurchase(orderId, Number(amountStr));

                // 궁합 보관함 — 무료 미리보기 때 만든 항목을 premium으로 승격 (없으면 새로 추가)
                try {
                    upgradeToPremium(pending.freeRecordId, {
                        jobId,
                        myName: pending.myName || '',
                        partnerName: pending.partnerName || '',
                        totalScore: pending.totalScore ?? null,
                        totalGrade: pending.totalGrade ?? null,
                    });
                } catch {}

                localStorage.removeItem('pendingHapPayment');

                // 완료까지 같은 화면에서 폴링
                const startedAt = Date.now();
                const TIMEOUT_MS = 5 * 60 * 1000;
                pollRef.current = setInterval(async () => {
                    if (Date.now() - startedAt > TIMEOUT_MS) {
                        clearInterval(pollRef.current!);
                        setErrorMsg('분석이 예상보다 오래 걸리고 있어요. 완료되면 이메일로 결과 링크를 보내드립니다.');
                        setStatus('error');
                        return;
                    }
                    try {
                        const res = await fetch(`/api/job-status?jobId=${jobId}`);
                        const data = await res.json();
                        if (data.success && data.status === 'completed') {
                            clearInterval(pollRef.current!);
                            router.replace(`/hap/result/${jobId}`);
                        } else if (data.success && data.status === 'failed') {
                            clearInterval(pollRef.current!);
                            setErrorMsg('분석 중 오류가 발생했습니다. 결제는 자동으로 환불 처리됩니다.');
                            setStatus('error');
                        }
                    } catch { /* 일시 오류 — 다음 폴링에서 재시도 */ }
                }, 3000);
            } catch (err: any) {
                setErrorMsg(err.message || '오류가 발생했습니다.');
                setStatus('error');
            }
        };
        run();

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentKey, orderId, amountStr]);

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {status === 'loading' ? (
                <div style={{ textAlign: 'center' }}>
                    <style>{`
                        @keyframes hap-seal-pulse { 0%,100%{ transform:rotate(-4deg) scale(1);} 50%{ transform:rotate(-4deg) scale(1.06);} }
                    `}</style>
                    <div style={{ width: 62, height: 62, border: `2.5px solid ${C.accentBright}`, color: C.accentBright, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 26, fontWeight: 900, margin: '0 auto 22px', animation: 'hap-seal-pulse 2.4s ease-in-out infinite', boxShadow: '0 0 24px rgba(217,184,114,0.3)' }}>合</div>
                    <h2 style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, marginBottom: 10 }}>두 분의 궁합을 읽고 있어요</h2>
                    <p style={{ fontSize: 13, color: C.sub, transition: 'opacity 0.3s' }}>{STEPS[stepIdx]}</p>
                    <p style={{ fontSize: 11.5, color: C.muted, marginTop: 18 }}>약 1~2분 정도 걸려요 · 완성되면 이메일로도 보내드립니다</p>
                </div>
            ) : (
                <div style={{ textAlign: 'center', maxWidth: 320 }}>
                    <p style={{ fontSize: 34, marginBottom: 14 }}>⚠️</p>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>오류가 발생했습니다</h2>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, wordBreak: 'keep-all' }}>{errorMsg}</p>
                    <button onClick={() => router.push('/hap')} style={{ marginTop: 20, padding: '12px 26px', borderRadius: 12, border: `1px solid rgba(240,234,235,0.2)`, background: 'rgba(240,234,235,0.05)', color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        처음으로 돌아가기
                    </button>
                </div>
            )}
        </div>
    );
}

export default function HapPaymentSuccessPage() {
    return (
        <Suspense fallback={<div style={{ background: '#0A090C', minHeight: '100dvh' }} />}>
            <HapPaymentSuccessContent />
        </Suspense>
    );
}
