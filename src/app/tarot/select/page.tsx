"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CardDeck from "@/components/tarot/CardDeck";
import SelectedStrip from "@/components/tarot/SelectedStrip";
import { TarotInput } from "@/features/tarot/types";
import { getRandomCards, getCardById } from "@/features/tarot/cards";
import { trackFunnelEvent } from "@/utils/utm";
import {
    TAROT_INPUT_KEY,
    TAROT_ROUNDS_KEY,
    TAROT_FREE_KEY,
    PICKS_PER_ROUND,
    TAROT_TOTAL_ROUNDS,
    ROUND_THEMES,
} from "@/features/tarot/constants";

/* 화면 높이가 넉넉할수록 카드를 키워서 남는 여백을 콘텐츠로 채움 */
function calcDeckScale(height: number): number {
    if (height <= 800) return 1;
    if (height <= 860) return 1.06;
    if (height <= 910) return 1.11;
    if (height <= 960) return 1.16;
    return 1.2;
}

export default function TarotSelectPage() {
    const router = useRouter();
    const [input, setInput] = useState<TarotInput | null>(null);
    const [round, setRound] = useState(0);
    const [rounds, setRounds] = useState<number[][]>([[], [], []]);
    const [displayCards, setDisplayCards] = useState<number[]>([]);
    const [deckKey, setDeckKey] = useState(0);
    const [phase, setPhase] = useState<'selecting' | 'transitioning' | 'loading' | 'limit_exceeded'>('selecting');
    const [loadingText, setLoadingText] = useState('');
    const [deckScale, setDeckScale] = useState(1);
    const hasInit = useRef(false);
    const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const updateScale = () => setDeckScale(calcDeckScale(window.innerHeight));
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    useEffect(() => {
        if (hasInit.current) return;
        hasInit.current = true;
        try {
            const raw = sessionStorage.getItem(TAROT_INPUT_KEY);
            if (!raw) { router.replace('/tarot'); return; }
            setInput(JSON.parse(raw));
        } catch { router.replace('/tarot'); return; }
        setDisplayCards(getRandomCards(12));
    }, [router]);

    const currentSelected = rounds[round] ?? [];

    const handleSelect = (cardId: number) => {
        if (phase !== 'selecting') return;
        if (currentSelected.includes(cardId)) return;
        if (currentSelected.length >= PICKS_PER_ROUND[round]) return;

        const newSelected = [...currentSelected, cardId];
        const newRounds = rounds.map((r, i) => i === round ? newSelected : r);
        setRounds(newRounds);

        if (newSelected.length === PICKS_PER_ROUND[round]) {
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
            advanceTimer.current = setTimeout(() => advanceRound(newRounds), 900);
        }
    };

    const advanceRound = async (finalRounds: number[][]) => {
        const nextRound = round + 1;

        if (nextRound >= TAROT_TOTAL_ROUNDS) {
            setPhase('loading');
            setLoadingText('카드에 담긴 기운을 읽고 있습니다...');
            await callFreeReading(input!, finalRounds as [number[], number[], number[]]);
            return;
        }

        setPhase('transitioning');
        await new Promise(r => setTimeout(r, 400));
        setRound(nextRound);
        setDisplayCards(getRandomCards(12, finalRounds.flat()));
        setDeckKey(k => k + 1);
        await new Promise(r => setTimeout(r, 80));
        setPhase('selecting');
    };

    const callFreeReading = async (inp: TarotInput, finalRounds: [number[], number[], number[]]) => {
        try {
            trackFunnelEvent('free', 'tarot');
            const res = await fetch('/api/tarot/free-reading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: inp, round1CardIds: finalRounds[0] }),
            });

            if (res.status === 429) {
                setPhase('limit_exceeded');
                return;
            }

            const json = await res.json();
            if (!json.success) throw new Error(json.error || '해석 중 오류가 발생했습니다.');

            try {
                sessionStorage.setItem(TAROT_ROUNDS_KEY, JSON.stringify(finalRounds));
                sessionStorage.setItem(TAROT_FREE_KEY, JSON.stringify(json.result));
            } catch {}

            router.push('/tarot/result');
        } catch (err: any) {
            setLoadingText('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setTimeout(() => router.replace('/tarot'), 2500);
        }
    };

    const theme = ROUND_THEMES[round];

    if (!input) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--tarot-border-strong)', borderTopColor: 'var(--tarot-accent)', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (phase === 'limit_exceeded') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, textAlign: 'center' }}>
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(157,123,255,0.1)',
                        border: '1.5px solid rgba(157,123,255,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32,
                    }}>☽</div>

                    <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--tarot-text-1)', marginBottom: 8, lineHeight: 1.4 }}>
                            오늘의 무료 리딩을<br />모두 사용하셨어요
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-3)', lineHeight: 1.75 }}>
                            하루 3회 무료 리딩이 제공됩니다.<br />
                            내일 자정이 지나면 다시 이용하실 수 있어요.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(13,8,32,0.45)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(157,123,255,0.22)',
                        borderRadius: 16, padding: '16px 20px', width: '100%', maxWidth: 320,
                    }}>
                        <p style={{ fontSize: 12.5, color: 'var(--tarot-text-2)', lineHeight: 1.75, margin: 0 }}>
                            카드는 하루에 세 번까지만<br />
                            같은 사람의 마음을 들여다봅니다.<br />
                            내일, 새로운 기운으로 다시 만나요.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
                        <button
                            onClick={() => router.push('/tarot/history')}
                            style={{
                                width: '100%', padding: '15px', borderRadius: 14,
                                border: '1px solid rgba(157,123,255,0.3)',
                                background: 'rgba(59,29,122,0.3)', color: 'var(--tarot-accent-light)',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            ✦ 지난 리딩 기록 보기
                        </button>
                        <button
                            onClick={() => router.push('/tarot')}
                            style={{
                                width: '100%', padding: '13px', borderRadius: 12,
                                border: '1px solid rgba(157,123,255,0.2)',
                                background: 'transparent', color: 'var(--tarot-text-3)',
                                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            처음으로 돌아가기
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === 'loading') {
        const roundColors = [
            { border: 'rgba(183,157,255,0.9)',  glow: 'rgba(183,157,255,0.4)',  label: '과거' },
            { border: 'rgba(157,123,255,0.9)', glow: 'rgba(157,123,255,0.4)', label: '현재' },
            { border: 'rgba(239,233,255,0.95)', glow: 'rgba(239,233,255,0.35)', label: '미래' },
        ];

        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}>
                {/* 은은하게 맥동하는 글로우 뱃지 */}
                <div style={{ position: 'relative', width: 76, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(157,123,255,0.4) 0%, transparent 72%)',
                            filter: 'blur(6px)',
                        }}
                    />
                    <div style={{
                        position: 'relative', width: 60, height: 60, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(76,29,149,0.35), rgba(59,29,122,0.5))',
                        border: '1.5px solid var(--tarot-border-strong)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--tarot-glow)',
                    }}>
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            style={{ fontSize: 26, color: 'var(--tarot-accent-light)', display: 'block' }}
                        >
                            ✦
                        </motion.span>
                    </div>
                </div>

                <p style={{ fontSize: 15, color: 'var(--tarot-text-2)', textAlign: 'center', lineHeight: 1.7 }}>
                    {loadingText}
                </p>

                {/* 선택된 7장 요약 — 라운드별 색상 구분 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                    {rounds.map((roundCards, ri) => roundCards.length > 0 && (
                        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: roundColors[ri].border,
                                letterSpacing: '0.06em', flexShrink: 0,
                            }}>
                                {roundColors[ri].label}
                            </span>
                            {roundCards.map((id, i) => (
                                <motion.span
                                    key={id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (ri * 3 + i) * 0.06 }}
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: 20,
                                        background: 'var(--tarot-bg-card)',
                                        border: `1px solid ${roundColors[ri].border}`,
                                        boxShadow: `0 0 8px ${roundColors[ri].glow}`,
                                        fontSize: 11,
                                        color: 'var(--tarot-text-1)',
                                    }}
                                >
                                    {getCardById(id)?.name}
                                </motion.span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 상단 고정 영역 */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'var(--tarot-bg)',
                borderBottom: '1px solid var(--tarot-border)',
                padding: '8px 20px',
            }}>
                {/* 라운드 점 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                    {Array.from({ length: TAROT_TOTAL_ROUNDS }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                width: i === round ? 24 : 6,
                                background: i < round ? 'var(--tarot-accent)' : i === round ? 'var(--tarot-accent-light)' : 'var(--tarot-border)',
                            }}
                            transition={{ duration: 0.3 }}
                            style={{ height: 6, borderRadius: 3 }}
                        />
                    ))}
                </div>

                {/* 선택된 카드 슬롯 */}
                <SelectedStrip selectedIds={currentSelected} maxPicks={PICKS_PER_ROUND[round]} />
            </div>

            {/* 남는 세로 공간을 여러 지점에 고르게 분산 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {/* 라운드 헤더 + 안내 — 한 그룹으로 묶어 간격이 따로 벌어지지 않게 */}
                <div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={round}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            style={{ padding: '16px 20px 10px', textAlign: 'center' }}
                        >
                            <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>
                                {theme.title}
                            </p>
                            <h2 className="tarot-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--tarot-text-2)', marginBottom: 0 }}>
                                {theme.subtitle}
                            </h2>
                        </motion.div>
                    </AnimatePresence>

                    {/* 안내 */}
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--tarot-text-3)', marginBottom: 18 }}>
                        <span style={{ color: 'var(--tarot-accent-light)', fontWeight: 700 }}>
                            {currentSelected.length}/{PICKS_PER_ROUND[round]}
                        </span>
                        &nbsp;마음이 끌리는 카드를 고르세요
                    </p>
                </div>

                {/* 카드 덱 */}
                <div style={{ padding: '0 16px 14px' }}>
                    <CardDeck
                        cardIds={displayCards}
                        selectedIds={currentSelected}
                        onSelect={handleSelect}
                        maxPicks={PICKS_PER_ROUND[round]}
                        deckKey={deckKey}
                        round={round}
                        scale={deckScale}
                    />
                </div>
            </div>
        </div>
    );
}
