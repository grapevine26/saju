"use client";

import { motion } from "framer-motion";
import { TarotCardReading, TarotRoundResult } from "@/features/tarot/types";
import { getCardById } from "@/features/tarot/cards";
import CardBack from "./CardBack";

interface TarotRoundSectionProps {
    roundIndex: number;
    result: TarotRoundResult;
    delay?: number;
}

export function TarotRoundSection({ roundIndex, result, delay = 0 }: TarotRoundSectionProps) {
    const roundLabels = ["과거 — 두 사람의 연결 고리", "현재 — 지금 그 사람의 마음", "미래 — 앞으로의 흐름"];
    const roundColors = ["rgba(139,92,246,0.8)", "rgba(167,139,250,0.9)", "rgba(196,181,253,1)"];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            style={{ marginBottom: 20 }}
        >
            {/* 라운드 헤더 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
                padding: '0 4px',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--tarot-accent-dim)',
                    border: '1px solid var(--tarot-border-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: roundColors[roundIndex] }}>
                        {roundIndex + 1}
                    </span>
                </div>
                <div>
                    <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>
                        {roundIndex + 1}라운드
                    </p>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: roundColors[roundIndex] }}>
                        {roundLabels[roundIndex]}
                    </p>
                </div>
            </div>

            {/* 테마 */}
            <div style={{
                background: 'var(--tarot-bg-card)',
                border: '1px solid var(--tarot-border)',
                borderRadius: 14,
                padding: '14px 18px',
                marginBottom: 14,
            }}>
                <p className="tarot-serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--tarot-text-1)', textAlign: 'center' }}>
                    ✦ {result.theme} ✦
                </p>
            </div>

            {/* 카드별 해석 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.cards.map((c, i) => (
                    <TarotCardItem key={i} reading={c} delay={delay + i * 0.1} />
                ))}
            </div>

            {/* 종합 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 }}
                style={{
                    marginTop: 16,
                    background: 'var(--tarot-bg-card)',
                    border: '1px solid var(--tarot-border-strong)',
                    borderRadius: 16,
                    padding: '16px 18px',
                }}
            >
                <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8 }}>
                    ◆ 종합 메시지
                </p>
                <p style={{
                    fontSize: 13.5,
                    color: 'rgba(237,232,248,0.9)',
                    lineHeight: 1.85,
                    fontWeight: 500,
                    whiteSpace: 'pre-wrap',
                }}>
                    {result.synthesis}
                </p>
            </motion.div>
        </motion.div>
    );
}

interface TarotCardItemProps {
    reading: TarotCardReading;
    delay?: number;
}

function TarotCardItem({ reading, delay = 0 }: TarotCardItemProps) {
    const card = getCardById(reading.cardId);

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.4 }}
            style={{
                background: 'var(--tarot-bg-card)',
                border: '1px solid var(--tarot-border)',
                borderRadius: 16,
                padding: '16px',
                display: 'flex',
                gap: 14,
            }}
        >
            {/* 카드 미니 */}
            <div style={{ flexShrink: 0 }}>
                <CardBack isSelected size="sm" cardName={card?.name} />
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, color: 'var(--tarot-accent-light)' }}>
                        {card?.symbol}
                    </span>
                    <span className="tarot-serif" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tarot-text-1)' }}>
                        {reading.cardName}
                    </span>
                </div>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid var(--tarot-border)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    marginBottom: 10,
                }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tarot-accent-light)', letterSpacing: '0.03em' }}>
                        {reading.keyPhrase}
                    </span>
                </div>
                <p style={{
                    fontSize: 13,
                    color: 'rgba(237,232,248,0.88)',
                    lineHeight: 1.85,
                    fontWeight: 450,
                    whiteSpace: 'pre-wrap',
                }}>
                    {reading.interpretation}
                </p>
            </div>
        </motion.div>
    );
}

interface TarotFinalMessageProps {
    message: string;
    delay?: number;
}

export function TarotFinalMessage({ message, delay = 0 }: TarotFinalMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6 }}
            style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))',
                border: '1px solid var(--tarot-border-strong)',
                borderRadius: 20,
                padding: '24px 20px',
                marginBottom: 24,
                boxShadow: 'var(--tarot-glow)',
            }}
        >
            <p className="tarot-serif" style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--tarot-accent)',
                letterSpacing: '0.08em',
                textAlign: 'center',
                marginBottom: 14,
            }}>
                ✦ 7장의 카드가 전하는 최종 메시지 ✦
            </p>
            <p style={{
                fontSize: 14.5,
                color: 'var(--tarot-text-1)',
                lineHeight: 1.9,
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
            }}>
                {message}
            </p>
        </motion.div>
    );
}
