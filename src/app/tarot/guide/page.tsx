import type { Metadata } from "next";
import Link from "next/link";
import { TAROT_COLUMNS } from "@/features/guide/tarotColumns";

export const metadata: Metadata = {
    title: "타로 가이드 | 그 사람 속마음 읽는 법 - ODD TAROT",
    description: "속마음, 썸, 짝사랑, 연락 빈도 — 물어볼 수 없는 것들을 어떻게 읽는지 정리했어요. 확실하지 않은 건 확실하지 않다고 적었습니다.",
    alternates: { canonical: "/tarot/guide" },
    openGraph: {
        title: "타로 가이드 | 그 사람 속마음 읽는 법",
        description: "속마음, 썸, 짝사랑, 연락 빈도 — 물어볼 수 없는 것들을 어떻게 읽는지 정리했어요.",
        url: "https://dasisaju.com/tarot/guide",
        siteName: "ODD TAROT",
        locale: "ko_KR",
        type: "website",
    },
};

const C = {
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)',
    accentBorder: 'rgba(176,123,180,0.35)', accentSoft: 'rgba(176,123,180,0.10)',
    accentBright: '#C89BCC', ink: '#F0EAEB', sub: '#9C9199', muted: '#5F565D',
    btnBg: 'linear-gradient(135deg, #C89BCC 0%, #6E4574 100%)', btnInk: '#FBF4FC',
    serif: "'Noto Serif KR', serif", r: 16,
};

export default function TarotGuideIndexPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: TAROT_COLUMNS.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.heading,
            url: `https://dasisaju.com/tarot/guide/${c.slug}`,
        })),
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 22px 100px' }}>

                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 22 }}>
                    <Link href="/tarot" style={{ color: C.muted, textDecoration: 'none' }}>연애 타로</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: C.sub }}>타로 가이드</span>
                </nav>

                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 900, lineHeight: 1.45, margin: '0 0 14px', wordBreak: 'keep-all' }}>
                        타로 가이드
                    </h1>
                    <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.85, margin: 0, wordBreak: 'keep-all' }}>
                        속마음, 썸, 짝사랑, 연락 빈도 — 직접 물어볼 수 없는 것들을 어떻게 읽는지 정리했어요.
                        확실하지 않은 건 확실하지 않다고 적었습니다.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {TAROT_COLUMNS.map((c, i) => (
                        <Link key={c.slug} href={`/tarot/guide/${c.slug}`} style={{
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
                        글로는 경향까지밖에 알려드릴 수 없어요. 7장의 카드가 그 사람의 지금 마음과 두 사람의 앞날을 읽어드립니다.
                    </p>
                    <Link href="/tarot" style={{
                        display: 'block', textAlign: 'center', background: C.btnBg, color: C.btnInk,
                        fontWeight: 700, fontSize: 14.5, padding: '16px 0', borderRadius: 12, textDecoration: 'none',
                    }}>
                        그 사람 마음 무료로 확인하기
                    </Link>
                    <p style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>
                        첫 두 장은 결제 없이 · 가입도 필요 없어요
                    </p>
                </div>
            </div>
        </div>
    );
}
