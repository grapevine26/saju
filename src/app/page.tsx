'use client';

/**
 * 묘연 妙緣 — 통합 허브 랜딩
 * 재회 사주(다시, 우리) · 연애 타로(ODD TAROT)
 * 작명소(윤명)는 /yunmyeong 독립 랜딩으로만 운영 (재회 전문 브랜딩 유지)
 */
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';

/* 뷰포트 전체(양옆 포함)에 칠하는 허브 테마 배경 */
const HUB_BG = `
    radial-gradient(ellipse 55% 34% at 50% -6%, rgba(120,86,196,0.13) 0%, transparent 70%),
    radial-gradient(ellipse 36% 30% at 8% 40%, rgba(216,72,94,0.07) 0%, transparent 70%),
    radial-gradient(ellipse 36% 30% at 92% 76%, rgba(212,168,83,0.06) 0%, transparent 70%),
    #0A0910`;

const C = {
    bg: '#0A0910',
    ink: '#EDE9F0',
    sub: '#A29AAC',
    muted: '#5E5766',
    line: 'rgba(237,233,240,0.10)',
    lineSoft: 'rgba(237,233,240,0.06)',
    serif: "'Noto Serif KR', serif",
};

/* ── 서비스 카드 데이터 ── */
const SERVICES = [
    {
        href: '/saju',
        label: '재회 사주',
        name: '다시, 우리',
        nameSub: 'Reconnection',
        hook: '그 사람과 다시 만날 수 있을까.\n사주 데이터로 재회 확률과 골든 타이밍을 진단합니다.',
        chips: ['재회 가능성 진단', '골든 윈도우', '1:1 궁합'],
        badge: null as string | null,
        accent: '#F06A7E',
        accentSoft: 'rgba(240,106,126,0.10)',
        border: 'rgba(240,106,126,0.26)',
        glow: 'rgba(216,72,94,0.16)',
        cardBg: 'linear-gradient(150deg, rgba(46,17,24,0.75) 0%, rgba(16,10,13,0.85) 60%)',
        visual: 'heart' as const,
    },
    {
        href: '/tarot',
        label: '연애 타로',
        name: '오드 타로',
        nameSub: 'ODD TAROT',
        hook: '말하지 않는 그 사람의 속마음,\n7장의 카드가 대신 답합니다.',
        chips: ['지금 그 사람의 마음', '앞날의 흐름', '궁합 온도'],
        badge: '첫 리딩 무료',
        accent: '#B07BB4',
        accentSoft: 'rgba(176,123,180,0.12)',
        border: 'rgba(176,123,180,0.30)',
        glow: 'rgba(120,86,196,0.18)',
        cardBg: 'linear-gradient(150deg, rgba(30,26,66,0.80) 0%, rgba(13,11,22,0.85) 60%)',
        visual: 'cards' as const,
    },
    {
        href: '/hap',
        label: '궁합 리포트',
        name: '운명의 합',
        nameSub: 'Destined Match',
        hook: '우리는 타고나기를 맞는 사이일까.\n첫인상부터 결혼, 노년까지 — 두 사주의 합을 판정합니다.',
        chips: ['궁합 총점 6항목', '싸움의 원인', '결혼 적기'],
        badge: '무료 미리보기' as string | null,
        accent: '#F08A5E',
        accentSoft: 'rgba(240,138,94,0.10)',
        border: 'rgba(240,138,94,0.28)',
        glow: 'rgba(216,110,72,0.16)',
        cardBg: 'linear-gradient(150deg, rgba(46,28,17,0.75) 0%, rgba(16,12,10,0.85) 60%)',
        visual: 'seal' as const,
    },
];

/* ── 카드 미니 비주얼 ── */
function CardVisual({ type, accent }: { type: 'heart' | 'cards' | 'seal'; accent: string }) {
    if (type === 'seal') {
        return (
            <div style={{ position: 'relative', width: 74, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{
                    width: 38, height: 38, border: `2px solid ${accent}`, color: accent, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 900,
                    transform: 'rotate(-6deg)', boxShadow: `0 0 14px rgba(216,72,94,0.25)`,
                }}>合</div>
                <div style={{
                    width: 38, height: 38, border: '2px solid #7FB5A0', color: '#7FB5A0', borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 900,
                    transform: 'rotate(6deg)', marginLeft: -10, marginTop: 10,
                    boxShadow: '0 0 14px rgba(127,181,160,0.22)',
                }}>緣</div>
            </div>
        );
    }
    if (type === 'heart') {
        return (
            <div style={{
                width: 62, height: 62, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,106,126,0.20) 0%, rgba(240,106,126,0.04) 70%)',
                border: '1px solid rgba(240,106,126,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Heart size={26} color={accent} fill="rgba(240,106,126,0.35)" />
            </div>
        );
    }
    return (
        <div style={{ position: 'relative', width: 74, height: 62 }}>
            {[-18, 0, 18].map((deg, i) => (
                <div key={i} style={{
                    position: 'absolute', left: '50%', bottom: 0,
                    width: 32, height: 47, borderRadius: 6,
                    transform: `translateX(calc(-50% + ${(i - 1) * 19}px)) rotate(${deg}deg) translateY(${i === 1 ? -5 : 2}px)`,
                    transformOrigin: 'bottom center',
                    background: 'linear-gradient(160deg, #241A4E 0%, #3D2C6D 100%)',
                    border: '1px solid rgba(176,123,180,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                    zIndex: i === 1 ? 2 : 1,
                }}>
                    <span style={{ fontSize: 11, color: accent, opacity: 0.9 }}>✦</span>
                </div>
            ))}
        </div>
    );
}

/* ── 히어로 반짝이 ── */
function Sparkle({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
    return (
        <motion.span
            animate={{ opacity: [0.15, 0.85, 0.15], scale: [0.85, 1.1, 0.85] }}
            transition={{ repeat: Infinity, duration: 3.4, delay, ease: 'easeInOut' }}
            style={{
                position: 'absolute', left: x, top: y, fontSize: size,
                color: '#CBB8D8', pointerEvents: 'none', lineHeight: 1,
            }}
        >✦</motion.span>
    );
}

export default function HubPage() {
    // 루트 레이아웃의 붉은 사주 배경을 허브 테마로 교체 (양옆 여백까지 통일, 이탈 시 복원)
    useEffect(() => {
        const body = document.body;
        const main = document.querySelector('main');
        const prevBodyBg = body.style.background;
        const prevMainBg = main?.style.background ?? '';

        body.style.background = HUB_BG;
        if (main) main.style.background = 'transparent';

        return () => {
            body.style.background = prevBodyBg;
            if (main) main.style.background = prevMainBg;
        };
    }, []);

    // OAuth 복귀가 홈으로 떨어진 경우 결제 펜딩 세션 복원 (사주 랜딩과 동일한 안전망)
    useEffect(() => {
        const pendingPayment = localStorage.getItem('pendingOAuthPayment');
        if (!pendingPayment) return;
        try {
            const data = JSON.parse(pendingPayment);
            if (data.returnPath && data.returnPath !== '/' && (Date.now() - data.timestamp < 10 * 60 * 1000)) {
                window.location.href = data.returnPath;
            } else if (Date.now() - data.timestamp >= 10 * 60 * 1000) {
                localStorage.removeItem('pendingOAuthPayment');
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    return (
        <div style={{
            minHeight: '100dvh',
            color: C.ink,
            fontFamily: 'Pretendard, -apple-system, sans-serif',
            background: 'transparent',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* ── 히어로 ── */}
            <header style={{ position: 'relative', padding: '64px 24px 40px', textAlign: 'center' }}>
                <Sparkle x="14%" y="34px" size={11} delay={0} />
                <Sparkle x="82%" y="58px" size={9} delay={1.2} />
                <Sparkle x="68%" y="22px" size={7} delay={2.1} />
                <Sparkle x="26%" y="96px" size={7} delay={0.7} />

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                    style={{ fontSize: 11, letterSpacing: '0.42em', color: C.muted, fontWeight: 600, marginBottom: 18 }}
                >
                    MYOYEON
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                    style={{ fontFamily: C.serif, fontSize: 40, fontWeight: 900, letterSpacing: '0.06em', margin: 0, lineHeight: 1 }}
                >
                    <span style={{
                        background: 'linear-gradient(135deg, #E8DCF2 10%, #B07BB4 55%, #D4A853 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>묘연</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: C.muted, marginLeft: 10, letterSpacing: '0.2em' }}>妙緣</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.22 }}
                    style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.7, margin: '26px 0 0' }}
                >
                    닿을 듯 닿지 않는,<br />묘한 인연의 실마리를 읽습니다
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.38 }}
                    style={{ fontSize: 13, color: C.sub, marginTop: 12, lineHeight: 1.7 }}
                >
                    사주와 타로, 두 가지 길 중<br />지금 당신에게 필요한 하나를 고르세요
                </motion.p>
            </header>

            {/* ── 서비스 카드 ── */}
            <main style={{ padding: '4px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {SERVICES.map((s, i) => (
                    <motion.div
                        key={s.href}
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.45 + i * 0.13 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link href={s.href} style={{ textDecoration: 'none', display: 'block' }}>
                            <div style={{
                                position: 'relative', overflow: 'hidden',
                                borderRadius: 20, padding: '22px 20px 20px',
                                background: s.cardBg,
                                border: `1px solid ${s.border}`,
                                backdropFilter: 'blur(8px)',
                            }}>
                                {/* 코너 글로우 */}
                                <div style={{
                                    position: 'absolute', top: -50, right: -40, width: 190, height: 170,
                                    background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)`,
                                    pointerEvents: 'none',
                                }} />

                                {/* 상단: 라벨 + 배지 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                                        color: s.accent, background: s.accentSoft,
                                        border: `1px solid ${s.border}`,
                                        padding: '3.5px 10px', borderRadius: 999,
                                    }}>{s.label}</span>
                                    {s.badge && (
                                        <span style={{
                                            fontSize: 10.5, fontWeight: 700,
                                            color: '#0A0910', background: 'linear-gradient(135deg, #E8CF9C, #D4A853)',
                                            padding: '3.5px 9px', borderRadius: 999,
                                        }}>{s.badge}</span>
                                    )}
                                </div>

                                {/* 본문 + 비주얼 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <h2 style={{
                                            fontFamily: C.serif, fontSize: 21, fontWeight: 900,
                                            color: C.ink, margin: 0, lineHeight: 1.3, letterSpacing: '0.01em',
                                        }}>
                                            {s.name}
                                            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginLeft: 8, fontFamily: 'Pretendard, sans-serif', letterSpacing: 0 }}>
                                                {s.nameSub}
                                            </span>
                                        </h2>
                                        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, margin: '9px 0 0', whiteSpace: 'pre-line' }}>
                                            {s.hook}
                                        </p>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        <CardVisual type={s.visual} accent={s.accent} />
                                    </div>
                                </div>

                                {/* 하단: 키워드 + 화살표 */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: 16, paddingTop: 13, borderTop: `1px solid ${C.lineSoft}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {s.chips.map((chip, ci) => (
                                            <span key={chip} style={{ fontSize: 11.5, color: C.sub, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {ci > 0 && <span style={{ color: s.accent, fontSize: 7, opacity: 0.7 }}>◆</span>}
                                                {chip}
                                            </span>
                                        ))}
                                    </div>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        background: s.accentSoft, border: `1px solid ${s.border}`,
                                    }}>
                                        <ArrowRight size={14} color={s.accent} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </main>

            {/* ── 신뢰 스트립 ── */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }}
                style={{
                    display: 'flex', justifyContent: 'center', gap: 18,
                    padding: '22px 20px 6px', flexWrap: 'wrap',
                }}
            >
                {['가입 없이 바로 시작', '무료로 보고 결제 결정', '토스페이먼츠 안전 결제'].map((t) => (
                    <span key={t} style={{ fontSize: 11.5, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#B07BB4', fontSize: 9, opacity: 0.8 }}>✦</span>
                        {t}
                    </span>
                ))}
            </motion.div>

            {/* ── 푸터 ── */}
            <footer style={{ marginTop: 'auto', padding: '30px 24px 34px', borderTop: `1px solid ${C.lineSoft}`, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12, marginBottom: 18 }}>
                    <Link href="/legal/terms" style={{ color: C.sub, textDecoration: 'none' }}>이용약관</Link>
                    <span style={{ color: C.muted }}>|</span>
                    <Link href="/legal/privacy" style={{ color: C.sub, textDecoration: 'none' }}>개인정보처리방침</Link>
                    <span style={{ color: C.muted }}>|</span>
                    <Link href="/legal/refund" style={{ color: C.sub, textDecoration: 'none' }}>환불정책</Link>
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
                    <p style={{ fontWeight: 700, color: C.sub, margin: '0 0 6px' }}>묘연 妙緣</p>
                    <p style={{ margin: 0 }}>상호명 : 인사이트랩 | 대표자 : 최혁준</p>
                    <p style={{ margin: 0 }}>사업자등록번호 : 207-30-92414</p>
                    <p style={{ margin: 0 }}>통신판매업신고번호 : 제 2026-서울관악-0869호</p>
                    <p style={{ margin: 0 }}>이메일 : support@dasisaju.com | 전화 : 070-8098-4109</p>
                    <p style={{ margin: 0 }}>주소 : 서울특별시 관악구 난곡로 284, 603호</p>
                    <p style={{ margin: 0 }}>호스팅 서비스 제공자 : Vercel Inc.</p>
                    <p style={{ margin: '10px 0 0', opacity: 0.7 }}>© 2026 인사이트랩. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
