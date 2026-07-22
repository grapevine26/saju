"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TarotRoundSection, TarotFinalMessage } from "@/components/tarot/TarotResultCard";
import { getCardById } from "@/features/tarot/cards";
import CardBack from "@/components/tarot/CardBack";
import ReviewForm from "@/components/ReviewForm";
import SaveToAccountCard from "@/components/tarot/SaveToAccountCard";
import { TarotInput, TarotFreeResult, TarotFullResult } from "@/features/tarot/types";
import { TAROT_FREE_KEY, TAROT_INPUT_KEY, TAROT_ROUNDS_KEY } from "@/features/tarot/constants";

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
    hasOwner?: boolean;
}

export default function TarotResultClient({ job, hasOwner = false }: Props) {
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

    // 썸·짝사랑 재구매 브릿지 — 상황에 맞는 "다음 질문"을 프리셋으로 새 리딩 시작
    const startNewReading = (presetQuestion: string) => {
        try {
            sessionStorage.setItem(TAROT_INPUT_KEY, JSON.stringify({ ...input, question: presetQuestion }));
            sessionStorage.removeItem(TAROT_ROUNDS_KEY);
            sessionStorage.removeItem(TAROT_FREE_KEY);
        } catch {}
        router.push('/tarot/select');
    };

    const rereadBridge = input.situation === 'crush' ? {
        title: <>기류는 확인했어요.<br />이제 &lsquo;진심&rsquo;이 남았습니다</>,
        desc: <>카드는 두 사람 사이에 흐르는 <strong style={{ color: 'var(--tarot-text-1)' }}>지금의 기류</strong>를 보여드렸어요. {input.partnerName}님가 이 관계를 어디까지 생각하는지 — 새 질문으로 7장이 다시 답합니다.</>,
        chips: ['그 사람의 진심', '관계의 진도', '다가올 신호'],
        question: `${input.partnerName}님은 저와의 관계를 어디까지 생각하고 있나요?`,
        cta: '이 질문으로 새 카드 뽑기',
    } : input.situation === 'unrequited' ? {
        title: <>마음의 방향은 봤어요.<br />이제 &lsquo;고백&rsquo;이 남았습니다</>,
        desc: <>카드는 {input.partnerName}님를 향한 <strong style={{ color: 'var(--tarot-text-1)' }}>지금의 흐름</strong>을 보여드렸어요. 용기를 내면 어떤 장면이 펼쳐질지 — 새 질문으로 7장이 다시 답합니다.</>,
        chips: ['고백의 결과', '최적의 타이밍', '조심할 신호'],
        question: '지금 고백하면 어떻게 될까요?',
        cta: '이 질문으로 새 카드 뽑기',
    } : input.situation === 'dating' ? {
        title: <>지금은 확인했어요.<br />이제 &lsquo;앞으로&rsquo;가 남았습니다</>,
        desc: <>카드는 두 사람의 <strong style={{ color: 'var(--tarot-text-1)' }}>현재</strong>를 보여드렸어요. 이 관계가 어디로 흘러갈지, 언제 어떤 고비가 오는지 — 새 질문으로 7장이 다시 답합니다.</>,
        chips: ['관계의 앞날', '다가올 고비', '더 깊어지는 법'],
        question: `${input.partnerName}님과의 관계, 앞으로 어떻게 흘러갈까요?`,
        cta: '이 질문으로 새 카드 뽑기',
    } : null;

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
                            { title: `${input.partnerName}님가 끌리는 당신의 모습`, content: special.charmPoint },
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

                {/* ── 재회사주 브릿지 (헤어진 사이 한정) ──
                    타로가 답한 건 "지금 마음". 남은 질문 "언제 다시 만나?"를 사주(골든윈도우)로 연결 */}
                {input.situation === 'breakup' && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        style={{
                            marginTop: 28,
                            borderRadius: 18,
                            padding: '24px 22px',
                            background: 'linear-gradient(150deg, rgba(216,72,94,0.10) 0%, rgba(30,26,66,0.55) 55%)',
                            border: '1px solid rgba(240,106,126,0.28)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: -40, right: -30, width: 160, height: 150,
                            background: 'radial-gradient(circle, rgba(216,72,94,0.16) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#F06A7E', marginBottom: 10 }}>
                            NEXT · 다음이 궁금하다면
                        </p>
                        <p className="tarot-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--tarot-text-1)', lineHeight: 1.5, marginBottom: 10 }}>
                            마음은 확인했어요.<br />이제 &lsquo;언제&rsquo;가 남았습니다
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-2)', lineHeight: 1.75, marginBottom: 16 }}>
                            카드는 {input.partnerName}님의 <strong style={{ color: 'var(--tarot-text-1)' }}>지금 마음</strong>을 보여드렸어요.
                            그 마음이 언제 다시 열리는지 — 연락하기 가장 좋은 시기는 두 사람의 사주에 새겨져 있습니다.
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                            {['재회 가능성 진단', '골든 윈도우 (연락 최적기)', '상대 공략 매뉴얼'].map((t) => (
                                <span key={t} style={{
                                    fontSize: 11, color: 'rgba(240,106,126,0.9)',
                                    background: 'rgba(216,72,94,0.10)', border: '1px solid rgba(240,106,126,0.22)',
                                    padding: '4px 10px', borderRadius: 999,
                                }}>{t}</span>
                            ))}
                        </div>
                        <Link href="/saju" style={{
                            display: 'block', textAlign: 'center', padding: '15px 20px', borderRadius: 13,
                            background: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)',
                            color: '#FFF0F2', fontSize: 14.5, fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 6px 24px rgba(216,72,94,0.28)',
                        }}>
                            재회 가능성과 타이밍 확인하기
                        </Link>
                        <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', textAlign: 'center', marginTop: 9 }}>
                            무료 기본 분석부터 · 가입 없이 바로
                        </p>
                    </motion.div>
                )}

                {/* ── 운명의 합 브릿지 (연인·썸 한정) ──
                    타로가 답한 건 "지금 마음". 남은 질문 "우리가 얼마나 맞는 사이인가"를 궁합 리포트로 연결 */}
                {(input.situation === 'dating' || input.situation === 'crush') && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            marginTop: 28,
                            borderRadius: 18,
                            padding: '24px 22px',
                            background: 'linear-gradient(150deg, rgba(201,161,92,0.10) 0%, rgba(30,26,66,0.55) 55%)',
                            border: '1px solid rgba(201,161,92,0.28)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: -40, right: -30, width: 160, height: 150,
                            background: 'radial-gradient(circle, rgba(201,161,92,0.16) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#D9B872', marginBottom: 10 }}>
                            운명의 합 · 궁합 리포트
                        </p>
                        <p className="tarot-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--tarot-text-1)', lineHeight: 1.5, marginBottom: 10 }}>
                            마음은 확인했어요.<br />우리는 &lsquo;운명의 합&rsquo;일까요?
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-2)', lineHeight: 1.75, marginBottom: 16 }}>
                            카드는 {input.partnerName}님의 <strong style={{ color: 'var(--tarot-text-1)' }}>지금 마음</strong>을 보여드렸어요.
                            두 사람이 타고나기를 얼마나 맞는 사이인지 — 첫인상부터 결혼, 노년까지는 사주에 새겨져 있습니다.
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                            {['궁합 총점 6항목', '싸움의 원인과 화해 공식', '결혼 적기 · 최종 판정'].map((t) => (
                                <span key={t} style={{
                                    fontSize: 11, color: 'rgba(217,184,114,0.9)',
                                    background: 'rgba(201,161,92,0.10)', border: '1px solid rgba(201,161,92,0.24)',
                                    padding: '4px 10px', borderRadius: 999,
                                }}>{t}</span>
                            ))}
                        </div>
                        <Link href="/hap?utm_source=tarot&utm_medium=bridge" style={{
                            display: 'block', textAlign: 'center', padding: '15px 20px', borderRadius: 13,
                            background: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
                            color: '#241C0C', fontSize: 14.5, fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 6px 24px rgba(140,106,50,0.26)',
                        }}>
                            무료로 궁합 미리보기
                        </Link>
                        <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', textAlign: 'center', marginTop: 9 }}>
                            끌림·갈등 지수 무료 확인 · 가입 없이 바로
                        </p>
                    </motion.div>
                )}

                {/* ── 썸·짝사랑 재구매 브릿지 ──
                    다음 상품이 없는 세그먼트는 "다음 질문"을 대신 정해줘 타로 재리딩으로 연결 */}
                {rereadBridge && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        style={{
                            marginTop: 28,
                            borderRadius: 18,
                            padding: '24px 22px',
                            background: 'linear-gradient(150deg, rgba(176,123,180,0.10) 0%, rgba(27,31,74,0.50) 55%)',
                            border: '1px solid rgba(176,123,180,0.30)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: -40, right: -30, width: 160, height: 150,
                            background: 'radial-gradient(circle, rgba(176,123,180,0.16) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--tarot-accent-light)', marginBottom: 10 }}>
                            NEXT · 다음이 궁금하다면
                        </p>
                        <p className="tarot-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--tarot-text-1)', lineHeight: 1.5, marginBottom: 10 }}>
                            {rereadBridge.title}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-2)', lineHeight: 1.75, marginBottom: 16 }}>
                            {rereadBridge.desc}
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                            {rereadBridge.chips.map((t) => (
                                <span key={t} style={{
                                    fontSize: 11, color: 'var(--tarot-accent-light)',
                                    background: 'rgba(176,123,180,0.10)', border: '1px solid rgba(176,123,180,0.24)',
                                    padding: '4px 10px', borderRadius: 999,
                                }}>{t}</span>
                            ))}
                        </div>
                        {/* 대신 정해주는 다음 질문 — "뭘 또 물어보지?"를 고민하게 두면 이탈한다 */}
                        <div style={{
                            fontSize: 12.5, color: 'var(--tarot-text-1)', lineHeight: 1.6,
                            background: 'rgba(27,31,74,0.45)', border: '1px solid rgba(176,123,180,0.20)',
                            borderRadius: 11, padding: '11px 14px', marginBottom: 18,
                        }}>
                            <span style={{ color: 'var(--tarot-text-3)', marginRight: 6 }}>Q.</span>
                            &ldquo;{rereadBridge.question}&rdquo;
                        </div>
                        <button
                            onClick={() => startNewReading(rereadBridge.question)}
                            style={{
                                display: 'block', width: '100%', textAlign: 'center', padding: '15px 20px', borderRadius: 13,
                                background: 'var(--tarot-btn-bg)', border: 'none', cursor: 'pointer',
                                color: '#FFF', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit',
                                boxShadow: 'var(--tarot-btn-shadow)',
                            }}
                        >
                            {rereadBridge.cta}
                        </button>
                        <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', textAlign: 'center', marginTop: 9 }}>
                            1라운드 무료 · 카드는 매번 새로 섞여요
                        </p>
                    </motion.div>
                )}

                {/* ── 결제 후 계정 연결 유도 (결제 전 로그인 강요 대신) ── */}
                <SaveToAccountCard jobId={currentJob.id} hasOwner={hasOwner} />

                {/* ── 후기 + 20% 할인 코드 발급 ── */}
                <ReviewForm jobId={currentJob.id} service="tarot" />

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
