import type { Metadata } from "next";
import Link from "next/link";
import { ZHI, ZHI_ANIMAL } from "@/utils/sajuMapper";
import { buildSlug, canonicalOrder } from "@/utils/ddiGunghap";

export const metadata: Metadata = {
    title: "띠 궁합 전체보기 | 12띠 궁합 사주 - 묘연",
    description: "쥐띠부터 돼지띠까지, 12띠 조합 궁합을 명리 계산으로 확인해보세요. 태어난 해만으로 보는 약식 궁합, 78가지 조합 전체.",
    alternates: { canonical: "/hap/gunghap" },
    openGraph: {
        title: "띠 궁합 전체보기 | 12띠 궁합 사주",
        description: "12띠 조합 궁합을 명리 계산으로 확인해보세요.",
        url: "https://dasisaju.com/hap/gunghap",
        siteName: "운명의 합",
        locale: "ko_KR",
        type: "website",
    },
};

const C = {
    accent: '#C9A15C', accentBright: '#E8CF9C', accentSoft: 'rgba(201,161,92,0.10)', accentBorder: 'rgba(201,161,92,0.32)',
    ink: '#F0EAEB', sub: '#9C9199', muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)', cardBorder: 'rgba(240,234,235,0.13)', lineSoft: 'rgba(240,234,235,0.07)',
    serif: "'Noto Serif KR', serif",
};

export default function GunghapHubPage() {
    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 20px 100px' }}>
                <nav style={{ fontSize: 11.5, color: C.muted, marginBottom: 20 }}>
                    <Link href="/hap" style={{ color: C.muted, textDecoration: 'none' }}>운명의 합</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: C.sub }}>띠 궁합</span>
                </nav>

                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.3em', color: C.accentBright, marginBottom: 20 }}>12띠 궁합 전체보기</p>
                    <h1 style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 900, lineHeight: 1.4, marginBottom: 14, wordBreak: 'keep-all' }}>
                        내 띠와 그 사람 띠,<br />궁합이 궁금하다면
                    </h1>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.75, wordBreak: 'keep-all' }}>
                        태어난 해(띠)만으로 보는 약식 궁합이에요.<br />
                        더 정확한 궁합은 생년월일 전체로 확인할 수 있어요.
                    </p>
                </div>

                {ZHI.map((baseZhi, i) => (
                    <div key={baseZhi} style={{ marginBottom: 22 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.accentBright, marginBottom: 10 }}>{ZHI_ANIMAL[baseZhi]}띠 궁합</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {ZHI.map((otherZhi) => {
                                const [z1, z2] = canonicalOrder(baseZhi, otherZhi);
                                return (
                                    <Link key={otherZhi} href={`/hap/gunghap/${buildSlug(z1, z2)}`} style={{
                                        fontSize: 12, color: C.sub, background: C.card, border: `1px solid ${C.cardBorder}`,
                                        borderRadius: 999, padding: '6px 12px', textDecoration: 'none',
                                    }}>{ZHI_ANIMAL[otherZhi]}띠</Link>
                                );
                            })}
                        </div>
                        {i < ZHI.length - 1 && <div style={{ borderTop: `1px solid ${C.lineSoft}`, marginTop: 22 }} />}
                    </div>
                ))}

                <Link href="/hap/input" style={{
                    display: 'block', textAlign: 'center', marginTop: 10,
                    background: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)', color: '#241C0C',
                    fontWeight: 700, fontSize: 15, padding: '17px 0', borderRadius: 16, textDecoration: 'none',
                }}>
                    정확한 궁합 무료로 확인하기
                </Link>
            </div>
        </div>
    );
}
