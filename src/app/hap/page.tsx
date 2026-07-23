import Link from "next/link";
// 메타데이터는 layout.tsx에서 라우트 그룹 전체에 적용 (OG/트위터 카드 포함)

// 운명의 합 — '인장과 금박' 팔레트. 다시,우리(로즈)·오드 타로(퍼플)와
// 겹치지 않는 세 번째 색군: 유채색을 빼고 먹빛 인장 + 금박만 남긴 방향.
const C = {
    bg: '#0A090C',
    accent: '#C9A15C',
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE',
    her: '#D9B872',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
    btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif",
    r: 16,
};

const PARTS = [
    { num: 'PART 1', title: '첫 만남의 설계도', benefit: '왜 유독 이 사람에게 끌렸는지 알면, 지금의 관계를 더 아낄 수 있어요', desc: '첫인상 · 궁합 총점 6항목 · 서로 끌리는 이유 · 사랑의 온도 차이 · 전생 인연' },
    { num: 'PART 2', title: '연애의 실전', benefit: '다투는 이유를 알면, 같은 싸움을 반복하지 않을 수 있어요', desc: '누가 먼저 마음을 열까 · 싸움의 원인 3가지 · 권태기 · 이별 위험 신호 · 스킨십 리듬' },
    { num: 'PART 3', title: '함께 만드는 생활', benefit: '돈 문제로, 미래 계획으로 삐걱대기 전에 서로의 결을 맞춰보세요', desc: '재물운 구조 · 경제권 · 함께하면 잘 맞는 사업 · 자녀운 · 노년의 풍경' },
    { num: 'FINAL', title: '최종 판정', benefit: '결국 우리, 얼마나 잘 맞는 사이인지 — 등급으로 명확하게 확인하세요', desc: '결혼 적기 · 서로의 운을 높여줄 가능성 · 피해야 할 행동 · 궁합 등급표 · 역술가 최종 총평' },
];

const STEPS = [
    { n: '1', title: '생년월일 입력', desc: '두 사람의 이름과 생년월일만 있으면 충분해요 (1분)' },
    { n: '2', title: '무료로 궁합 점수 먼저 확인', desc: '끌림·갈등 지수를 결제 없이 바로 볼 수 있어요' },
    { n: '3', title: '마음에 들면 전체 리포트 받기', desc: '19,900원 결제 후 1~2분 안에 완성돼요' },
];

export default function HapLandingPage() {
    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 120px' }}>

                {/* 히어로 */}
                <div style={{ textAlign: 'center', paddingTop: 68, paddingBottom: 30 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.3em', color: C.accentBright, marginBottom: 26 }}>운명의 합 · 궁합 리포트</p>

                    {/* 인장 */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 26 }}>
                        <div style={{ width: 58, height: 58, border: `2.5px solid ${C.him}`, color: C.him, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 24, fontWeight: 900, transform: 'rotate(-4deg)', boxShadow: '0 0 18px rgba(184,180,190,0.18)' }}>合</div>
                        <span style={{ fontSize: 15, color: C.sub }}>✕</span>
                        <div style={{ width: 58, height: 58, border: `2.5px solid ${C.her}`, color: C.her, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 24, fontWeight: 900, transform: 'rotate(4deg)', boxShadow: '0 0 18px rgba(217,184,114,0.25)' }}>緣</div>
                    </div>

                    <h1 style={{ fontFamily: C.serif, fontSize: 30, fontWeight: 900, lineHeight: 1.35, marginBottom: 14, wordBreak: 'keep-all' }}>
                        우리는,<br />운명의 합일까?
                    </h1>
                    <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, wordBreak: 'keep-all' }}>
                        두 사람의 사주가 만나면 어떤 관계가 되는지 —<br />
                        첫 만남부터 노년까지, 궁합의 모든 장면을 읽어드립니다.
                    </p>
                </div>

                {/* 공감 — 지금 이 페이지에 온 이유 */}
                <div style={{ marginTop: 12, marginBottom: 6 }}>
                    <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 2, margin: 0, wordBreak: 'keep-all' }}>
                        썸 탈 땐 설렘 반, 불안 반이죠.<br />
                        <span style={{ color: C.ink }}>&lsquo;이 사람, 나한테 왜 이렇게 잘해주지&rsquo;</span> 싶다가도<br />
                        문득 <span style={{ color: C.ink }}>&lsquo;이게 진짜 잘 맞는 걸까&rsquo;</span> 하는 생각이 스쳐요.
                    </p>
                    <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 2, marginTop: 16, wordBreak: 'keep-all' }}>
                        연애가 길어지고, 결혼 얘기가 나올수록<br />
                        그 질문은 자꾸 커지는데 — 답은 두 사람 안에만 있어서,<br />
                        확인할 방법이 없어 그냥 넘기곤 하죠.
                    </p>
                </div>

                {/* 4파트 구성 */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginTop: 34, marginBottom: 12 }}>그 답을 4개의 장으로 읽어드립니다</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {PARTS.map((p) => (
                        <div key={p.num} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '18px 20px' }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.2em', color: C.accentBright, marginBottom: 6 }}>{p.num}</p>
                            <h3 style={{ fontFamily: C.serif, fontSize: 16.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>{p.title}</h3>
                            <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: '0 0 9px', wordBreak: 'keep-all' }}>{p.benefit}</p>
                            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>{p.desc}</p>
                        </div>
                    ))}
                </div>

                {/* 진행 방식 */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginTop: 34, marginBottom: 12 }}>이렇게 진행돼요</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {STEPS.map((s, i) => (
                        <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '10px 2px' }}>
                            <span style={{
                                flexShrink: 0, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11.5, fontWeight: 800, color: C.accentBright, border: `1.5px solid ${C.accentBorder}`, background: C.accentSoft,
                            }}>{s.n}</span>
                            <div>
                                <p style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '0 0 3px' }}>{s.title}</p>
                                <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6, wordBreak: 'keep-all' }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 신뢰 요소 */}
                <div style={{ marginTop: 22, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
                        점수와 등급은 즉흥적인 해석이 아니라, <strong style={{ color: C.accentBright }}>만세력 계산 엔진</strong>이 두 사주의 합·충·오행 구조를 직접 계산해 확정합니다. 같은 두 사람이면 언제 봐도 같은 궁합이 나와요.
                    </p>
                    <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
                        가입 없이, 이메일 하나로 시작할 수 있어요. 결과는 <strong style={{ color: C.accentBright }}>링크를 아는 사람만</strong> 볼 수 있습니다.
                    </p>
                </div>

                {/* 가격 */}
                <div style={{ marginTop: 26, background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: C.accentBright, marginBottom: 6 }}>PREMIUM 궁합 리포트</p>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>4파트 전체 리포트</h3>
                        </div>
                        <span style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 700, color: C.accentBright }}>19,900원</span>
                    </div>
                    {['궁합 총점 6항목 + 종합 등급표', '남녀 시선을 나눈 비교 분석 카드', '싸움 원인 · 이별 위험 신호 · 화해 공식', '재물·사업·자녀·노년까지 생애 전체', '역술가 총평과 마지막 한 문장'].map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12.5, color: C.sub, padding: '4px 0' }}>
                            <span style={{ color: C.accentBright, fontWeight: 700 }}>✓</span> {f}
                        </div>
                    ))}
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 10, marginBottom: 0 }}>무료 미리보기로 끌림·갈등 지수를 먼저 확인한 뒤 결제할 수 있어요</p>
                </div>

                {/* CTA */}
                <Link href="/hap/input" style={{
                    display: 'block', textAlign: 'center', marginTop: 24,
                    background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15,
                    padding: '17px 0', borderRadius: C.r, textDecoration: 'none',
                    boxShadow: '0 6px 30px rgba(140,106,50,0.28)',
                }}>
                    무료로 궁합 미리보기
                </Link>
                <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 10 }}>가입 없이 바로 · 생년월일만 있으면 돼요</p>

                <p style={{ marginTop: 44, fontSize: 11, color: C.muted, textAlign: 'center', opacity: 0.7 }}>운명의 합 · 전통 명리학적 해석을 바탕으로 한 참고 자료입니다</p>
            </div>
        </div>
    );
}
