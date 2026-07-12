'use client';

// ─────────────────────────────────────────────
// 윤명(潤名) — 메뉴 페이지
// 윤명 전용 유틸리티 네비게이션 (보관함 · 새 작명 · 고객센터)
// hanji 테마 · --md-* 토큰만 사용 (다른 서비스 테마 미접촉)
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import MdShell from '@/components/naming/yunmyeong/MdShell';
import { loadNamingHistory } from '@/features/naming/history';

export default function NamingMenuPage() {
    const router = useRouter();
    const [historyCount, setHistoryCount] = useState(0);

    useEffect(() => {
        setHistoryCount(loadNamingHistory().length);
    }, []);

    const menuItems = [
        {
            glyph: '藏',
            label: '리포트 보관함',
            subtitle: historyCount > 0 ? `${historyCount}개의 리포트` : '아직 발급된 리포트가 없어요',
            href: '/yunmyeong/history',
        },
        {
            glyph: '名',
            label: '새 이름 짓기',
            subtitle: '작명 · 개명 · 감명 시작하기',
            href: '/yunmyeong',
        },
        {
            glyph: '問',
            label: '고객센터',
            subtitle: '실시간 상담하기',
            href: '#channeltalk',
        },
    ];

    return (
        <MdShell theme="hanji">
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
                        메뉴
                    </span>
                </header>

                {/* 인트로 */}
                <section style={{ padding: '30px 24px 22px' }}>
                    <div className="md-eyebrow">윤명 潤名</div>
                    <p className="md-serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, margin: '10px 0 0', color: 'var(--md-text)' }}>
                        발급된 이름은<br />언제든 다시 꺼내볼 수 있습니다
                    </p>
                </section>

                {/* 메뉴 리스트 */}
                <main style={{ padding: '0 20px 48px', display: 'grid', gap: 11 }}>
                    {menuItems.map((item) => {
                        const isChannelTalk = item.href === '#channeltalk';
                        const content = (
                            <div className="md-card" style={{
                                display: 'grid', gridTemplateColumns: '44px 1fr 20px',
                                alignItems: 'center', gap: 14, padding: '16px 16px',
                                cursor: 'pointer', textAlign: 'left',
                            }}>
                                <div className="md-serif" aria-hidden="true" style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)',
                                    fontSize: 19, fontWeight: 600, color: 'var(--md-accent)',
                                }}>{item.glyph}</div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--md-text)', margin: 0 }}>{item.label}</p>
                                    <p style={{
                                        fontSize: 12.5, color: 'var(--md-text-2)', margin: '4px 0 0', lineHeight: 1.5,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{item.subtitle}</p>
                                </div>
                                <ChevronRight size={16} color="var(--md-text-3)" />
                            </div>
                        );

                        return isChannelTalk ? (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (window.ChannelIO) {
                                        window.ChannelIO('showMessenger');
                                    } else {
                                        toast.error('고객센터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                                    }
                                }}
                                style={{ background: 'none', border: 'none', padding: 0, width: '100%', fontFamily: 'inherit' }}
                            >
                                {content}
                            </button>
                        ) : (
                            <Link key={item.label} href={item.href} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                                {content}
                            </Link>
                        );
                    })}

                    {/* 법적 고지 링크 */}
                    <div style={{
                        marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--md-line)',
                        display: 'flex', justifyContent: 'center', gap: 16,
                    }}>
                        {([['privacy', '개인정보처리방침'], ['terms', '이용약관'], ['refund', '환불정책']] as const).map(([type, label]) => (
                            <Link key={type} href={`/yunmyeong/legal/${type}`} style={{
                                fontSize: 11.5, color: 'var(--md-text-3)', textDecoration: 'none',
                            }}>{label}</Link>
                        ))}
                    </div>
                </main>
            </div>
        </MdShell>
    );
}
