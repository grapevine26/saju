"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { TAROT_HISTORY_KEY, TAROT_JOB_ID_KEY } from "@/features/tarot/constants";

interface TarotHistoryEntry {
    jobId: string;
    myName: string;
    partnerName: string;
    question: string;
    createdAt: number | null;
}

function loadHistory(): TarotHistoryEntry[] {
    try {
        const raw = localStorage.getItem(TAROT_HISTORY_KEY);
        const arr: TarotHistoryEntry[] = raw ? JSON.parse(raw) : [];

        // 구버전 단일 jobId 키만 있는 경우 히스토리로 마이그레이션
        const legacyJobId = localStorage.getItem(TAROT_JOB_ID_KEY);
        if (legacyJobId && !arr.some(e => e.jobId === legacyJobId)) {
            arr.push({ jobId: legacyJobId, myName: '', partnerName: '', question: '', createdAt: null });
            localStorage.setItem(TAROT_HISTORY_KEY, JSON.stringify(arr));
        }
        return arr;
    } catch {
        return [];
    }
}

export default function TarotHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<TarotHistoryEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setHistory(loadHistory());
        setLoaded(true);
    }, []);

    const removeEntry = (jobId: string) => {
        if (!confirm('이 리딩 기록을 삭제하시겠습니까?')) return;
        const next = history.filter(e => e.jobId !== jobId);
        setHistory(next);
        try {
            localStorage.setItem(TAROT_HISTORY_KEY, JSON.stringify(next));
            if (localStorage.getItem(TAROT_JOB_ID_KEY) === jobId) {
                localStorage.removeItem(TAROT_JOB_ID_KEY);
            }
        } catch {}
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
            {/* 헤더 */}
            <header style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12,
                borderBottom: '1px solid var(--tarot-border)',
                position: 'sticky', top: 0, background: 'var(--tarot-bg)', zIndex: 10,
            }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--tarot-text-3)', display: 'flex' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <p className="tarot-serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--tarot-text-1)', margin: 0 }}>
                    내 타로 리딩
                </p>
            </header>

            <main style={{ padding: '24px 20px' }}>
                {loaded && history.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 80, gap: 8 }}
                    >
                        <p style={{ fontSize: 40, color: 'var(--tarot-accent-light)', margin: 0 }}>✦</p>
                        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--tarot-text-1)', margin: '8px 0 0' }}>
                            아직 리딩 기록이 없어요
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--tarot-text-3)', lineHeight: 1.7, margin: '0 0 24px' }}>
                            전체 해석을 받으면 이곳에서<br />언제든 다시 볼 수 있어요.
                        </p>
                        <Link href="/tarot" style={{
                            display: 'inline-block', padding: '15px 28px', borderRadius: 14,
                            background: 'var(--tarot-btn-bg)', color: '#fff',
                            fontSize: 15, fontWeight: 700, textDecoration: 'none',
                            boxShadow: 'var(--tarot-btn-shadow)',
                        }}>
                            타로 리딩 시작하기
                        </Link>
                    </motion.div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {history.map((entry, i) => {
                        const dateStr = entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : '';
                        const title = entry.myName && entry.partnerName
                            ? `${entry.myName} ✕ ${entry.partnerName}`
                            : '타로 리딩';

                        return (
                            <motion.div
                                key={entry.jobId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                style={{
                                    background: 'var(--tarot-bg-card)',
                                    border: '1px solid var(--tarot-border)',
                                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                                    borderRadius: 16, padding: '16px 18px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: entry.question ? 10 : 14 }}>
                                    <div>
                                        <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tarot-text-1)', margin: 0 }}>
                                            {title}
                                        </p>
                                        {dateStr && (
                                            <p style={{ fontSize: 11, color: 'var(--tarot-text-3)', margin: '4px 0 0' }}>
                                                {dateStr} · 7장 전체 해석
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeEntry(entry.jobId)}
                                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--tarot-text-3)', opacity: 0.6 }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                {entry.question && (
                                    <p style={{
                                        fontSize: 12.5, color: 'var(--tarot-text-2)', fontStyle: 'italic',
                                        lineHeight: 1.6, margin: '0 0 14px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        "{entry.question}"
                                    </p>
                                )}

                                <Link href={`/tarot/result/${entry.jobId}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        padding: '11px', borderRadius: 12,
                                        background: 'rgba(76,40,137,0.3)',
                                        border: '1px solid var(--tarot-border)',
                                        fontSize: 13, fontWeight: 600, color: 'var(--tarot-accent-light)',
                                    }}>
                                        다시 보기
                                        <ChevronRight size={15} />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
