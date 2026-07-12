"use client";

import { motion, AnimatePresence } from "framer-motion";
import CardBack from "./CardBack";
import { getCardById } from "@/features/tarot/cards";

interface SelectedStripProps {
    selectedIds: number[];
    maxPicks: number;
}

export default function SelectedStrip({ selectedIds, maxPicks }: SelectedStripProps) {
    const slots = Array.from({ length: maxPicks });

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '6px 20px',
        }}>
            {slots.map((_, i) => {
                const cardId = selectedIds[i];
                const card = cardId !== undefined ? getCardById(cardId) : null;
                const isFilled = cardId !== undefined;

                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                            width: 56,
                            height: 80,
                            borderRadius: 8,
                            border: isFilled
                                ? '1.5px solid rgba(109,40,217,0.6)'
                                : '1.5px dashed rgba(109,40,217,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isFilled ? 'transparent' : 'rgba(109,40,217,0.04)',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isFilled ? '0 0 12px rgba(109,40,217,0.25)' : 'none',
                            transition: 'all 0.3s ease',
                        }}>
                            <AnimatePresence mode="wait">
                                {isFilled ? (
                                    <motion.div
                                        key={cardId}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <CardBack isSelected size="sm" cardName={card?.name} />
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="empty"
                                        style={{
                                            fontSize: 18,
                                            color: 'rgba(109,40,217,0.3)',
                                            fontWeight: 300,
                                        }}
                                    >
                                        {i + 1}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        {card && (
                            <motion.span
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    fontSize: 9,
                                    color: 'var(--tarot-text-2)',
                                    fontWeight: 500,
                                    letterSpacing: '0.03em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {card.name}
                            </motion.span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
