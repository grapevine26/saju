"use client";

import { motion, AnimatePresence } from "framer-motion";
import CardBack from "./CardBack";
import { getCardById } from "@/features/tarot/cards";

interface CardDeckProps {
    cardIds: number[];
    selectedIds: number[];
    onSelect: (id: number) => void;
    maxPicks: number;
    deckKey: number;
    round: number;
    /** 화면 높이에 따라 카드·간격을 키우는 배율 (기본 1) */
    scale?: number;
}

/* 라운드별 선택 링 색상 — 과거(골드) · 현재(라벤더) · 미래(블러시) */
const ROUND_RING = [
    { border: 'rgba(212,168,83,0.9)',  glow: '0 0 12px rgba(212,168,83,0.55), 0 0 22px rgba(212,168,83,0.22)',  idle: 'rgba(212,168,83,0.22)' },
    { border: 'rgba(176,123,180,0.9)', glow: '0 0 12px rgba(176,123,180,0.55), 0 0 22px rgba(168,85,247,0.25)', idle: 'rgba(176,123,180,0.22)' },
    { border: 'rgba(246,214,232,0.95)', glow: '0 0 12px rgba(246,214,232,0.55), 0 0 22px rgba(176,123,180,0.3)', idle: 'rgba(246,214,232,0.2)' },
];

export default function CardDeck({ cardIds, selectedIds, onSelect, maxPicks, deckKey, round, scale = 1 }: CardDeckProps) {
    const isFull = selectedIds.length >= maxPicks;
    const ring = ROUND_RING[round] ?? ROUND_RING[0];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={deckKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: `${8 * scale}px`,
                    padding: '0 4px',
                }}
            >
                {cardIds.map((id, idx) => {
                    const card = getCardById(id);
                    const isSelected = selectedIds.includes(id);
                    const isDisabled = isFull && !isSelected;

                    return (
                        <motion.button
                            key={`${deckKey}-${id}-${idx}`}
                            initial={{ opacity: 0, y: -20, rotate: (idx % 3 - 1) * 2 }}
                            animate={{
                                opacity: isDisabled ? 0.28 : 1,
                                y: 0,
                                rotate: 0,
                                scale: isSelected ? 0.95 : 1,
                            }}
                            transition={{
                                delay: idx * 0.045,
                                duration: 0.38,
                                ease: 'easeOut',
                                scale: { duration: 0.2 },
                                opacity: { duration: 0.3 },
                            }}
                            whileHover={!isDisabled && !isSelected ? { y: -5, scale: 1.04 } : {}}
                            whileTap={!isDisabled && !isSelected ? { scale: 0.96 } : {}}
                            onClick={() => !isDisabled && !isSelected && onSelect(id)}
                            disabled={isDisabled}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4 * scale,
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: isDisabled ? 'default' : 'pointer',
                                position: 'relative',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <motion.div
                                style={{ position: 'relative' }}
                                animate={!isSelected && !isDisabled ? { y: [0, -3, 0] } : { y: 0 }}
                                transition={!isSelected && !isDisabled ? {
                                    duration: 3 + (idx % 3) * 0.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: (idx % 6) * 0.22,
                                } : { duration: 0.2 }}
                            >
                                {/* 대기 상태 은은한 글로우 펄스 */}
                                {!isSelected && !isDisabled && (
                                    <motion.div
                                        style={{
                                            position: 'absolute',
                                            inset: -8,
                                            borderRadius: 16,
                                            background: `radial-gradient(circle, ${ring.idle} 0%, transparent 72%)`,
                                            pointerEvents: 'none',
                                            zIndex: -1,
                                        }}
                                        animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.94, 1.02, 0.94] }}
                                        transition={{
                                            duration: 3.4 + (idx % 4) * 0.4,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: (idx % 5) * 0.3,
                                        }}
                                    />
                                )}

                                {/* 선택 글로우 링 — 카드 모양에 맞춰 밀착 */}
                                {isSelected && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            position: 'absolute',
                                            inset: -3,
                                            borderRadius: 11,
                                            border: `1.5px solid ${ring.border}`,
                                            boxShadow: ring.glow,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}
                                <CardBack
                                    isSelected={isSelected}
                                    isDisabled={isDisabled}
                                    cardName={card?.name}
                                    size="md"
                                    scale={scale}
                                />
                            </motion.div>

                            {/* 카드 번호 */}
                            <span style={{
                                fontSize: 9.5 * scale,
                                fontWeight: 500,
                                color: isSelected ? 'var(--tarot-accent-light)' : 'var(--tarot-text-3)',
                                letterSpacing: '0.06em',
                                opacity: isDisabled ? 0.4 : 1,
                                transition: 'color 0.2s',
                            }}>
                                {id === 0 ? '0' : `${id}`}
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>
        </AnimatePresence>
    );
}
