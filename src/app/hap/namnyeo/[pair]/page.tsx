import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    parseGenderedSlug, buildGenderedSlug, getAllGenderedPairs, calculateGenderedGunghap,
    buildSlug, buildAnimalSlug, canonicalOrder,
} from "@/utils/ddiGunghap";
import { ZHI, ZHI_ANIMAL } from "@/utils/sajuMapper";

export function generateStaticParams() {
    return getAllGenderedPairs().map(({ maleZhi, femaleZhi }) => ({ pair: buildGenderedSlug(maleZhi, femaleZhi) }));
}

type Params = { pair: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { pair } = await params;
    const parsed = parseGenderedSlug(pair);
    if (!parsed) return {};
    const r = calculateGenderedGunghap(parsed.maleZhi, parsed.femaleZhi);
    const slug = buildGenderedSlug(parsed.maleZhi, parsed.femaleZhi);
    const title = `${r.maleAnimal}띠 남자 ${r.femaleAnimal}띠 여자 궁합 | 누가 이끄는 관계인지 - 묘연`;
    const description = `${r.maleAnimal}띠 남자와 ${r.femaleAnimal}띠 여자의 궁합. ${r.badge} · ${r.totalScore}점(${r.grade}등급). ${r.leadership}`;
    return {
        title,
        description,
        alternates: { canonical: `/hap/namnyeo/${slug}` },
        openGraph: { title, description, url: `https://dasisaju.com/hap/namnyeo/${slug}`, siteName: "운명의 합", locale: "ko_KR", type: "website" },
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

export default async function NamnyeoPage({ params }: { params: Promise<Params> }) {
    const { pair } = await params;
    const parsed = parseGenderedSlug(pair);
    if (!parsed) notFound();

    const { maleZhi, femaleZhi } = parsed;
    const r = calculateGenderedGunghap(maleZhi, femaleZhi);
    const [cz1, cz2] = canonicalOrder(maleZhi, femaleZhi);

    const faqs = [
        {
            q: `${r.maleAnimal}띠 남자와 ${r.femaleAnimal}띠 여자는 잘 맞나요?`,
            a: `${r.badge} — ${r.badgeDesc}. 태어난 해 기준 약식 궁합은 ${r.totalScore}점(${r.grade}등급)이에요. ${r.narrative}`,
        },
        {
            q: `${r.maleAnimal}띠 남자 ${r.femaleAnimal}띠 여자, 누가 주도하는 관계인가요?`,
            a: r.leadership,
        },
        {
            q: `누가 먼저 다가가게 되나요?`,
            a: r.approach,
        },
        {
            q: `${r.maleAnimal}띠 남자 ${r.femaleAnimal}띠 여자가 조심할 점은?`,
            a: r.genderedAdvice,
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
                    <span style={{ color: C.sub }}>{r.maleAnimal}띠 남자 {r.femaleAnimal}띠 여자</span>
                </nav>

                {/* 히어로 */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 5 }}>남자</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.him }}>{r.maleAnimal}띠</div>
                        </div>
                        <span style={{ fontSize: 14, color: C.sub }}>✕</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 5 }}>여자</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.her }}>{r.femaleAnimal}띠</div>
                        </div>
                    </div>
                    <h1 style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 900, lineHeight: 1.45, marginBottom: 14, wordBreak: 'keep-all' }}>
                        {r.maleAnimal}띠 남자 {r.femaleAnimal}띠 여자<br />궁합
                    </h1>
                    <span style={{
                        display: 'inline-flex', fontSize: 13, fontWeight: 700, color: C.accentBright,
                        background: C.accentSoft, border: `1px solid ${C.accentBorder}`, padding: '8px 18px', borderRadius: 999,
                    }}>{r.badge} · {r.totalScore}점</span>
                </div>

                {/* 주도권 — 이 페이지의 핵심. 남녀가 바뀌면 내용이 뒤집힌다 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>누가 이끄는 관계인가요</h2>
                <div style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 12 }}>
                    <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: 0, wordBreak: 'keep-all' }}>{r.leadership}</p>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 22 }}>
                    <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.accentBright, margin: '0 0 8px' }}>누가 먼저 다가가나요</h3>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.approach}</p>
                </div>

                {/* 서로를 어떻게 보는지 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>서로를 어떻게 볼까요</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px' }}>
                        <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.him, margin: '0 0 8px' }}>{r.maleAnimal}띠 남자가 보는 {r.femaleAnimal}띠 여자</h3>
                        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.maleView}</p>
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px' }}>
                        <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.her, margin: '0 0 8px' }}>{r.femaleAnimal}띠 여자가 보는 {r.maleAnimal}띠 남자</h3>
                        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.femaleView}</p>
                    </div>
                </div>

                {/* 고비 */}
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '16px 18px', marginBottom: 22 }}>
                    <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.her, margin: '0 0 8px' }}>이 조합의 고비</h3>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: '0 0 10px', wordBreak: 'keep-all' }}>{r.genderedAdvice}</p>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>{r.advice}</p>
                </div>

                {/* 성별 무관 종합으로 유도 */}
                <Link href={`/hap/gunghap/${buildSlug(cz1, cz2)}`} style={{
                    display: 'block', background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r,
                    padding: '15px 18px', marginBottom: 14, textDecoration: 'none',
                }}>
                    <p style={{ fontSize: 12.5, color: C.accentBright, margin: '0 0 4px', fontWeight: 700 }}>
                        {r.animal1}띠 {r.animal2}띠 궁합 종합 보기 →
                    </p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6, wordBreak: 'keep-all' }}>
                        합·충 구조와 오행 관계, 점수 근거를 자세히 볼 수 있어요.
                    </p>
                </Link>

                {/* CTA */}
                <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '18px 20px', marginBottom: 26 }}>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                        띠만으로는 여기까지예요. 두 사람의 생년월일을 넣으면 누가 먼저 마음을 여는지, 싸움의 원인이 뭔지까지 나와요.
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

                {/* 반대 배치 + 다른 조합 */}
                <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>이런 조합도 있어요</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    {maleZhi !== femaleZhi && (
                        <Link href={`/hap/namnyeo/${buildGenderedSlug(femaleZhi, maleZhi)}`} style={{
                            fontSize: 12, color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
                            borderRadius: 999, padding: '7px 13px', textDecoration: 'none',
                        }}>{r.femaleAnimal}띠 남자 {r.maleAnimal}띠 여자</Link>
                    )}
                    {ZHI.filter((z) => z !== femaleZhi).slice(0, 5).map((z) => (
                        <Link key={z} href={`/hap/namnyeo/${buildGenderedSlug(maleZhi, z)}`} style={{
                            fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                            borderRadius: 999, padding: '7px 13px', textDecoration: 'none',
                        }}>{r.maleAnimal}띠 남자 {ZHI_ANIMAL[z]}띠 여자</Link>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                    <Link href={`/hap/ddi/${buildAnimalSlug(maleZhi)}`} style={{ fontSize: 12.5, color: C.accentBright, textDecoration: 'none' }}>
                        {r.maleAnimal}띠 전체 보기 →
                    </Link>
                    <Link href={`/hap/ddi/${buildAnimalSlug(femaleZhi)}`} style={{ fontSize: 12.5, color: C.accentBright, textDecoration: 'none' }}>
                        {r.femaleAnimal}띠 전체 보기 →
                    </Link>
                </div>
            </div>
        </div>
    );
}
