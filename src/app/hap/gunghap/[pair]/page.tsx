import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
    parseSlug, buildSlug, canonicalOrder, getAllOrderedPairs, calculateDdiGunghap, getRankedMatches,
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
    // 같은 띠 조합(쥐띠×쥐띠 등 12개)은 두 쪽이 동일하므로 프로필·베스트궁합·링크를 한 번만 그린다
    const sameDdi = cz1 === cz2;

    // 각 띠 기준 베스트 궁합 3개 — 내부 링크와 "그럼 누가 제일 잘 맞나" 수요를 같이 받는다
    const best1 = getRankedMatches(cz1).filter((m) => m.zhi !== cz2).slice(0, 3);
    const best2 = getRankedMatches(cz2).filter((m) => m.zhi !== cz1).slice(0, 3);

    const faqs = [
        {
            q: `${r.animal1}띠와 ${r.animal2}띠는 궁합이 좋은가요?`,
            a: `${r.badge} — ${r.badgeDesc}. 태어난 해 기준 약식 궁합 점수는 ${r.totalScore}점(${r.grade}등급)이에요. ${r.narrative}`,
        },
        {
            q: `${r.animal1}띠 ${r.animal2}띠 커플이 조심할 점은 뭔가요?`,
            a: r.frictionPoint,
        },
        {
            q: `${r.animal1}띠와 ${r.animal2}띠가 오래 만나려면 어떻게 해야 하나요?`,
            a: r.advice,
        },
        {
            q: '띠만 보고 궁합을 판단해도 되나요?',
            a: '띠는 태어난 해 하나만 반영한 정보예요. 실제 궁합은 태어난 달·날짜·시간까지 함께 봐야 정확해요. 같은 띠라도 생년월일이 다르면 결과가 달라지니, 이 점수는 참고용으로만 보시는 게 좋아요.',
        },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
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
                <div style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '22px', textAlign: 'center', marginBottom: 12 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, marginBottom: 8 }}>약식 궁합 점수</p>
                    <p style={{ fontFamily: C.serif, fontSize: 44, fontWeight: 900, color: C.accentBright, margin: '0 0 4px' }}>{r.totalScore}<span style={{ fontSize: 20, color: C.sub }}>점</span></p>
                    <p style={{ fontSize: 13, color: C.sub, margin: '0 0 16px' }}>{r.grade}등급 · {r.badgeDesc}</p>

                    {/* 세부 지표 — 총점만 보여주면 근거가 안 보인다 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left', paddingTop: 14, borderTop: `1px solid ${C.lineSoft}` }}>
                        {[
                            { label: '끌림', value: r.attractionScore },
                            { label: '갈등', value: r.conflictScore },
                            { label: '보완', value: r.complementScore },
                        ].map((m) => (
                            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ flexShrink: 0, width: 28, fontSize: 11.5, color: C.muted }}>{m.label}</span>
                                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(240,234,235,0.08)', overflow: 'hidden' }}>
                                    <div style={{ width: `${m.value}%`, height: '100%', background: C.accent, borderRadius: 3 }} />
                                </div>
                                <span style={{ flexShrink: 0, width: 26, fontSize: 11.5, color: C.sub, textAlign: 'right' }}>{m.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 관계 서사 — 점수를 사람 말로 옮긴 부분 */}
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 22 }}>
                    <h2 style={{ fontFamily: C.serif, fontSize: 15.5, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>두 사람은 어떤 관계가 될까요</h2>
                    <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.85, margin: 0, wordBreak: 'keep-all' }}>{r.narrative}</p>
                </div>

                {/* 띠별 연애 성향 — 조합마다 두 프로필이 다르게 짝지어진다 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>
                    {sameDdi ? `${r.animal1}띠는 연애할 때 이런 사람이에요` : '각자 연애할 때 이런 사람이에요'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                    {[
                        { animal: r.animal1, profile: r.profile1, color: C.him },
                        ...(sameDdi ? [] : [{ animal: r.animal2, profile: r.profile2, color: C.her }]),
                    ].map(({ animal, profile, color }) => (
                        <div key={animal} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '18px 20px' }}>
                            <h3 style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 700, color, margin: '0 0 4px' }}>{animal}띠</h3>
                            <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 12px', wordBreak: 'keep-all' }}>{profile.tagline}</p>
                            <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: '0 0 10px', wordBreak: 'keep-all' }}>{profile.loveStyle}</p>
                            <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.75, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                                <span style={{ color: C.muted }}>약한 지점 —</span> {profile.weakness}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {profile.keywords.map((k) => (
                                    <span key={k} style={{ fontSize: 11, color: C.sub, background: 'rgba(240,234,235,0.05)', border: `1px solid ${C.lineSoft}`, borderRadius: 999, padding: '4px 10px' }}>{k}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 지지 관계 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>왜 이렇게 나왔나요</h2>
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

                    {/* 지장간 — 겉으로 안 드러나는 끌림. 조합에 따라 있기도 없기도 하다 */}
                    {r.jijangganLinks.length > 0 && (
                        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 16px' }}>
                            <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>
                                <strong style={{ color: C.accentBright }}>숨은 끌림</strong> — 두 띠 안쪽에 숨은 기운끼리 {r.jijangganLinks.map((l) => l.description).join(', ')}으로 맞물려요. 겉으로는 드러나지 않지만 서로 신경 쓰이게 만드는 구조예요.
                            </p>
                        </div>
                    )}
                </div>

                {/* 주의점 · 조언 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>이 조합이 알아두면 좋은 것</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.her, margin: '0 0 8px' }}>부딪히기 쉬운 지점</h3>
                        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.frictionPoint}</p>
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.accentBright, margin: '0 0 8px' }}>오래 만나려면</h3>
                        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.advice}</p>
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

                {/* 자주 묻는 질문 — 화면 노출 + FAQPage 스키마 양쪽에 같은 내용을 쓴다 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>자주 묻는 질문</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
                    {faqs.map((f, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '15px 17px' }}>
                            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '0 0 7px', wordBreak: 'keep-all' }}>{f.q}</h3>
                            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{f.a}</p>
                        </div>
                    ))}
                </div>

                {/* 각 띠의 베스트 궁합 — "그럼 누가 제일 잘 맞나" 수요를 받으면서 내부 링크를 늘린다 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>
                    {sameDdi ? `${r.animal1}띠와 가장 잘 맞는 띠` : '각 띠와 가장 잘 맞는 띠'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    {[
                        { zhi: cz1, animal: r.animal1, list: best1 },
                        ...(sameDdi ? [] : [{ zhi: cz2, animal: r.animal2, list: best2 }]),
                    ].map(({ zhi, animal, list }) => (
                        <div key={zhi}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: C.accentBright, marginBottom: 8 }}>{animal}띠와 잘 맞는 띠</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {list.map((m, idx) => {
                                    const [lz1, lz2] = canonicalOrder(zhi, m.zhi);
                                    return (
                                        <Link key={m.zhi} href={`/hap/gunghap/${buildSlug(lz1, lz2)}`} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                                            background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 11, padding: '11px 14px',
                                        }}>
                                            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: C.muted, width: 12 }}>{idx + 1}</span>
                                            <span style={{ flex: 1, fontSize: 13, color: C.ink }}>{m.animal}띠</span>
                                            <span style={{ fontSize: 11.5, color: C.muted }}>{m.badge}</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.accentBright }}>{m.score}점</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 다른 조합 — 현재 페이지의 두 띠 각각을 기준으로, 순서상 가까운 다른 띠 4개씩 연결 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>다른 띠 궁합도 보기</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[cz1, ...(sameDdi ? [] : [cz2])].flatMap((baseZhi) => {
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
