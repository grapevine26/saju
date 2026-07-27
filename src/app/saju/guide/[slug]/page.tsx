import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLUMNS, getColumn, type Block } from "@/features/guide/columns";

export function generateStaticParams() {
    return COLUMNS.map((c) => ({ slug: c.slug }));
}

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { slug } = await params;
    const col = getColumn(slug);
    if (!col) return {};
    return {
        title: `${col.title} - 묘연`,
        description: col.description,
        keywords: col.keywords,
        alternates: { canonical: `/saju/guide/${col.slug}` },
        openGraph: {
            title: col.title,
            description: col.description,
            url: `https://dasisaju.com/saju/guide/${col.slug}`,
            siteName: "묘연",
            locale: "ko_KR",
            type: "article",
            publishedTime: col.publishedAt,
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: col.heading }],
        },
        twitter: { card: "summary_large_image", title: col.title, description: col.description, images: ["/og-image.png"] },
    };
}

// 재회 사주 팔레트(로즈) — /saju 랜딩과 같은 세계관을 유지한다
const C = {
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)',
    accentBorder: 'rgba(216,72,94,0.35)', accentSoft: 'rgba(216,72,94,0.10)',
    accent: '#D8485E', accentBright: '#F06A7E',
    ink: '#F0EAEB', sub: '#9C9199', muted: '#5F565D',
    lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)', btnInk: '#FFF0F2',
    serif: "'Noto Serif KR', serif", r: 16,
};

/** 본문의 **굵게**를 강조로 변환 — 마크다운 파서를 붙일 만큼 문법이 많지 않다 */
function renderInline(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} style={{ color: C.ink, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : <span key={i}>{part}</span>
    );
}

function renderBlock(b: Block, i: number) {
    if (b.t === 'h2') {
        return (
            <h2 key={i} style={{
                fontFamily: C.serif, fontSize: 18, fontWeight: 700, color: C.ink,
                margin: '34px 0 14px', lineHeight: 1.5, wordBreak: 'keep-all',
            }}>{b.text}</h2>
        );
    }
    if (b.t === 'hr') {
        return <div key={i} style={{ borderTop: `1px solid ${C.lineSoft}`, margin: '32px 0' }} />;
    }
    return (
        <p key={i} style={{
            fontSize: 14.5, color: C.sub, lineHeight: 2, margin: '0 0 18px', wordBreak: 'keep-all',
        }}>{renderInline(b.text)}</p>
    );
}

export default async function ColumnPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    const col = getColumn(slug);
    if (!col) notFound();

    const url = `https://dasisaju.com/saju/guide/${col.slug}`;
    const related = col.related.map((s) => getColumn(s)).filter(Boolean);

    // Article + BreadcrumbList + FAQPage를 @graph로 묶는다
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                headline: col.heading,
                description: col.description,
                image: 'https://dasisaju.com/og-image.png',
                datePublished: col.publishedAt,
                dateModified: col.publishedAt,
                inLanguage: 'ko-KR',
                mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                author: { '@type': 'Organization', name: '묘연', url: 'https://dasisaju.com' },
                publisher: {
                    '@type': 'Organization', name: '묘연', url: 'https://dasisaju.com',
                    logo: { '@type': 'ImageObject', url: 'https://dasisaju.com/og-image.png' },
                },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: '재회 사주', item: 'https://dasisaju.com/saju' },
                    { '@type': 'ListItem', position: 2, name: '재회 가이드', item: 'https://dasisaju.com/saju/guide' },
                    { '@type': 'ListItem', position: 3, name: col.heading, item: url },
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: col.faqs.map((f) => ({
                    '@type': 'Question', name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
        ],
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 22px 100px' }}>

                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 22 }}>
                    <Link href="/saju" style={{ color: C.muted, textDecoration: 'none' }}>재회 사주</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <Link href="/saju/guide" style={{ color: C.muted, textDecoration: 'none' }}>재회 가이드</Link>
                </nav>

                <header style={{ marginBottom: 30 }}>
                    <h1 style={{
                        fontFamily: C.serif, fontSize: 25, fontWeight: 900, lineHeight: 1.45,
                        color: C.ink, margin: '0 0 14px', wordBreak: 'keep-all',
                    }}>{col.heading}</h1>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                        <time dateTime={col.publishedAt}>{col.publishedAt.replace(/-/g, '.')}</time>
                    </p>
                </header>

                <article>{col.blocks.map(renderBlock)}</article>

                {/* CTA */}
                <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '20px 22px', margin: '34px 0 30px' }}>
                    <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: '0 0 14px', wordBreak: 'keep-all' }}>{col.ctaLead}</p>
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

                {/* FAQ */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>자주 묻는 질문</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                    {col.faqs.map((f, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '15px 17px' }}>
                            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '0 0 7px', wordBreak: 'keep-all' }}>{f.q}</h3>
                            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{f.a}</p>
                        </div>
                    ))}
                </div>

                {/* 이어 읽기 */}
                {related.length > 0 && (
                    <>
                        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>이어서 읽기</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {related.map((r) => (
                                <Link key={r!.slug} href={`/saju/guide/${r!.slug}`} style={{
                                    display: 'block', background: C.card, border: `1px solid ${C.cardBorder}`,
                                    borderRadius: 13, padding: '15px 17px', textDecoration: 'none',
                                }}>
                                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '0 0 5px', wordBreak: 'keep-all' }}>{r!.heading}</p>
                                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0, wordBreak: 'keep-all' }}>{r!.excerpt}</p>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                <Link href="/saju/guide" style={{ display: 'inline-block', marginTop: 20, fontSize: 12.5, color: C.accentBright, textDecoration: 'none' }}>
                    재회 가이드 전체 보기 →
                </Link>
            </div>
        </div>
    );
}
