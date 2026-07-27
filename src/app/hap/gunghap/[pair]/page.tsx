import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
    parseSlug, buildSlug, canonicalOrder, getAllOrderedPairs, calculateDdiGunghap,
} from "@/utils/ddiGunghap";
import { ZHI, ZHI_ANIMAL } from "@/utils/sajuMapper";

// 콘텐츠가 계산식으로 고정돼 있어 정적 생성 — 144개 순서쌍(정규 78 + 뒤바뀐 순서 66)을 미리 만들어
// 어느 순서로 검색해도 페이지가 존재하게 하고, 정규 순서가 아니면 안에서 canonical로 리다이렉트한다.
export function generateStaticParams() {
    return getAllOrderedPairs().map(([z1, z2]) => ({ pair: buildSlug(z1, z2) }));
}
// dynamicParams는 기본값(true)을 쓴다 — 이 라우트에서 params.pair가 percent-encoding 그대로
// 들어오는 경우가 있어(디코딩 안 됨), dynamicParams=false로 엄격히 매칭하면 정상 슬러그도
// 전부 404가 난다. 유효성 검사는 parseSlug()가 직접 하고 실패 시 notFound()를 호출한다.

type Params = { pair: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { pair } = await params;
    const parsed = parseSlug(pair);
    if (!parsed) return {};
    const [z1, z2] = canonicalOrder(...parsed);
    const r = calculateDdiGunghap(z1, z2);
    const canonicalSlug = buildSlug(z1, z2);
    const title = `${r.animal1}띠 ${r.animal2}띠 궁합 | 사주로 보는 띠 궁합 - 묘연`;
    const description = `${r.animal1}띠와 ${r.animal2}띠의 궁합을 명리 계산으로 분석했어요. ${r.badge} · 궁합 점수 ${r.totalScore}점(${r.grade}등급). ${r.ohhaengDesc}`;
    return {
        title,
        description,
        alternates: { canonical: `/hap/gunghap/${canonicalSlug}` },
        openGraph: { title, description, url: `https://dasisaju.com/hap/gunghap/${canonicalSlug}`, siteName: "운명의 합", locale: "ko_KR", type: "website" },
        twitter: { card: "summary", title, description },
    };
}

const C = {
    bg: '#0A090C', accent: '#C9A15C', accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)', accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE', her: '#D9B872', ink: '#F0EAEB', sub: '#9C9199', muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)', lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)', btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif", r: 16,
};

const RELATION_LABEL: Record<string, string> = {
    지지육합: '육합', '지지삼합(반합)': '삼합', '지지방합(반합)': '방합',
    지지충: '충', 지지형: '형', 지지해: '해',
};

export default async function DdiGunghapPage({ params }: { params: Promise<Params> }) {
    const { pair } = await params;
    const parsed = parseSlug(pair);
    if (!parsed) notFound();

    const [z1, z2] = parsed;
    const [cz1, cz2] = canonicalOrder(z1, z2);
    if (z1 !== cz1 || z2 !== cz2) {
        // Location 헤더는 ASCII만 허용 — 한글 슬러그를 그대로 넣으면 ERR_INVALID_CHAR로 500이 난다.
        permanentRedirect(`/hap/gunghap/${encodeURIComponent(buildSlug(cz1, cz2))}`);
    }

    const r = calculateDdiGunghap(cz1, cz2);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [{
            '@type': 'Question',
            name: `${r.animal1}띠와 ${r.animal2}띠는 궁합이 좋은가요?`,
            acceptedAnswer: {
                '@type': 'Answer',
                text: `${r.badge} — ${r.badgeDesc}. 년지 기준 약식 궁합 점수는 ${r.totalScore}점(${r.grade}등급)이에요. ${r.ohhaengDesc}`,
            },
        }],
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 20px 100px' }}>

                {/* 브레드크럼 */}
                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 20 }}>
                    <Link href="/hap" style={{ color: C.muted, textDecoration: 'none' }}>운명의 합</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <Link href="/hap/gunghap" style={{ color: C.muted, textDecoration: 'none' }}>띠 궁합</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: C.sub }}>{r.animal1}띠 {r.animal2}띠</span>
                </nav>

                {/* 히어로 */}
                <div style={{ textAlign: 'center', marginBottom: 26 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.3em', color: C.accentBright, marginBottom: 20 }}>띠 궁합</p>
                    <h1 style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 900, lineHeight: 1.4, marginBottom: 14, wordBreak: 'keep-all' }}>
                        {r.animal1}띠 × {r.animal2}띠<br />궁합
                    </h1>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700,
                        color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
                        padding: '8px 18px', borderRadius: 999,
                    }}>{r.badge}</span>
                </div>

                {/* 점수 카드 */}
                <div style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '22px', textAlign: 'center', marginBottom: 18 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, marginBottom: 8 }}>약식 궁합 점수</p>
                    <p style={{ fontFamily: C.serif, fontSize: 44, fontWeight: 900, color: C.accentBright, margin: '0 0 4px' }}>{r.totalScore}<span style={{ fontSize: 20, color: C.sub }}>점</span></p>
                    <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>{r.grade}등급 · {r.badgeDesc}</p>
                </div>

                {/* 지지 관계 */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>왜 이렇게 나왔나요</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {r.hapList.length === 0 && r.clashList.length === 0 ? (
                        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 16px' }}>
                            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>
                                두 띠 사이에 뚜렷한 합이나 충은 없어요. 극적인 끌림도, 부딪힘도 적은 무난한 관계라는 뜻이에요.
                            </p>
                        </div>
                    ) : (
                        <>
                            {r.hapList.map((h, i) => (
                                <div key={`hap-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 16px' }}>
                                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 999, padding: '3px 9px' }}>{RELATION_LABEL[h.type] || h.type}</span>
                                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>{h.description} — 서로를 끌어당기는 힘이에요.</p>
                                </div>
                            ))}
                            {r.clashList.map((c, i) => (
                                <div key={`clash-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 16px' }}>
                                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: C.her, background: 'rgba(217,184,114,0.08)', border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: '3px 9px' }}>{RELATION_LABEL[c.type] || c.type}</span>
                                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>{c.description} — 부딪히기 쉬운 지점이에요.</p>
                                </div>
                            ))}
                        </>
                    )}
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 16px' }}>
                        <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>
                            <strong style={{ color: C.accentBright }}>오행 관계 ({r.ohhaengRelation})</strong> — {r.ohhaengDesc}
                        </p>
                    </div>
                </div>

                {/* 정밀 분석 CTA */}
                <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                        이건 <strong style={{ color: C.accentBright }}>태어난 해(띠)만</strong> 반영한 약식 궁합이에요. 태어난 날짜·시간까지 반영한 정밀 궁합은 훨씬 더 구체적이에요.
                    </p>
                    <Link href="/hap/input" style={{
                        display: 'block', textAlign: 'center', background: C.btnBg, color: C.btnInk,
                        fontWeight: 700, fontSize: 14.5, padding: '15px 0', borderRadius: 12, textDecoration: 'none',
                    }}>
                        정확한 궁합 무료로 확인하기
                    </Link>
                </div>

                <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 30 }}>가입 없이 바로 · 생년월일만 있으면 돼요</p>

                {/* 다른 조합 — 현재 페이지의 두 띠 각각을 기준으로, 순서상 가까운 다른 띠 4개씩 연결 */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>다른 띠 궁합도 보기</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[cz1, cz2].flatMap((baseZhi) => {
                        const baseIdx = ZHI.indexOf(baseZhi);
                        // 현재 페이지 자체를 "다른 조합"으로 다시 추천하지 않도록 cz1·cz2 둘 다 제외
                        return ZHI.filter((z) => z !== cz1 && z !== cz2).slice(0, 4).map((otherZhi) => {
                            const [lz1, lz2] = canonicalOrder(baseZhi, otherZhi);
                            return { key: `${baseIdx}-${otherZhi}`, baseZhi, otherZhi, lz1, lz2 };
                        });
                    }).map(({ key, baseZhi, otherZhi, lz1, lz2 }) => (
                        <Link key={key} href={`/hap/gunghap/${buildSlug(lz1, lz2)}`} style={{
                            fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                            borderRadius: 999, padding: '7px 13px', textDecoration: 'none',
                        }}>{ZHI_ANIMAL[baseZhi]}띠 {ZHI_ANIMAL[otherZhi]}띠</Link>
                    ))}
                </div>
                <Link href="/hap/gunghap" style={{ display: 'inline-block', marginTop: 14, fontSize: 12.5, color: C.accentBright, textDecoration: 'none' }}>
                    전체 띠 궁합 목록 보기 →
                </Link>
            </div>
        </div>
    );
}
