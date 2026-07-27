import type { Metadata } from "next";
import Link from "next/link";
import { COLUMNS } from "@/features/guide/columns";

export const metadata: Metadata = {
    title: "재회 가이드 | 이별 후 신호 읽는 법과 연락 타이밍 - 묘연",
    description: "전남친 프사, 차단, 잠수이별, 연락 타이밍 — 이별 후 가장 많이 헤매는 것들을 정직하게 정리했어요. 짐작으로 판단하기 전에 읽어보세요.",
    alternates: { canonical: "/saju/guide" },
    openGraph: {
        title: "재회 가이드 | 이별 후 신호 읽는 법과 연락 타이밍",
        description: "전남친 프사, 차단, 잠수이별, 연락 타이밍을 정직하게 정리했어요.",
        url: "https://dasisaju.com/saju/guide",
        siteName: "묘연",
        locale: "ko_KR",
        type: "website",
    },
};

const C = {
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)',
    accentBorder: 'rgba(216,72,94,0.35)', accentSoft: 'rgba(216,72,94,0.10)',
    accentBright: '#F06A7E', ink: '#F0EAEB', sub: '#9C9199', muted: '#5F565D',
    btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)', btnInk: '#FFF0F2',
    serif: "'Noto Serif KR', serif", r: 16,
};

export default function GuideIndexPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: COLUMNS.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.heading,
            url: `https://dasisaju.com/saju/guide/${c.slug}`,
        })),
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 22px 100px' }}>

                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 22 }}>
                    <Link href="/saju" style={{ color: C.muted, textDecoration: 'none' }}>재회 사주</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: C.sub }}>재회 가이드</span>
                </nav>

                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 900, lineHeight: 1.45, margin: '0 0 14px', wordBreak: 'keep-all' }}>
                        재회 가이드
                    </h1>
                    <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.85, margin: 0, wordBreak: 'keep-all' }}>
                        프사, 차단, 잠수이별, 연락 타이밍 — 이별 후 가장 많이 헤매는 것들을 정리했어요.
                        확실하지 않은 건 확실하지 않다고 적었습니다.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {COLUMNS.map((c, i) => (
                        <Link key={c.slug} href={`/saju/guide/${c.slug}`} style={{
                            display: 'block', background: C.card, border: `1px solid ${C.cardBorder}`,
                            borderRadius: C.r, padding: '18px 20px', textDecoration: 'none',
                        }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: C.accentBright, margin: '0 0 8px' }}>
                                {String(i + 1).padStart(2, '0')}
                            </p>
                            <h2 style={{ fontFamily: C.serif, fontSize: 16.5, fontWeight: 700, color: C.ink, margin: '0 0 8px', lineHeight: 1.5, wordBreak: 'keep-all' }}>
                                {c.heading}
                            </h2>
                            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.75, margin: 0, wordBreak: 'keep-all' }}>{c.excerpt}</p>
                        </Link>
                    ))}
                </div>

                <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '20px 22px' }}>
                    <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: '0 0 14px', wordBreak: 'keep-all' }}>
                        글로는 경향까지밖에 알려드릴 수 없어요. 두 분의 생년월일을 넣으면 재회 가능성과 연락하기 좋은 시기가 나옵니다.
                    </p>
                    <Link href="/saju" style={{
                        display: 'block', textAlign: 'center', background: C.btnBg, color: C.btnInk,
                        fontWeight: 700, fontSize: 14.5, padding: '16px 0', borderRadius: 12, textDecoration: 'none',
                    }}>
                        두 분의 흐름 무료로 확인하기
                    </Link>
                    <p style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>
                        생년월일만 있으면 3분 · 상대방은 알 수 없어요
                    </p>
                </div>
            </div>
        </div>
    );
}
