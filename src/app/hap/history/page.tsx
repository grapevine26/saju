"use client";

/**
 * 운명의 합 — 궁합 보관함
 * 무료 진단도 즉시 기록하고(Free), 결제하면 같은 항목이 Premium으로 승격된다
 * (재회사주 /history의 Lite→Premium과 동일 원칙, 인장·금박 테마).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllHapHistory, removeHapHistoryEntry, type HapHistoryEntry } from "@/features/hap/history";

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

export default function HapHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HapHistoryEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const local = getAllHapHistory();
        setHistory(local);
        setLoaded(true);

        // 계정에 저장된 (premium) 리포트 병합 — 로그인 상태면 기기가 바뀌어도 기록이 보인다
        (async () => {
            try {
                const res = await fetch('/api/hap/claim');
                const data = await res.json();
                const account: any[] = data?.reports || [];
                if (!account.length) return;
                const mapped: HapHistoryEntry[] = account.map(r => ({
                    id: r.jobId, tier: 'premium', jobId: r.jobId,
                    myName: r.myName, partnerName: r.partnerName,
                    totalScore: r.totalScore, totalGrade: r.totalGrade, createdAt: r.createdAt,
                }));
                setHistory(prev => {
                    const seen = new Set(prev.map(e => e.id));
                    const merged = [...prev, ...mapped.filter(e => !seen.has(e.id))];
                    merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    return merged;
                });
            } catch { /* 비로그인/네트워크 실패 — 로컬 기록만 표시 */ }
        })();
    }, []);

    const removeEntry = (id: string) => {
        if (!confirm('이 궁합 리포트 기록을 삭제하시겠습니까?')) return;
        setHistory(removeHapHistoryEntry(id));
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 60, color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <header style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 0', gap: 12 }}>
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
                        <p style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: '8px 0 0' }}>아직 궁합 기록이 없어요</p>
                        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
                            무료 미리보기만 받아도 이곳에 기록돼요.<br />전체 리포트는 결제 후 계속 다시 볼 수 있어요.
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
                        const isPremium = entry.tier === 'premium';
                        const href = isPremium ? `/hap/result/${entry.jobId}` : `/hap/history/${entry.id}`;

                        return (
                            <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <p style={{ fontFamily: C.serif, fontSize: 14.5, fontWeight: 700, color: C.ink, margin: 0 }}>{title}</p>
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                                                color: isPremium ? C.accentBright : C.muted,
                                                background: isPremium ? C.accentSoft : 'rgba(240,234,235,0.05)',
                                                border: `1px solid ${isPremium ? C.accentBorder : C.cardBorder}`,
                                            }}>{isPremium ? 'PREMIUM' : 'FREE'}</span>
                                        </div>
                                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                                            {dateStr}{dateStr && entry.totalScore != null ? ' · ' : ''}
                                            {entry.totalScore != null && (
                                                <span style={{ color: C.accentBright, fontWeight: 700 }}>{entry.totalScore}점 {entry.totalGrade}등급</span>
                                            )}
                                        </p>
                                    </div>
                                    <button onClick={() => removeEntry(entry.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: C.muted, opacity: 0.6, flexShrink: 0 }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <Link href={href} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        padding: '11px', borderRadius: 12,
                                        background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
                                        fontSize: 13, fontWeight: 600, color: C.accentBright,
                                    }}>
                                        {isPremium ? '전체 리포트 다시 보기' : '무료 진단 다시 보기'} <ChevronRight size={15} />
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
