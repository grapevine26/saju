"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TarotRoundSection, TarotFinalMessage } from "@/components/tarot/TarotResultCard";
import { getCardById } from "@/features/tarot/cards";
import CardBack from "@/components/tarot/CardBack";
import { TarotInput, TarotFreeResult, TarotFullResult } from "@/features/tarot/types";
import { TAROT_FREE_KEY, TAROT_INPUT_KEY } from "@/features/tarot/constants";

interface Props {
    job: {
        id: string;
        status: string;
        raw_data: {
            input: TarotInput;
            rounds: [number[], number[], number[]];
            freeResult: TarotFreeResult;
        };
        ai_result: TarotFullResult | null;
        created_at: string;
    } | null;
}

export default function TarotResultClient({ job }: Props) {
    const router = useRouter();
    const [currentJob, setCurrentJob] = useState(job);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!currentJob) return;
        if (currentJob.status === 'done' || currentJob.status === 'failed') return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/tarot/status?jobId=${currentJob.id}`);
                const data = await res.json();
                if (data.status === 'done') {
                    clearInterval(pollRef.current!);
                    setCurrentJob(prev => prev ? { ...prev, status: 'done', ai_result: data.aiResult } : prev);
                } else if (data.status === 'failed') {
                    clearInterval(pollRef.current!);
                    setCurrentJob(prev => prev ? { ...prev, status: 'failed' } : prev);
                }
            } catch {}
        }, 3000);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [currentJob?.id, currentJob?.status]);

    if (!currentJob) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
                <p style={{ fontSize: 40 }}>✦</p>
                <p style={{ fontSize: 15, color: 'var(--tarot-text-2)' }}>결과를 찾을 수 없습니다.</p>
                <Link href="/tarot" style={{ fontSize: 13, color: 'var(--tarot-text-3)' }}>처음으로 →</Link>
            </div>
        );
    }

    if (currentJob.status === 'pending' || currentJob.status === 'processing') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{ fontSize: 48, color: 'var(--tarot-accent)' }}
                >
                    ✦
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--tarot-text-1)', marginBottom: 6 }}>
                        7장의 카드를 해석하는 중입니다
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tarot-text-3)' }}>잠시만 기다려 주세요...</p>
                </div>
            </div>
        );
    }

    // 핵심 필드(round2/round3)가 비어 있으면 렌더링 중 크래시 대신 오류 화면으로 안전 처리
    const ai = currentJob.ai_result;
    const aiMalformed = !ai
        || !Array.isArray(ai.round2?.cards) || ai.round2!.cards.length === 0
        || !Array.isArray(ai.round3?.cards) || ai.round3!.cards.length === 0;

    if (currentJob.status === 'failed' || aiMalformed) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 40 }}>⚠️</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tarot-text-1)' }}>해석 중 오류가 발생했습니다</p>
                <p style={{ fontSize: 13, color: 'var(--tarot-text-3)', lineHeight: 1.7 }}>
                    카카오톡 채널로 문의해 주시면 환불 처리해 드립니다.
                </p>
                <Link href="/tarot" style={{ fontSize: 13, color: 'var(--tarot-text-3)', marginTop: 8 }}>처음으로 →</Link>
            </div>
        );
    }

    const { input, rounds, freeResult } = currentJob.raw_data;
    const { round2, round3, finalMessage, directAnswer, special } = ai;

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
                        {input.myName}님의 7장 완전 해석
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--tarot-text-3)' }}>
                        {new Date(currentJob.created_at).toLocaleDateString('ko-KR')} 리딩
                    </p>
                </div>
            </header>

            <div style={{ padding: '24px 20px' }}>
                {/* 7장 카드 — 라운드별 그룹 */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tarot-text-3)', letterSpacing: '0.08em', marginBottom: 16, textAlign: 'center' }}>
                        선택한 7장의 카드 전체 해석
                    </p>

                    {[0, 1, 2].map((ri) => (
                        <motion.div
                            key={ri}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: ri * 0.1 }}
                            style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: ri < 2 ? 20 : 0 }}
                        >
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
                                        <CardBack isSelected cardName={card?.name} />
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ))}
                </motion.div>

                {/* ─── 질문에 대한 최종 답 ─── */}
                {input.question && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))',
                            border: '1px solid var(--tarot-border-strong)',
                            borderRadius: 16,
                            padding: '18px 20px',
                            marginBottom: 24,
                            boxShadow: 'var(--tarot-glow)',
                        }}
                    >
                        <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
                            ◆ 당신이 물어본 것
                        </p>
                        <p style={{ fontSize: 13.5, color: 'var(--tarot-text-1)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                            "{input.question}"
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--tarot-accent-light)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
                            ◆ 카드의 최종 답
                        </p>
                        <p style={{ fontSize: 14.5, color: 'var(--tarot-text-1)', lineHeight: 1.85, fontWeight: 500 }}>
                            {directAnswer || finalMessage}
                        </p>
                    </motion.div>
                )}

                {/* 1라운드 */}
                <TarotRoundSection roundIndex={0} result={freeResult.round1} delay={0.1} />
                {/* 2라운드 */}
                <TarotRoundSection roundIndex={1} result={round2} delay={0.2} />
                {/* 3라운드 */}
                <TarotRoundSection roundIndex={2} result={round3} delay={0.3} />

                {/* ─── 스페셜 풀이 ─── */}
                {special && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ marginBottom: 32 }}
                    >
                        {/* 챕터 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '0 4px' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(212,168,83,0.12)',
                                border: '1px solid rgba(212,168,83,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--tarot-accent-gold)' }}>★</span>
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>
                                    SPECIAL
                                </p>
                                <p className="tarot-serif" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tarot-accent-gold)' }}>
                                    두 사람을 위한 특별 풀이
                                </p>
                            </div>
                        </div>

                        {/* 궁합 온도 */}
                        <div style={{
                            background: 'var(--tarot-bg-card)',
                            border: '1px solid var(--tarot-border-strong)',
                            borderRadius: 16, padding: '20px 18px', marginBottom: 12,
                            textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>
                                두 사람의 궁합 온도
                            </p>
                            <p className="tarot-serif" style={{ fontSize: 44, fontWeight: 700, color: 'var(--tarot-accent-gold)', lineHeight: 1, marginBottom: 12 }}>
                                {special.chemistryScore}<span style={{ fontSize: 20 }}>°</span>
                            </p>
                            <div style={{
                                height: 6, borderRadius: 3, background: 'rgba(176,123,180,0.12)',
                                overflow: 'hidden', maxWidth: 260, margin: '0 auto 12px',
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, Math.min(100, special.chemistryScore))}%` }}
                                    transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                                    style={{
                                        height: '100%', borderRadius: 3,
                                        background: 'linear-gradient(90deg, #6B3FA8, #B07BB4, #D4A853)',
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--tarot-text-2)', margin: 0 }}>
                                {special.chemistryComment}
                            </p>
                        </div>

                        {/* 토픽 카드들 */}
                        {[
                            { title: `${input.partnerName}씨가 끌리는 당신의 모습`, content: special.charmPoint },
                            { title: '다가가는 법', content: special.approachTip },
                            { title: '앞으로 한 달, 조심할 것', content: special.monthAhead },
                        ].map((topic, i) => (
                            <div key={i} style={{
                                background: 'var(--tarot-bg-card)',
                                border: '1px solid var(--tarot-border)',
                                borderRadius: 16, padding: '16px 18px', marginBottom: 12,
                            }}>
                                <p className="tarot-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--tarot-accent-light)', marginBottom: 10 }}>
                                    ✦ {topic.title}
                                </p>
                                <p style={{
                                    fontSize: 13, color: 'rgba(237,232,248,0.88)', lineHeight: 1.85,
                                    whiteSpace: 'pre-wrap', margin: 0,
                                }}>
                                    {topic.content}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* 최종 메시지 */}
                <TarotFinalMessage message={finalMessage} delay={0.5} />

                {/* 하단 CTA */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ textAlign: 'center', paddingTop: 8 }}>
                    <Link href="/tarot"
                        style={{
                            display: 'inline-block', padding: '13px 28px', borderRadius: 14,
                            border: '1px solid var(--tarot-border)', background: 'var(--tarot-bg-card)',
                            color: 'var(--tarot-text-2)', fontSize: 13, fontWeight: 600,
                        }}>
                        새로운 리딩 시작하기
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
