'use client';

// ─────────────────────────────────────────────
// 윤명 — 지난 리포트 히스토리
// localStorage 기반 (기기 단위). 발급된 리포트를 다시 열람하는 진입점.
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react';
import MdShell from '@/components/naming/yunmyeong/MdShell';
import {
    NamingHistoryEntry,
    SERVICE_TYPE_LABELS,
    loadNamingHistory,
    removeNamingHistory,
} from '@/features/naming/history';

export default function NamingHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<NamingHistoryEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setHistory(loadNamingHistory());
        setLoaded(true);
    }, []);

    const handleRemove = (jobId: string) => {
        if (!confirm('이 리포트 기록을 삭제하시겠습니까?')) return;
        setHistory(removeNamingHistory(jobId));
    };

    return (
        <MdShell theme="obsidian">
            <div className="md-screen">
                {/* 헤더 */}
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--md-line)',
                    position: 'sticky', top: 0, background: 'var(--md-bg)', zIndex: 10,
                }}>
                    <button
                        onClick={() => router.back()}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--md-text-3)', display: 'flex' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="md-serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--md-text)' }}>
                        지난 리포트
                    </span>
                </header>

                <main style={{ padding: '24px 20px 48px' }}>
                    {loaded && history.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 80, gap: 8 }}>
                            <div className="md-serif" style={{ fontSize: 34, color: 'var(--md-accent)' }}>命</div>
                            <p className="md-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--md-text)', margin: '8px 0 0' }}>
                                아직 발급된 리포트가 없어요
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--md-text-3)', lineHeight: 1.7, margin: '0 0 24px' }}>
                                리포트를 발급받으면 이곳에서<br />언제든 다시 볼 수 있어요.
                            </p>
                            <button className="md-btn" onClick={() => router.push('/yunmyeong')}>
                                윤명 시작하기
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: 12 }}>
                        {history.map((entry) => {
                            const dateStr = entry.createdAt
                                ? new Date(entry.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                                : '';
                            const typeLabel = SERVICE_TYPE_LABELS[entry.serviceType] || '리포트';
                            const nameLabel = entry.currentName
                                ? `${entry.surname}${entry.currentName}`
                                : `${entry.surname}씨 가문`;

                            return (
                                <div key={entry.jobId} className="md-card" style={{ padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <div className="md-eyebrow" style={{ marginBottom: 6 }}>{typeLabel}</div>
                                            <div className="md-serif" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--md-text)' }}>
                                                {nameLabel}
                                            </div>
                                            {dateStr && (
                                                <div style={{ fontSize: 11, color: 'var(--md-text-3)', marginTop: 4 }}>
                                                    {dateStr} 발급
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemove(entry.jobId)}
                                            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--md-text-3)', opacity: 0.6 }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <Link href={`/yunmyeong/result/${entry.jobId}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                            padding: '11px', borderRadius: 10,
                                            border: '1px solid var(--md-line-strong)',
                                            fontSize: 13, fontWeight: 600, color: 'var(--md-accent)',
                                        }}>
                                            리포트 다시 보기
                                            <ChevronRight size={15} />
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </MdShell>
    );
}
