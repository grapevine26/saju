"use client";

/**
 * 운명의 합 — 궁합 보관함
 * 결제 완료된 리포트를 로컬에 기록해 탭을 닫아도 다시 볼 수 있게 한다
 * (다시,우리 /history · 타로 /tarot/history와 동일 원칙, 인장·금박 테마).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { HAP_HISTORY_KEY } from "@/features/hap/constants";

const C = {
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
    btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif",
};

interface HapHistoryEntry {
    jobId: string;
    myName: string;
    partnerName: string;
    totalScore: number | null;
    totalGrade: string | null;
    createdAt: number | null;
}

function loadHistory(): HapHistoryEntry[] {
    try {
        const raw = localStorage.getItem(HAP_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export default function HapHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HapHistoryEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setHistory(loadHistory());
        setLoaded(true);
    }, []);

    const removeEntry = (jobId: string) => {
        if (!confirm('이 궁합 리포트 기록을 삭제하시겠습니까?')) return;
        const next = history.filter(e => e.jobId !== jobId);
        setHistory(next);
        try { localStorage.setItem(HAP_HISTORY_KEY, JSON.stringify(next)); } catch {}
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 60, color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <header style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12,
                borderBottom: `1px solid ${C.lineSoft}`,
                position: 'sticky', top: 0, background: 'rgba(10,9,8,0.88)', backdropFilter: 'blur(12px)', zIndex: 10,
            }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.sub, display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <p style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>궁합 보관함</p>
            </header>

            <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
                {loaded && history.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 80, gap: 8 }}>
                        <p style={{ fontFamily: C.serif, fontSize: 40, color: C.accentBright, margin: 0 }}>合</p>
                        <p style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: '8px 0 0' }}>아직 궁합 리포트가 없어요</p>
                        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
                            전체 리포트를 받으면 이곳에서<br />언제든 다시 볼 수 있어요.
                        </p>
                        <Link href="/hap" style={{
                            display: 'inline-block', padding: '15px 28px', borderRadius: 14,
                            background: C.btnBg, color: C.btnInk,
                            fontSize: 15, fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 6px 30px rgba(140,106,50,0.28)',
                        }}>궁합 리포트 보러 가기</Link>
                    </motion.div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {history.map((entry, i) => {
                        const dateStr = entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : '';
                        const title = entry.myName && entry.partnerName
                            ? `${entry.myName} ✕ ${entry.partnerName}`
                            : '운명의 합';

                        return (
                            <motion.div key={entry.jobId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div>
                                        <p style={{ fontFamily: C.serif, fontSize: 14.5, fontWeight: 700, color: C.ink, margin: 0 }}>{title}</p>
                                        <p style={{ fontSize: 11, color: C.muted, margin: '4px 0 0' }}>
                                            {dateStr}{dateStr && entry.totalScore != null ? ' · ' : ''}
                                            {entry.totalScore != null && (
                                                <span style={{ color: C.accentBright, fontWeight: 700 }}>{entry.totalScore}점 {entry.totalGrade}등급</span>
                                            )}
                                        </p>
                                    </div>
                                    <button onClick={() => removeEntry(entry.jobId)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: C.muted, opacity: 0.6 }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <Link href={`/hap/result/${entry.jobId}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        padding: '11px', borderRadius: 12,
                                        background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
                                        fontSize: 13, fontWeight: 600, color: C.accentBright,
                                    }}>
                                        다시 보기 <ChevronRight size={15} />
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
