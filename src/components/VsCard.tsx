import React from 'react';
import { motion } from 'framer-motion';

interface VsCardProps {
    topic: string;
    myTrait: string;
    partnerTrait: string;
    explanation: string;
    index: number;
}

export default function VsCard({ topic, myTrait, partnerTrait, explanation, index }: VsCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card overflow-hidden mb-4"
        >
            <div className="bg-[var(--bg-glass)] py-3 px-4 border-b border-[var(--border-glass)] text-center">
                <h3 className="font-bold text-[var(--accent-gold)] text-[15px]">{topic}</h3>
            </div>
            <div className="flex relative">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center z-10 border border-[var(--border-glass)]">
                    <span className="text-[11px] font-black italic text-[var(--text-muted)]">VS</span>
                </div>

                {/* My Trait */}
                <div className="flex-1 p-5 text-center bg-rose-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <span className="text-[11px] text-rose-400 font-bold tracking-wider mb-2 block uppercase">나의 연애 성향</span>
                    <p className="text-[14px] text-[var(--text-primary)] font-bold break-keep">{myTrait}</p>
                </div>

                <div className="w-px bg-[var(--line-soft)]" />

                {/* Partner Trait */}
                <div className="flex-1 p-5 text-center bg-indigo-500/5 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full -translate-x-1/2 translate-y-1/2" />
                    <span className="text-[11px] text-indigo-400 font-bold tracking-wider mb-2 block uppercase">상대방의 연애 성향</span>
                    <p className="text-[14px] text-[var(--text-primary)] font-bold break-keep">{partnerTrait}</p>
                </div>
            </div>

            <div className="p-4 bg-[var(--bg-glass)] border-t border-[var(--line-soft)]">
                <p className="text-[14px] text-[var(--text-secondary)] leading-[1.7] font-medium break-keep whitespace-pre-wrap">
                    {explanation}
                </p>
            </div>
        </motion.div>
    );
}
