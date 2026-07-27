import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    parseAnimalSlug, buildAnimalSlug, buildSlug, canonicalOrder,
    getRankedMatches, getDdiYears, getSamhapGroupInfo, josa, buildGenderedSlug,
} from "@/utils/ddiGunghap";
import { DDI_PROFILES } from "@/utils/ddiProfiles";
import { ZHI, ZHI_ANIMAL, getZhiOhhaeng, HANJA_MAP } from "@/utils/sajuMapper";

export function generateStaticParams() {
    return ZHI.map((zhi) => ({ animal: buildAnimalSlug(zhi) }));
}

type Params = { animal: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { animal } = await params;
    const zhi = parseAnimalSlug(animal);
    if (!zhi) return {};
    const a = ZHI_ANIMAL[zhi];
    const profile = DDI_PROFILES[zhi];
    const best = getRankedMatches(zhi).filter((m) => m.zhi !== zhi)[0];
    const title = `${a}띠 성격과 궁합 | ${a}띠와 잘 맞는 띠 - 묘연`;
    // tagline은 "~하는 사람" 꼴의 명사구라 서술어를 붙여 문장으로 만든다
    const description = `${a}띠는 ${profile.tagline}이에요. ${profile.loveStyle} ${a}띠와 가장 잘 맞는 띠는 ${best.animal}띠(${best.score}점)예요. 12띠 궁합 순위를 확인해보세요.`;
    return {
        title,
        description,
        alternates: { canonical: `/hap/ddi/${buildAnimalSlug(zhi)}` },
        openGraph: { title, description, url: `https://dasisaju.com/hap/ddi/${buildAnimalSlug(zhi)}`, siteName: "운명의 합", locale: "ko_KR", type: "website" },
        twitter: { card: "summary", title, description },
    };
}

const C = {
    accent: '#C9A15C', accentBright: '#E8CF9C', accentSoft: 'rgba(201,161,92,0.10)', accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE', her: '#D9B872', ink: '#F0EAEB', sub: '#9C9199', muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)', lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)', btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif", r: 16,
};

export default async function DdiPage({ params }: { params: Promise<Params> }) {
    const { animal } = await params;
    const zhi = parseAnimalSlug(animal);
    if (!zhi) notFound();

    const a = ZHI_ANIMAL[zhi];
    const profile = DDI_PROFILES[zhi];
    const ohhaeng = getZhiOhhaeng(zhi);
    const samhap = getSamhapGroupInfo(zhi);
    const years = getDdiYears(zhi);
    const ranked = getRankedMatches(zhi);
    const best = ranked.filter((m) => m.zhi !== zhi).slice(0, 3);
    const worst = [...ranked].reverse().filter((m) => m.zhi !== zhi).slice(0, 2);

    // 삼합 동료(자기 자신 제외) — "신자진 수국으로 묶이는 원숭이띠·용띠와 같은 방향을 봐요"
    const samhapMates = samhap ? samhap.members.filter((m) => m !== zhi).map((m) => `${ZHI_ANIMAL[m]}띠`) : [];
    const samhapText = samhap
        ? `. 특히 ${samhap.name}${josa(samhap.name, '으로', '로')} 묶이는 ${samhapMates.join('·')}${josa(samhapMates[samhapMates.length - 1], '과', '와')} 같은 방향을 봐요.`
        : '.';

    const faqs = [
        {
            q: `${a}띠는 어떤 성격인가요?`,
            a: `${a}띠는 ${profile.tagline}이에요. ${profile.loveStyle} 다만 ${profile.weakness}`,
        },
        {
            q: `${a}띠와 가장 잘 맞는 띠는 무엇인가요?`,
            a: `태어난 해 기준 약식 궁합으로는 ${best.map((m) => `${m.animal}띠(${m.score}점)`).join(', ')} 순이에요. 다만 이건 띠만 본 결과라, 실제 궁합은 생년월일 전체를 봐야 정확해요.`,
        },
        {
            q: `${a}띠는 몇 년생인가요?`,
            a: `${years.join('년, ')}년생이 ${a}띠예요. 다만 띠는 양력 1월 1일이 아니라 입춘(2월 4일경)을 기준으로 바뀌기 때문에, 1~2월 초에 태어났다면 앞 띠일 수 있어요.`,
        },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question', name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 20px 100px' }}>

                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 20 }}>
                    <Link href="/hap" style={{ color: C.muted, textDecoration: 'none' }}>운명의 합</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <Link href="/hap/gunghap" style={{ color: C.muted, textDecoration: 'none' }}>띠 궁합</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: C.sub }}>{a}띠</span>
                </nav>

                {/* 히어로 */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 62, height: 62, marginBottom: 18,
                        border: `2.5px solid ${C.accent}`, color: C.accentBright, borderRadius: 9,
                        fontFamily: C.serif, fontSize: 26, fontWeight: 900,
                    }}>{HANJA_MAP[zhi] ?? zhi}</div>
                    <h1 style={{ fontFamily: C.serif, fontSize: 27, fontWeight: 900, lineHeight: 1.4, marginBottom: 12 }}>
                        {a}띠 성격과 궁합
                    </h1>
                    <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.75, margin: 0, wordBreak: 'keep-all' }}>{profile.tagline}</p>
                </div>

                {/* 기본 정보 */}
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 20px', marginBottom: 22 }}>
                    {[
                        { k: '오행', v: `${ohhaeng} 기운` },
                        ...(samhap ? [{ k: '삼합', v: `${samhap.name} — ${samhap.members.filter((m) => m !== zhi).map((m) => `${ZHI_ANIMAL[m]}띠`).join('·')}와 한 팀` }] : []),
                        { k: '해당 연도', v: `${years.join(', ')}년생` },
                    ].map((row) => (
                        <div key={row.k} style={{ display: 'flex', gap: 12, padding: '7px 0', alignItems: 'flex-start' }}>
                            <span style={{ flexShrink: 0, width: 56, fontSize: 12, color: C.muted }}>{row.k}</span>
                            <span style={{ flex: 1, fontSize: 12.5, color: C.ink, lineHeight: 1.7, wordBreak: 'keep-all' }}>{row.v}</span>
                        </div>
                    ))}
                    <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.65, margin: '10px 0 0', paddingTop: 10, borderTop: `1px solid ${C.lineSoft}`, wordBreak: 'keep-all' }}>
                        띠는 양력 1월 1일이 아니라 입춘(2월 4일경)에 바뀌어요. 1~2월 초 출생이면 앞 띠일 수 있어요.
                    </p>
                </div>

                {/* 연애 성향 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>{a}띠는 연애할 때 이런 사람이에요</h2>
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 22 }}>
                    <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: '0 0 12px', wordBreak: 'keep-all' }}>{profile.loveStyle}</p>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: '0 0 14px', wordBreak: 'keep-all' }}>
                        <span style={{ color: C.her }}>약한 지점 —</span> {profile.weakness}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {profile.keywords.map((k) => (
                            <span key={k} style={{ fontSize: 11, color: C.sub, background: 'rgba(240,234,235,0.05)', border: `1px solid ${C.lineSoft}`, borderRadius: 999, padding: '4px 10px' }}>{k}</span>
                        ))}
                    </div>
                </div>

                {/* 궁합 순위 — 12띠 전체. 각 띠 궁합 페이지로 내부 링크가 뻗는다 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>{a}띠 궁합 순위</h2>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                    태어난 해만 본 약식 점수예요. 눌러서 조합별 자세한 풀이를 볼 수 있어요.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
                    {ranked.map((m, idx) => {
                        const [z1, z2] = canonicalOrder(zhi, m.zhi);
                        const isSelf = m.zhi === zhi;
                        return (
                            <Link key={m.zhi} href={`/hap/gunghap/${buildSlug(z1, z2)}`} style={{
                                display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                                background: idx < 3 ? C.accentSoft : C.card,
                                border: `1px solid ${idx < 3 ? C.accentBorder : C.cardBorder}`,
                                borderRadius: 11, padding: '11px 14px',
                            }}>
                                <span style={{ flexShrink: 0, width: 14, fontSize: 11, fontWeight: 800, color: idx < 3 ? C.accentBright : C.muted }}>{idx + 1}</span>
                                <span style={{ flex: 1, fontSize: 13, color: C.ink }}>
                                    {m.animal}띠{isSelf && <span style={{ fontSize: 11, color: C.muted }}> (같은 띠)</span>}
                                </span>
                                <span style={{ fontSize: 11.5, color: C.muted }}>{m.badge}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: idx < 3 ? C.accentBright : C.sub }}>{m.score}점</span>
                            </Link>
                        );
                    })}
                </div>

                {/* 요약 */}
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px', marginBottom: 22 }}>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: '0 0 8px', wordBreak: 'keep-all' }}>
                        <strong style={{ color: C.accentBright }}>잘 맞는 띠</strong> — {best.map((m) => `${m.animal}띠`).join(', ')}{samhapText}
                    </p>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
                        <strong style={{ color: C.her }}>조심할 띠</strong> — {worst.map((m) => `${m.animal}띠`).join(', ')}. 다만 낮은 점수가 안 된다는 뜻은 아니에요. 부딪히는 지점을 미리 알고 있으면 오히려 오래 가기도 해요.
                    </p>
                </div>

                {/* 남녀 조합 — 이 띠를 남자로 둘 때와 여자로 둘 때 각각 12개.
                    남녀 페이지 144개가 여기서 발견되도록 하는 유일하지 않은 입구를 만든다
                    (전에는 궁합 조합 페이지 안에만 링크가 있어 3단계 깊이에 묻혀 있었다). */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>남녀로 나눠서 보기</h2>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                    같은 두 띠라도 어느 쪽이 남자냐에 따라 누가 이끌고 누가 먼저 다가가는지가 달라져요.
                </p>
                <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: C.him, marginBottom: 8 }}>{a}띠 남자 × 여자 띠</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ZHI.map((f) => (
                            <Link key={`m-${f}`} href={`/hap/namnyeo/${buildGenderedSlug(zhi, f)}`} style={{
                                fontSize: 11.5, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                                borderRadius: 999, padding: '6px 11px', textDecoration: 'none',
                            }}>{ZHI_ANIMAL[f]}띠 여자</Link>
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: C.her, marginBottom: 8 }}>{a}띠 여자 × 남자 띠</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ZHI.map((m) => (
                            <Link key={`f-${m}`} href={`/hap/namnyeo/${buildGenderedSlug(m, zhi)}`} style={{
                                fontSize: 11.5, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                                borderRadius: 999, padding: '6px 11px', textDecoration: 'none',
                            }}>{ZHI_ANIMAL[m]}띠 남자</Link>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 26 }}>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                        같은 {a}띠라도 태어난 달·날짜·시간에 따라 궁합은 완전히 달라져요. 두 사람의 생년월일로 보는 정밀 궁합은 훨씬 구체적이에요.
                    </p>
                    <Link href="/hap/input" style={{
                        display: 'block', textAlign: 'center', background: C.btnBg, color: C.btnInk,
                        fontWeight: 700, fontSize: 14.5, padding: '15px 0', borderRadius: 12, textDecoration: 'none',
                    }}>
                        정확한 궁합 무료로 확인하기
                    </Link>
                    <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>가입 없이 바로 · 생년월일만 있으면 돼요</p>
                </div>

                {/* FAQ */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>자주 묻는 질문</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                    {faqs.map((f, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '15px 17px' }}>
                            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '0 0 7px', wordBreak: 'keep-all' }}>{f.q}</h3>
                            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{f.a}</p>
                        </div>
                    ))}
                </div>

                {/* 다른 띠 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>다른 띠도 보기</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {ZHI.filter((z) => z !== zhi).map((z) => (
                        <Link key={z} href={`/hap/ddi/${buildAnimalSlug(z)}`} style={{
                            fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                            borderRadius: 999, padding: '7px 13px', textDecoration: 'none',
                        }}>{ZHI_ANIMAL[z]}띠</Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
