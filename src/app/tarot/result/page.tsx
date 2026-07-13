"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { TarotInput, TarotFreeResult } from "@/features/tarot/types";
import { getCardById } from "@/features/tarot/cards";
import { TarotRoundSection } from "@/components/tarot/TarotResultCard";
import CardBack from "@/components/tarot/CardBack";
import {
    TAROT_INPUT_KEY,
    TAROT_ROUNDS_KEY,
    TAROT_FREE_KEY,
    TAROT_PENDING_KEY,
    TAROT_PRICE,
} from "@/features/tarot/constants";
import { checkFreePass, makeFreePassKey } from "@/utils/freePassClient";

export default function TarotResultPage() {
    const router = useRouter();
    const [input, setInput] = useState<TarotInput | null>(null);
    const [rounds, setRounds] = useState<[number[], number[], number[]] | null>(null);
    const [freeResult, setFreeResult] = useState<TarotFreeResult | null>(null);
    const [payingEmail, setPayingEmail] = useState('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paying, setPaying] = useState(false);
    const hasInit = useRef(false);

    useEffect(() => {
        if (hasInit.current) return;
        hasInit.current = true;
        try {
            const inp = sessionStorage.getItem(TAROT_INPUT_KEY);
            const rds = sessionStorage.getItem(TAROT_ROUNDS_KEY);
            const free = sessionStorage.getItem(TAROT_FREE_KEY);
            if (!inp || !rds || !free) { router.replace('/tarot'); return; }
            setInput(JSON.parse(inp));
            setRounds(JSON.parse(rds));
            setFreeResult(JSON.parse(free));
        } catch { router.replace('/tarot'); }
    }, [router]);

    const handlePay = async () => {
        if (!input || !rounds || !freeResult) return;
        if (!payingEmail || !payingEmail.includes('@')) return;
        setPaying(true);

        try {
            const orderId = `tarot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

            const pendingData = { input, rounds, freeResult, orderId, customerEmail: payingEmail };
            try { sessionStorage.setItem(TAROT_PENDING_KEY, JSON.stringify(pendingData)); } catch {}

            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) {
                window.location.href = `/tarot/payment/success?paymentKey=dev_key_${Date.now()}&orderId=${orderId}&amount=${TAROT_PRICE}`;
                return;
            }

            // 관리자 프리패스 — 결제창 없이 바로 성공 플로우 (서버가 세션으로 재검증)
            if (await checkFreePass()) {
                window.location.href = `/tarot/payment/success?paymentKey=${makeFreePassKey()}&orderId=${orderId}&amount=${TAROT_PRICE}`;
                return;
            }

            const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
            const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '');
            const payment = toss.payment({ customerKey: ANONYMOUS });
            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: TAROT_PRICE },
                orderId,
                orderName: `타로 전체 해석 — ${input.partnerName}씨에 대한 7장`,
                successUrl: `${window.location.origin}/tarot/payment/success`,
                failUrl: `${window.location.origin}/tarot/payment/fail`,
            });
        } catch (e: any) {
            if (e?.code !== 'USER_CANCEL') console.error('[tarot pay] error:', e);
            setPaying(false);
        }
    };

    if (!input || !rounds || !freeResult) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--tarot-border)', borderTopColor: 'var(--tarot-accent)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const allCards = rounds.flat();

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
            {/* 헤더 */}
            <header style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12,
                borderBottom: '1px solid var(--tarot-border)',
                position: 'sticky', top: 0, background: 'var(--tarot-bg)', zIndex: 10,
            }}>
                <Link href="/tarot" style={{ color: 'var(--tarot-text-3)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tarot-text-1)' }}>
                        {input.myName}님의 타로 리딩
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--tarot-text-3)' }}>
                        {input.partnerName}씨에 대한 7장
                    </p>
                </div>
            </header>

            <div style={{ padding: '24px 20px' }}>
                {/* 7장 카드 — 라운드별 그룹 */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tarot-text-3)', letterSpacing: '0.08em', marginBottom: 16, textAlign: 'center' }}>
                        선택한 7장의 카드
                    </p>

                    {[
                        { locked: false },
                        { locked: true },
                        { locked: true },
                    ].map(({ locked }, ri) => (
                        <motion.div
                            key={ri}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: ri * 0.1 }}
                            style={{ marginBottom: ri < 2 ? 20 : 0 }}
                        >
                            {/* 카드들 — 중앙 정렬 */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                {rounds[ri].map((id, ci) => {
                                    const card = getCardById(id);
                                    return (
                                        <motion.div
                                            key={`${ri}-${ci}`}
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: ri * 0.1 + ci * 0.06 }}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                                        >
                                            <div style={{ position: 'relative', opacity: locked ? 0.38 : 1 }}>
                                                <CardBack isSelected={!locked} cardName={card?.name} />
                                                {locked && (
                                                    <div style={{
                                                        position: 'absolute', inset: 0, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        borderRadius: 7,
                                                    }}>
                                                        <Lock size={13} color="var(--tarot-text-3)" />
                                                    </div>
                                                )}
                                            </div>
                                            {locked && (
                                                <span style={{ fontSize: 8.5, color: 'var(--tarot-text-3)', fontWeight: 500 }}>
                                                    {card?.name}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ─── 1라운드 무료 해석 ─── */}
                <TarotRoundSection roundIndex={0} result={freeResult.round1} delay={0.2} />

                {/* ─── 질문에 대한 첫 답 (유료 CTA로 이어지는 다리 역할) ─── */}
                {input.question && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            background: 'var(--tarot-bg-card)',
                            border: '1px solid var(--tarot-border-strong)',
                            borderRadius: 16,
                            padding: '18px 20px',
                            marginBottom: 20,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
                            ◆ 당신이 물어본 것
                        </p>
                        <p style={{ fontSize: 13.5, color: 'var(--tarot-text-1)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                            "{input.question}"
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--tarot-accent-light)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
                            ◆ 카드의 첫 답
                        </p>
                        <p style={{ fontSize: 14, color: 'var(--tarot-text-1)', lineHeight: 1.8, fontWeight: 500, marginBottom: 4 }}>
                            {freeResult.directAnswer || '카드가 아직 실마리를 정리하는 중이에요. 아래 해석에서 이어서 확인해 보세요.'}
                        </p>

                        {/* 아직 끝이 아니라는 걸 보여주는 페이드 + 힌트 */}
                        <div style={{
                            position: 'relative', marginTop: 14, paddingTop: 14,
                            borderTop: '1px dashed var(--tarot-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            <motion.div animate={{ y: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                                <ChevronDown size={14} color="var(--tarot-accent-light)" />
                            </motion.div>
                            <p style={{ fontSize: 12, color: 'var(--tarot-accent-light)', fontWeight: 600, margin: 0 }}>
                                더 확실한 답은 아래에서 이어집니다
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ─── 유료 잠금 섹션 ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        background: 'linear-gradient(135deg, var(--tarot-bg-card-hover) 0%, var(--tarot-bg-card) 100%)',
                        border: '1.5px solid var(--tarot-border-strong)',
                        boxShadow: 'var(--tarot-glow)',
                        borderRadius: 16,
                        padding: '24px 20px',
                        marginTop: 0,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* 배경 별 */}
                    <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 40, opacity: 0.07, pointerEvents: 'none' }}>✦</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(124,58,237,0.15)', border: '1px solid var(--tarot-border-strong)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Lock size={16} color="var(--tarot-accent)" />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tarot-text-1)' }}>
                                2라운드 + 3라운드 + 스페셜 풀이
                            </p>
                            <p style={{ fontSize: 11.5, color: 'var(--tarot-text-3)' }}>
                                {input.partnerName}씨의 현재 마음 · 앞날 · 궁합 온도까지
                            </p>
                        </div>
                    </div>

                    {/* 블러 미리보기 */}
                    <div style={{
                        background: 'var(--tarot-bg-card)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        marginBottom: 16,
                        filter: 'blur(4px)',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        opacity: 0.6,
                    }}>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-2)', lineHeight: 1.7 }}>
                            지금 이 순간 {input.partnerName}씨의 마음속에는... 선택의 기로에 서 있는
                            감정이 감지됩니다. 세 번째 카드가 말하는 것은...
                        </p>
                    </div>

                    {/* 결제 폼 */}
                    <AnimatePresence mode="wait">
                        {!showPaymentForm ? (
                            <motion.button
                                key="cta"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowPaymentForm(true)}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                                    background: 'var(--tarot-btn-bg)', color: '#fff',
                                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: 'var(--tarot-btn-shadow)',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {input.partnerName}씨의 지금 마음 열어보기 · {TAROT_PRICE.toLocaleString()}원
                            </motion.button>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                            >
                                <input
                                    type="email"
                                    value={payingEmail}
                                    onChange={e => setPayingEmail(e.target.value)}
                                    placeholder="이메일 주소 입력"
                                    style={{
                                        width: '100%', padding: '14px 16px', borderRadius: 12,
                                        border: '1px solid var(--tarot-border-strong)',
                                        background: 'var(--tarot-bg-card)', color: 'var(--tarot-text-1)',
                                        fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                    }}
                                />
                                <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', margin: '-4px 2px 0', lineHeight: 1.5 }}>
                                    결과를 언제든 다시 볼 수 있는 링크를 이메일로 보내드려요.
                                </p>
                                <button
                                    onClick={handlePay}
                                    disabled={paying || !payingEmail.includes('@')}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                                        background: paying || !payingEmail.includes('@')
                                            ? 'rgba(124,58,237,0.25)'
                                            : 'var(--tarot-btn-bg)',
                                        color: paying || !payingEmail.includes('@') ? 'var(--tarot-text-3)' : '#fff',
                                        fontSize: 15, fontWeight: 700,
                                        cursor: paying || !payingEmail.includes('@') ? 'default' : 'pointer',
                                        boxShadow: 'var(--tarot-btn-shadow)', fontFamily: 'inherit',
                                    }}
                                >
                                    {paying ? '결제 진행 중...' : `카드로 결제 · ${TAROT_PRICE.toLocaleString()}원`}
                                </button>
                                <p style={{ fontSize: 10.5, color: 'var(--tarot-text-3)', textAlign: 'center', lineHeight: 1.6 }}>
                                    결제 즉시 전체 해석이 공개됩니다 · 오류 시 자동 환불
                                    <br />
                                    <Link href="/legal/refund" style={{ color: 'var(--tarot-text-3)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                                        환불정책 보기
                                    </Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
