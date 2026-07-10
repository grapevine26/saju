"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CardBack from "@/components/tarot/CardBack";
import { TAROT_PENDING_KEY, TAROT_JOB_ID_KEY, TAROT_HISTORY_KEY } from "@/features/tarot/constants";
import { createClient } from "@/utils/supabase/client";

/* 타이머로 순환하는 리딩 단계 문구 — 마지막 문구에서 멈춤 */
const LOADING_STEPS = [
    "일곱 장의 카드를 펼치고 있습니다",
    "카드 배열에 담긴 흐름을 읽는 중입니다",
    "그 사람의 마음을 들여다보는 중입니다",
    "앞날의 흐름을 해석하는 중입니다",
    "일곱 장의 이야기를 하나로 엮는 중입니다",
    "마지막 메시지를 정리하고 있습니다",
];

/* 배경 별 [x%, y%, r, isGold] */
const STARS: [number, number, number, boolean][] = [
    [8, 12, 1.5, true], [88, 8, 1, false], [24, 22, 2, false], [70, 15, 1.5, true],
    [14, 45, 1, false], [86, 38, 1.5, true], [48, 8, 1, false], [6, 68, 1.5, false],
    [94, 60, 1.5, true], [38, 88, 1, false], [76, 82, 1.5, false], [20, 78, 1, true],
    [60, 92, 1.5, false], [96, 28, 1, false], [4, 30, 1, true], [54, 75, 1, true],
];

function TarotPaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amountStr = searchParams.get("amount");
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [cardIds, setCardIds] = useState<number[]>([]);
    const [stepIdx, setStepIdx] = useState(0);
    const hasStarted = useRef(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* 단계 문구 순환 (4초 간격, 마지막에서 정지) */
    useEffect(() => {
        if (status !== 'loading') return;
        const t = setInterval(() => {
            setStepIdx(s => Math.min(s + 1, LOADING_STEPS.length - 1));
        }, 4000);
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
                const pendingRaw = sessionStorage.getItem(TAROT_PENDING_KEY);
                if (!pendingRaw) {
                    // 분석 시작 후 새로고침한 경우 — 이미 생성된 작업으로 복구
                    const savedJobId = localStorage.getItem(TAROT_JOB_ID_KEY);
                    if (savedJobId) {
                        router.replace(`/tarot/result/${savedJobId}`);
                        return;
                    }
                    throw new Error('결제 정보 세션을 찾을 수 없습니다. 결제가 완료되었다면 이메일로 결과 링크가 발송됩니다.');
                }
                const pending = JSON.parse(pendingRaw);
                if (pending.orderId !== orderId) throw new Error('주문 번호가 일치하지 않습니다.');

                // 유저가 뽑은 실제 카드 7장으로 로딩 연출
                try { setCardIds((pending.rounds as number[][]).flat()); } catch {}

                const isDev = process.env.NODE_ENV === 'development';

                if (!isDev) {
                    const confirmRes = await fetch('/api/tosspayments/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentKey, orderId, amount: Number(amountStr) }),
                    });
                    const confirmData = await confirmRes.json();
                    if (!confirmRes.ok || !confirmData.success) {
                        // 새로고침 등으로 이미 승인된 결제는 그대로 진행 (start가 paymentKey 기준 멱등 처리)
                        if (confirmData.code !== 'ALREADY_PROCESSED_PAYMENT') {
                            throw new Error(confirmData.message || '결제 승인 실패');
                        }
                    }
                }

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                const startRes = await fetch('/api/tarot/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: pending.input,
                        rounds: pending.rounds,
                        freeResult: pending.freeResult,
                        paymentKey: isDev ? null : paymentKey,
                        customerEmail: pending.customerEmail,
                        userId: user?.id || null,
                    }),
                });
                const startData = await startRes.json();
                if (!startData.success) throw new Error(startData.error || '분석 시작 실패');

                try {
                    sessionStorage.removeItem(TAROT_PENDING_KEY);
                    // 탭을 닫아도 결과에 다시 접근할 수 있도록 localStorage에 보관
                    localStorage.setItem(TAROT_JOB_ID_KEY, startData.jobId);

                    // 리딩 히스토리에 추가 (최대 50개)
                    const historyRaw = localStorage.getItem(TAROT_HISTORY_KEY);
                    const history = historyRaw ? JSON.parse(historyRaw) : [];
                    history.unshift({
                        jobId: startData.jobId,
                        myName: pending.input?.myName || '',
                        partnerName: pending.input?.partnerName || '',
                        question: pending.input?.question || '',
                        createdAt: Date.now(),
                    });
                    localStorage.setItem(TAROT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
                } catch {}

                // 완료될 때까지 같은 화면에서 대기 — 결과 페이지에는 완료된 후에만 이동
                pollRef.current = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/tarot/status?jobId=${startData.jobId}`);
                        const data = await res.json();
                        if (data.status === 'done') {
                            clearInterval(pollRef.current!);
                            router.replace(`/tarot/result/${startData.jobId}`);
                        } else if (data.status === 'failed') {
                            clearInterval(pollRef.current!);
                            setErrorMsg('해석 중 오류가 발생했습니다.');
                            setStatus('error');
                        }
                    } catch {}
                }, 3000);

            } catch (err: any) {
                console.error('[tarot payment success]', err);
                setErrorMsg(err.message || '오류가 발생했습니다.');
                setStatus('error');
            }
        };

        run();

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [paymentKey, orderId, amountStr, router]);

    const mid = (cardIds.length - 1) / 2;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, gap: 20, position: 'relative', overflow: 'hidden',
        }}>
            {/* ── 배경: 별 + 보라 글로우 ── */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {STARS.map(([x, y, r, isGold], i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.15, 0.55, 0.15] }}
                        transition={{ duration: 2.6 + (i % 4) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.5 }}
                        style={{
                            position: 'absolute', left: `${x}%`, top: `${y}%`,
                            width: r, height: r, borderRadius: '50%',
                            background: isGold ? '#D4A853' : '#B07BB4',
                            boxShadow: i % 3 === 0 ? `0 0 ${r * 4}px ${isGold ? 'rgba(212,168,83,0.5)' : 'rgba(176,123,180,0.4)'}` : 'none',
                        }}
                    />
                ))}
                <div style={{
                    position: 'absolute', top: '18%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 480, height: 480, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(61,44,109,0.34) 0%, rgba(61,44,109,0.1) 55%, transparent 75%)',
                    filter: 'blur(20px)',
                }} />
            </div>

            {status === 'loading' && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        textAlign: 'center', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 26, position: 'relative', zIndex: 1,
                    }}
                >
                    {/* ── 유저가 뽑은 7장 카드 부채꼴 ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                        height: 140, paddingTop: 16,
                    }}>
                        {cardIds.map((id, i) => {
                            const off = i - mid;
                            return (
                                <motion.div
                                    key={`${id}-${i}`}
                                    initial={{ opacity: 0, y: 24, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: i * 0.09, type: 'spring', stiffness: 200, damping: 20 }}
                                    style={{
                                        transform: `rotate(${off * 8}deg) translateY(${Math.abs(off) * Math.abs(off) * 3}px)`,
                                        transformOrigin: 'bottom center',
                                        marginLeft: i === 0 ? 0 : -14,
                                        position: 'relative',
                                    }}
                                >
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 3 + (i % 3) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                                        style={{ position: 'relative' }}
                                    >
                                        {/* 카드별 순차 글로우 — 빛이 카드들을 훑고 지나가는 연출 */}
                                        <motion.div
                                            animate={{ opacity: [0.1, 0.85, 0.1] }}
                                            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                                            style={{
                                                position: 'absolute', inset: -9, borderRadius: 12,
                                                background: 'radial-gradient(circle, rgba(176,123,180,0.55) 0%, transparent 70%)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        <CardBack isSelected size="sm" />
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── 제목 + 순환 단계 문구 ── */}
                    <div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--tarot-text-1)', marginBottom: 10 }}>
                            일곱 장의 카드를 읽고 있습니다
                        </p>
                        <div style={{ height: 24 }}>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={stepIdx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.35 }}
                                    style={{ fontSize: 13.5, color: 'var(--tarot-accent-light)', margin: 0 }}
                                >
                                    ✦ {LOADING_STEPS[stepIdx]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── 안내 카드 ── */}
                    <div style={{
                        background: 'var(--tarot-bg-card)', border: '1px solid var(--tarot-border)',
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: 14, padding: '14px 18px', maxWidth: 320, width: '100%',
                    }}>
                        <p style={{ fontSize: 12, color: 'var(--tarot-text-2)', lineHeight: 1.7, textAlign: 'center', margin: 0 }}>
                            이 화면을 닫아도 괜찮습니다.<br />
                            분석이 완료되면 이메일로 결과 링크를 보내드립니다.
                        </p>
                    </div>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 320, position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--tarot-text-1)', marginBottom: 8 }}>오류가 발생했습니다</p>
                    <p style={{ fontSize: 13, color: 'var(--tarot-text-3)', marginBottom: 20, lineHeight: 1.7 }}>{errorMsg}</p>
                    <button
                        onClick={() => router.push('/tarot')}
                        style={{
                            padding: '13px 24px', borderRadius: 12, border: '1px solid var(--tarot-border)',
                            background: 'var(--tarot-bg-card)', color: 'var(--tarot-text-2)',
                            fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        처음으로 돌아가기
                    </button>
                </motion.div>
            )}
        </div>
    );
}

export default function TarotPaymentSuccessPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--tarot-bg)' }} />}>
            <TarotPaymentSuccessContent />
        </Suspense>
    );
}
