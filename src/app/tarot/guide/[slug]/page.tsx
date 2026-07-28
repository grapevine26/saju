import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TAROT_COLUMNS } from "@/features/guide/tarotColumns";
import { findColumn, type GuideConfig, type GuideTheme } from "@/features/guide/types";
import { ColumnArticle, buildColumnJsonLd } from "@/components/guide/ColumnArticle";

export function generateStaticParams() {
    return TAROT_COLUMNS.map((c) => ({ slug: c.slug }));
}

type Params = { slug: string };

const getCol = (slug: string) => findColumn(TAROT_COLUMNS, slug);

// 타로 팔레트(보랏빛 밤하늘) — /tarot 랜딩과 같은 세계관. 재회 사주(로즈)와 섞지 않는다.
const THEME: GuideTheme = {
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)',
    accentBorder: 'rgba(176,123,180,0.35)', accentSoft: 'rgba(176,123,180,0.10)',
    accentBright: '#C89BCC',
    ink: '#F0EAEB', sub: '#9C9199', muted: '#5F565D', lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #C89BCC 0%, #6E4574 100%)', btnInk: '#FBF4FC',
    serif: "'Noto Serif KR', serif", r: 16,
};

const CONFIG: GuideConfig = {
    basePath: '/tarot/guide',
    servicePath: '/tarot',
    serviceName: '연애 타로',
    guideName: '타로 가이드',
    ctaLabel: '그 사람 마음 무료로 확인하기',
    ctaNote: '첫 두 장은 결제 없이 · 가입도 필요 없어요',
    siteName: 'ODD TAROT',
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { slug } = await params;
    const col = getCol(slug);
    if (!col) return {};
    return {
        title: `${col.title} - 묘연`,
        description: col.description,
        keywords: col.keywords,
        alternates: { canonical: `${CONFIG.basePath}/${col.slug}` },
        openGraph: {
            title: col.title,
            description: col.description,
            url: `https://dasisaju.com${CONFIG.basePath}/${col.slug}`,
            siteName: CONFIG.siteName,
            locale: "ko_KR",
            type: "article",
            publishedTime: col.publishedAt,
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: col.heading }],
        },
        twitter: { card: "summary_large_image", title: col.title, description: col.description, images: ["/og-image.png"] },
    };
}

export default async function TarotColumnPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    const col = getCol(slug);
    if (!col) notFound();

    const related = col.related.map((s) => getCol(s)).filter((c): c is NonNullable<typeof c> => !!c);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildColumnJsonLd(col, CONFIG)) }} />
            <ColumnArticle column={col} related={related} theme={THEME} config={CONFIG} />
        </>
    );
}
