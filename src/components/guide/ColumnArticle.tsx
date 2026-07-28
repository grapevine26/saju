import Link from "next/link";
import type { Block, Column, GuideConfig, GuideTheme } from "@/features/guide/types";

/** 본문의 **굵게**를 강조로 변환 — 마크다운 파서를 붙일 만큼 문법이 많지 않다 */
function renderInline(text: string, ink: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} style={{ color: ink, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : <span key={i}>{part}</span>
    );
}

function renderBlock(b: Block, i: number, T: GuideTheme) {
    if (b.t === 'h2') {
        return (
            <h2 key={i} style={{
                fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink,
                margin: '34px 0 14px', lineHeight: 1.5, wordBreak: 'keep-all',
            }}>{b.text}</h2>
        );
    }
    if (b.t === 'hr') {
        return <div key={i} style={{ borderTop: `1px solid ${T.lineSoft}`, margin: '32px 0' }} />;
    }
    return (
        <p key={i} style={{
            fontSize: 14.5, color: T.sub, lineHeight: 2, margin: '0 0 18px', wordBreak: 'keep-all',
        }}>{renderInline(b.text, T.ink)}</p>
    );
}

/**
 * 칼럼 상세 본문 — 재회 사주(/saju/guide)와 타로(/tarot/guide)가 공유한다.
 * 색과 링크는 theme·config로 주입받아 두 세계관을 섞지 않는다.
 */
export function ColumnArticle({
    column, related, theme: T, config,
}: {
    column: Column;
    related: Column[];
    theme: GuideTheme;
    config: GuideConfig;
}) {
    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: T.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 22px 100px' }}>

                <nav style={{ fontSize: 11.5, color: T.muted, marginBottom: 22 }}>
                    <Link href={config.servicePath} style={{ color: T.muted, textDecoration: 'none' }}>{config.serviceName}</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <Link href={config.basePath} style={{ color: T.muted, textDecoration: 'none' }}>{config.guideName}</Link>
                </nav>

                <header style={{ marginBottom: 30 }}>
                    <h1 style={{
                        fontFamily: T.serif, fontSize: 25, fontWeight: 900, lineHeight: 1.45,
                        color: T.ink, margin: '0 0 14px', wordBreak: 'keep-all',
                    }}>{column.heading}</h1>
                    <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                        <time dateTime={column.publishedAt}>{column.publishedAt.replace(/-/g, '.')}</time>
                    </p>
                </header>

                <article>{column.blocks.map((b, i) => renderBlock(b, i, T))}</article>

                {/* CTA */}
                <div style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}`, borderRadius: T.r, padding: '20px 22px', margin: '34px 0 30px' }}>
                    <p style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.85, margin: '0 0 14px', wordBreak: 'keep-all' }}>{column.ctaLead}</p>
                    <Link href={config.servicePath} style={{
                        display: 'block', textAlign: 'center', background: T.btnBg, color: T.btnInk,
                        fontWeight: 700, fontSize: 14.5, padding: '16px 0', borderRadius: 12, textDecoration: 'none',
                    }}>
                        {config.ctaLabel}
                    </Link>
                    <p style={{ fontSize: 11.5, color: T.muted, textAlign: 'center', margin: '10px 0 0' }}>{config.ctaNote}</p>
                </div>

                {/* FAQ */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 12 }}>자주 묻는 질문</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                    {column.faqs.map((f, i) => (
                        <div key={i} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 13, padding: '15px 17px' }}>
                            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, margin: '0 0 7px', wordBreak: 'keep-all' }}>{f.q}</h3>
                            <p style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{f.a}</p>
                        </div>
                    ))}
                </div>

                {/* 이어 읽기 */}
                {related.length > 0 && (
                    <>
                        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 12 }}>이어서 읽기</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {related.map((r) => (
                                <Link key={r.slug} href={`${config.basePath}/${r.slug}`} style={{
                                    display: 'block', background: T.card, border: `1px solid ${T.cardBorder}`,
                                    borderRadius: 13, padding: '15px 17px', textDecoration: 'none',
                                }}>
                                    <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, margin: '0 0 5px', wordBreak: 'keep-all' }}>{r.heading}</p>
                                    <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, margin: 0, wordBreak: 'keep-all' }}>{r.excerpt}</p>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                <Link href={config.basePath} style={{ display: 'inline-block', marginTop: 20, fontSize: 12.5, color: T.accentBright, textDecoration: 'none' }}>
                    {config.guideName} 전체 보기 →
                </Link>
            </div>
        </div>
    );
}

/** Article + BreadcrumbList + FAQPage를 @graph로 묶는다 */
export function buildColumnJsonLd(column: Column, config: GuideConfig) {
    const url = `https://dasisaju.com${config.basePath}/${column.slug}`;
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                headline: column.heading,
                description: column.description,
                image: 'https://dasisaju.com/og-image.png',
                datePublished: column.publishedAt,
                dateModified: column.publishedAt,
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
                    { '@type': 'ListItem', position: 1, name: config.serviceName, item: `https://dasisaju.com${config.servicePath}` },
                    { '@type': 'ListItem', position: 2, name: config.guideName, item: `https://dasisaju.com${config.basePath}` },
                    { '@type': 'ListItem', position: 3, name: column.heading, item: url },
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: column.faqs.map((f) => ({
                    '@type': 'Question', name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
        ],
    };
}
