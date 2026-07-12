'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu as MenuIcon } from 'lucide-react';
import { MD_MODES } from '@/features/naming/yunmyeong';
import { loadNamingHistory } from '@/features/naming/history';
import MdShell from '@/components/naming/yunmyeong/MdShell';
import { LockGlyph } from '@/components/naming/yunmyeong/MdHook';

// ─────────────────────────────────────────────
// 윤명(潤名) — 랜딩 (모드 선택 진입 · hanji 테마)
// 구성: 히어로 → 모드 카드 → 신뢰 스트립 → 리포트 미리보기(목업)
//       → 왜 윤명인가 → 진행 방식(무료 강조) → FAQ → 클로징 CTA → 푸터
// 카피 원칙: 미신·무속 어휘 금지, 'AI' 언급 금지, '인증' 대신 '증서'.
// 유료 가격은 의도적으로 미노출 (무료 진단 강조는 허용).
// ─────────────────────────────────────────────

const TRUST_STRIP: Array<[string, string]> = [
    ['원형이정', '정통 수리 4격 연산'],
    ['8,142자', '대법원 인명용 한자'],
    ['PDF', '평생 소장 명명증서'],
];

const PROCESS_STEPS: Array<[string, string]> = [
    ['사주 명식 입력', '생년월일과 태어난 시간만 있으면 충분합니다'],
    ['오행 결핍 무료 진단', '명식의 과다 · 결핍을 그래프로 확인하세요'],
    ['처방 이름 리포트', '수리 4격 길격 이름과 한자 풀이를 받아보세요'],
];

/** 왜 윤명인가 — 방법론 3원칙 */
const PRINCIPLES: Array<{ glyph: string; title: string; desc: string }> = [
    {
        glyph: '規', title: '연산은 규칙이 합니다',
        desc: '수리·오행 계산은 사람의 감이 아닌 검증된 규칙 엔진이 수행합니다. 같은 사주에는 언제나 같은 결과가 나옵니다.',
    },
    {
        glyph: '格', title: '네 격이 전부 길격인 이름만',
        desc: '원격·형격·이격·정격 — 수리 4격 중 하나라도 흉수가 섞이면 그 이름은 후보에서 제외합니다.',
    },
    {
        glyph: '行', title: '결핍을 채우는 자원오행',
        desc: '명식에서 비어 있는 오행을 한자의 뿌리 기운으로 보완하는 정통 작명 원칙을 따릅니다.',
    },
];

/** FAQ — 망설임을 넘기는 이의 처리 */
const FAQ_ITEMS: Array<[string, string]> = [
    [
        '한자는 어떻게 정해지나요?',
        '대법원 인명용 한자 범위 안에서, 성명학 원획법 획수와 자원오행을 함께 만족하는 글자만 사용합니다. 글자별 뜻풀이와 획수가 리포트에 함께 담깁니다.',
    ],
    [
        '수리 4격이 무엇인가요?',
        '성씨와 이름 한자의 획수를 조합하여 인생의 네 가지 시기별 운을 나타내는 정통 성명학 공식입니다. 유년기의 원격(元格), 청·장년기의 주운인 형격(亨格), 중년운의 이격(利格), 말년운과 평생의 총운인 정격(貞格)으로 나뉩니다. 윤명은 이 네 가지 격이 모두 길(吉) 또는 대길(大吉)이 되도록 완벽한 획수 조합으로만 이름을 짓습니다.',
    ],
    [
        '출생 시간을 모르면 분석이 안 되나요?',
        '가능합니다. 시주(時柱)를 제외한 연·월·일 여섯 글자로 분석하며, 시간을 알면 명식 정확도가 더 올라갑니다.',
    ],
    [
        '같은 정보를 넣으면 결과가 달라지나요?',
        '아니요. 연산이 규칙 기반이라 같은 사주, 같은 조건에는 항상 같은 이름 후보가 나옵니다. 해설 문장만 의뢰마다 새로 집필됩니다.',
    ],
    [
        '개명과 감명은 무엇이 다른가요?',
        '감명은 지금 이름이 사주에 맞는지 "판정"하는 검증 서비스이고, 개명은 현재 이름 진단에 더해 보완 이름 10선을 "처방"하는 서비스입니다.',
    ],
    [
        '리포트는 어떻게 소장하나요?',
        '결과 화면 하단의 PDF 저장 버튼으로 언제든 내려받을 수 있습니다. 발급된 리포트 링크는 본인만 열람 가능합니다.',
    ],
];

/* ---------- 리포트 미리보기 페이지 공통 셸 ---------- */
function PreviewPage({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="md-card" style={{
            width: 272, flexShrink: 0, scrollSnapAlign: 'center',
            padding: '20px 18px 16px', background: 'var(--md-bg-raise)',
            display: 'flex', flexDirection: 'column',
        }}>
            <div className="md-serif" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--md-accent)', textAlign: 'center', marginBottom: 6 }}>潤名 REPORT</div>
            <div className="md-serif" style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'center' }}>{title}</div>
            <div style={{ borderBottom: '1px dashed var(--md-line-strong)', margin: '12px 0' }}></div>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    );
}

/* ---------- 리포트 미리보기 캐러셀 (옆으로 넘기는 3페이지) ---------- */
const PREVIEW_PAGE_COUNT = 3;

function ReportPreview() {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(0);

    /** i번째 페이지가 가운데 오도록 스크롤 (데스크톱 화살표/점 클릭용) */
    const scrollToPage = (i: number) => {
        const el = scrollerRef.current;
        if (!el) return;
        const clamped = Math.max(0, Math.min(PREVIEW_PAGE_COUNT - 1, i));
        const card = el.children[clamped] as HTMLElement | undefined;
        if (!card) return;
        el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
    };

    /** 스와이프/스크롤 시 가운데에 가장 가까운 페이지를 활성 점으로 표시 */
    const onScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        const center = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        Array.from(el.children).forEach((c, i) => {
            const card = c as HTMLElement;
            const d = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        setPage(best);
    };

    const fakePillars: Array<[string, string]> = [['시주', '庚申'], ['일주', '戊子'], ['월주', '戊子'], ['연주', '乙亥']];
    const fakeBars: Array<[string, number, boolean]> = [['木', 32, false], ['火', 8, true], ['土', 58, false], ['金', 72, false], ['水', 96, false]];
    const fakeNames = [
        ['01', '서윤', '瑞潤', '98'],
        ['02', '도현', '道鉉', '96'],
        ['03', '하준', '河埈', '95'],
    ];
    const fakeSuri: Array<[string, string, string]> = [
        ['원격(元格)', '23수', '대길'],
        ['형격(亨格)', '21수', '대길'],
        ['이격(利格)', '16수', '길'],
        ['정격(貞格)', '32수', '길'],
    ];
    const fakeLines = [94, 88, 72, 91, 60];

    return (
        <div aria-hidden="true">
            {/* 스크롤 스냅 캐러셀 — 다음 장이 살짝 보이게 (모바일: 스와이프 / 데스크톱: 화살표) */}
            <div ref={scrollerRef} onScroll={onScroll} style={{
                position: 'relative',
                display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory',
                padding: '8px 36px 12px', margin: '0 -24px',
            }}>
                {/* 1장 · 오행 정밀 진단 */}
                <PreviewPage title="오행 정밀 진단">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--md-line)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                        {fakePillars.map(([label, hanja], i) => (
                            <div key={label} style={{ padding: '8px 2px', textAlign: 'center', borderLeft: i ? '1px solid var(--md-line)' : 'none', background: label === '일주' ? 'var(--md-accent-soft)' : 'transparent' }}>
                                <div style={{ fontSize: 8, letterSpacing: '0.12em', color: 'var(--md-text-3)', marginBottom: 4 }}>{label}</div>
                                <div className="md-serif" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{hanja[0]}<br />{hanja[1]}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {fakeBars.map(([el, pct, lack]) => (
                            <div key={el} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', alignItems: 'center', gap: 8 }}>
                                <span className="md-serif" style={{ fontSize: 12, fontWeight: 600, color: lack ? 'var(--md-danger)' : 'var(--md-text)' }}>{el}</span>
                                <div style={{ height: 6, borderRadius: 3, background: 'var(--md-accent-soft)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: lack ? 'var(--md-danger)' : 'var(--md-chart-stroke)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--md-line)', paddingTop: 10 }}>
                        <span style={{ fontSize: 10, color: 'var(--md-text-3)' }}>오행 균형도</span>
                        <span className="md-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--md-danger)' }}>38<span style={{ fontSize: 9, color: 'var(--md-text-3)', fontWeight: 500 }}> / 100</span></span>
                    </div>
                </PreviewPage>

                {/* 2장 · 명명증서 (이름 10선) */}
                <PreviewPage title="명명증서 命名證書">
                    <div className="md-locked" style={{ display: 'grid', gap: 7 }}>
                        {fakeNames.map(([rank, name, hanja, score]) => (
                            <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--md-line)', borderRadius: 10, padding: '8px 12px' }}>
                                <span className="md-serif" style={{ fontSize: 11, color: 'var(--md-accent)', fontWeight: 700 }}>{rank}</span>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 7 }}>
                                    <strong className="md-serif" style={{ fontSize: 14, fontWeight: 700 }}>{name}</strong>
                                    <span className="md-serif" style={{ fontSize: 11, color: 'var(--md-text-2)' }}>{hanja}</span>
                                </div>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--md-accent)' }}>{score}점</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
                        {fakeSuri.map(([label, num, grade]) => (
                            <div key={label} style={{ border: '1px solid var(--md-line)', borderRadius: 8, padding: '6px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 9, fontWeight: 700 }}>{label}</span>
                                <span style={{ fontSize: 9, color: 'var(--md-text-3)' }}>{num} · <strong style={{ color: grade === '대길' ? 'var(--md-accent)' : 'var(--md-good)' }}>{grade}</strong></span>
                            </div>
                        ))}
                    </div>
                </PreviewPage>

                {/* 3장 · 글자별 한자 풀이 + 해설 */}
                <PreviewPage title="글자별 한자 풀이">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
                        {[['瑞', '상서 서'], ['潤', '윤택할 윤']].map(([char, read]) => (
                            <div key={char} style={{ border: '1px solid var(--md-line)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                                <div className="md-serif" style={{ fontSize: 26, fontWeight: 600 }}>{char}</div>
                                <div style={{ fontSize: 9.5, color: 'var(--md-text-2)', marginTop: 4 }}>{read}</div>
                                <div className="md-locked" style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                                    <div style={{ height: 4, width: '90%', margin: '0 auto', borderRadius: 2, background: 'var(--md-line-strong)' }}></div>
                                    <div style={{ height: 4, width: '70%', margin: '0 auto', borderRadius: 2, background: 'var(--md-line)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--md-accent)', marginBottom: 8 }}>명식 맞춤 해설</div>
                    <div className="md-locked" style={{ display: 'grid', gap: 6 }}>
                        {fakeLines.map((w, i) => (
                            <div key={i} style={{ height: 5, width: `${w}%`, borderRadius: 3, background: i % 2 ? 'var(--md-line)' : 'var(--md-line-strong)' }}></div>
                        ))}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--md-line)', borderRadius: 10, padding: '8px 12px' }}>
                        <span className="md-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--md-accent)' }}>壹</span>
                        <span style={{ fontSize: 10, color: 'var(--md-text-2)' }}>최우선 추천 이름과 선정 사유 수록</span>
                    </div>
                </PreviewPage>
            </div>

            {/* 페이지 컨트롤: ‹ 점 점 점 › */}
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <button onClick={() => scrollToPage(page - 1)} aria-label="이전 페이지" disabled={page === 0}
                    style={{
                        width: 32, height: 32, borderRadius: 10, border: '1px solid var(--md-line)',
                        background: 'var(--md-surface)', color: 'var(--md-text-2)', fontSize: 15, cursor: 'pointer',
                        opacity: page === 0 ? 0.35 : 1,
                    }}>‹</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Array.from({ length: PREVIEW_PAGE_COUNT }).map((_, i) => (
                        <button key={i} onClick={() => scrollToPage(i)} aria-label={`${i + 1}번째 페이지`}
                            style={{
                                width: page === i ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                                background: page === i ? 'var(--md-accent)' : 'var(--md-line-strong)',
                                transition: 'all 0.25s var(--md-ease-smooth)', padding: 0,
                            }} />
                    ))}
                </div>
                <button onClick={() => scrollToPage(page + 1)} aria-label="다음 페이지" disabled={page === PREVIEW_PAGE_COUNT - 1}
                    style={{
                        width: 32, height: 32, borderRadius: 10, border: '1px solid var(--md-line)',
                        background: 'var(--md-surface)', color: 'var(--md-text-2)', fontSize: 15, cursor: 'pointer',
                        opacity: page === PREVIEW_PAGE_COUNT - 1 ? 0.35 : 1,
                    }}>›</button>
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--md-text-3)' }}>
                <LockGlyph size={10} /> 오행 진단 · 이름 10선 · 한자 풀이 · 수리 4격 검증
            </div>
        </div>
    );
}

export default function NamingLandingPage() {
    const router = useRouter();
    const modesRef = useRef<HTMLElement>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        setHasHistory(loadNamingHistory().length > 0);
    }, []);

    const scrollToModes = () =>
        modesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return (
        <MdShell theme="hanji">
                <div className="md-screen">
                    {/* 탑바 */}
                    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textDecoration: 'none', color: 'inherit' }} aria-label="묘연 홈으로">
                            <span className="md-serif" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '0.04em' }}>윤명</span>
                            <span className="md-serif" style={{ fontSize: 13, color: 'var(--md-accent)' }}>潤名</span>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11.5, letterSpacing: '0.14em', color: 'var(--md-text-3)' }}>EST. 2026</span>
                            {/* 메뉴 버튼 (보관함·고객센터) */}
                            <button
                                onClick={() => router.push('/yunmyeong/menu')}
                                aria-label="메뉴 열기"
                                style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--md-accent)',
                                }}
                            >
                                <MenuIcon size={16} />
                            </button>
                        </div>
                    </header>

                    {/* 히어로 */}
                    <section style={{ padding: '52px 24px 36px', textAlign: 'center' }}>
                        <div className="md-eyebrow" style={{ marginBottom: 18 }}>정통 수리 성명학 정밀 분석</div>
                        <h1 className="md-serif" style={{ fontSize: 31, lineHeight: 1.42, fontWeight: 600, letterSpacing: '-0.01em', textWrap: 'balance' }}>
                            이름은 평생을 흐르는<br />가장 짧은 사주입니다
                        </h1>
                        <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.75, color: 'var(--md-text-2)', textWrap: 'pretty' }}>
                            정통 수리 성명학의 규칙 연산에 명식 맞춤 풀이를 더해,<br />
                            사주 명식의 빈 곳을 채우는 이름을 찾아드립니다.
                        </p>
                    </section>

                    {/* 모드 카드 */}
                    <section ref={modesRef} style={{ padding: '0 20px', display: 'grid', gap: 12 }} aria-label="서비스 선택">
                        {MD_MODES.map((m) => (
                            <button key={m.id} className="md-card" onClick={() => router.push(`/yunmyeong/input?mode=${m.id}`)}
                                style={{ display: 'grid', gridTemplateColumns: '56px 1fr 20px', alignItems: 'center', gap: 16, padding: '18px 18px', textAlign: 'left', cursor: 'pointer', color: 'inherit', transition: 'transform 0.2s var(--md-ease-smooth), border-color 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--md-line-strong)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}>
                                <div className="md-serif" aria-hidden="true" style={{
                                    width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)',
                                    fontSize: 24, fontWeight: 600, color: 'var(--md-accent)',
                                }}>{m.glyph}</div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong style={{ fontSize: 16.5, fontWeight: 700 }}>{m.title}</strong>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-accent)', border: '1px solid var(--md-line-strong)', borderRadius: 99, padding: '2px 8px' }}>{m.sub}</span>
                                    </div>
                                    <p style={{ marginTop: 5, fontSize: 13, lineHeight: 1.55, color: 'var(--md-text-2)' }}>{m.desc}</p>
                                </div>
                                <span aria-hidden="true" style={{ color: 'var(--md-text-3)', fontSize: 18 }}>›</span>
                            </button>
                        ))}

                        {/* 발급 이력이 있으면 히스토리 진입점 노출 */}
                        {hasHistory && (
                            <button
                                onClick={() => router.push('/yunmyeong/history')}
                                style={{
                                    padding: '12px', textAlign: 'center', cursor: 'pointer',
                                    background: 'none', border: '1px dashed var(--md-line-strong)',
                                    borderRadius: 12, fontSize: 12.5, fontWeight: 600,
                                    color: 'var(--md-text-2)', fontFamily: 'inherit',
                                }}
                            >
                                지난 리포트 다시 보기 ›
                            </button>
                        )}
                    </section>

                    {/* 신뢰 스트립 */}
                    <section style={{ margin: '36px 20px 0', borderTop: '1px solid var(--md-line)', borderBottom: '1px solid var(--md-line)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                        {TRUST_STRIP.map(([big, small], i) => (
                            <div key={big} style={{ padding: '18px 8px', textAlign: 'center', borderLeft: i ? '1px solid var(--md-line)' : 'none' }}>
                                <div className="md-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--md-accent)' }}>{big}</div>
                                <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--md-text-3)', letterSpacing: '0.02em' }}>{small}</div>
                            </div>
                        ))}
                    </section>

                    {/* 리포트 미리보기 (명명증서 목업) */}
                    <section style={{ padding: '46px 24px 0', textAlign: 'center' }}>
                        <div className="md-eyebrow" style={{ marginBottom: 14 }}>리포트 미리보기</div>
                        <h2 className="md-serif" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5, textWrap: 'balance', marginBottom: 26 }}>
                            한 장의 증서로 받는<br />이름의 근거
                        </h2>
                        <ReportPreview />
                        <p style={{ marginTop: 16, fontSize: 12.5, lineHeight: 1.7, color: 'var(--md-text-3)' }}>
                            모든 후보는 추천 이유와 검증 수치를 함께 담아 발급됩니다
                        </p>
                    </section>

                    {/* 왜 윤명인가 — 방법론 3원칙 */}
                    <section style={{ padding: '46px 20px 0' }}>
                        <div className="md-eyebrow" style={{ textAlign: 'center', marginBottom: 22 }}>왜 윤명인가</div>
                        <div style={{ display: 'grid', gap: 11 }}>
                            {PRINCIPLES.map((p) => (
                                <div key={p.glyph} className="md-card" style={{ display: 'grid', gridTemplateColumns: '44px 1fr', alignItems: 'start', gap: 14, padding: '16px 16px' }}>
                                    <div className="md-serif" aria-hidden="true" style={{
                                        width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)',
                                        fontSize: 19, fontWeight: 600, color: 'var(--md-accent)',
                                    }}>{p.glyph}</div>
                                    <div>
                                        <strong style={{ fontSize: 14.5, fontWeight: 700 }}>{p.title}</strong>
                                        <p style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.65, color: 'var(--md-text-2)', textWrap: 'pretty' }}>{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 진행 방식 */}
                    <section style={{ padding: '46px 24px 0' }}>
                        <div className="md-eyebrow" style={{ textAlign: 'center', marginBottom: 22 }}>진행 방식</div>
                        <ol style={{ listStyle: 'none', display: 'grid', gap: 0, margin: 0, padding: 0 }}>
                            {PROCESS_STEPS.map(([t, d], i) => (
                                <li key={t} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 14, padding: '13px 0', borderBottom: i < 2 ? '1px solid var(--md-line)' : 'none' }}>
                                    <span className="md-serif" style={{ fontSize: 15, color: 'var(--md-accent)', fontWeight: 600, paddingTop: 1 }}>{['一', '二', '三'][i]}</span>
                                    <div>
                                        <strong style={{ fontSize: 14.5, fontWeight: 700 }}>{t}</strong>
                                        <p style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.6, color: 'var(--md-text-2)' }}>{d}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        {/* 무료 진단 강조 */}
                        <div style={{
                            marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            border: '1px solid var(--md-line-strong)', borderRadius: 'var(--md-radius-md)',
                            background: 'var(--md-accent-soft)', padding: '13px 16px',
                        }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--md-text-2)', textAlign: 'center' }}>
                                오행 결핍 진단까지는 <strong style={{ color: 'var(--md-accent)' }}>무료</strong>입니다 — 결과를 보고 리포트 발급을 결정하세요
                            </span>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section style={{ padding: '46px 20px 0' }}>
                        <div className="md-eyebrow" style={{ textAlign: 'center', marginBottom: 22 }}>자주 묻는 질문</div>
                        <div style={{ display: 'grid', gap: 9 }}>
                            {FAQ_ITEMS.map(([q, a], i) => {
                                const open = openFaq === i;
                                return (
                                    <div key={q} className="md-card" style={{ overflow: 'hidden' }}>
                                        <button onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 17px', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>
                                            <span className="md-serif" aria-hidden="true" style={{ fontSize: 13, color: 'var(--md-accent)', fontWeight: 700 }}>問</span>
                                            <strong style={{ flex: 1, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5 }}>{q}</strong>
                                            <span aria-hidden="true" style={{ color: 'var(--md-text-3)', fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▾</span>
                                        </button>
                                        {open ? (
                                            <p style={{ padding: '0 17px 16px 42px', fontSize: 12.5, lineHeight: 1.75, color: 'var(--md-text-2)', textWrap: 'pretty', animation: 'md-fadeup 0.35s var(--md-ease-smooth) both' }}>
                                                {a}
                                            </p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 클로징 CTA */}
                    <section style={{ padding: '52px 24px 8px', textAlign: 'center' }}>
                        <h2 className="md-serif" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.55, textWrap: 'balance' }}>
                            내 명식의 빈 곳,<br />지금 무료로 확인해 보세요
                        </h2>
                        <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--md-text-2)' }}>
                            입력 1분 · 오행 결핍 진단 무료
                        </p>
                        <button className="md-btn" style={{ marginTop: 20 }} onClick={scrollToModes}>
                            무료 오행 진단 받아보기
                        </button>
                    </section>

                    <footer style={{ marginTop: 'auto', padding: '26px 24px 30px', textAlign: 'center', fontSize: 11, color: 'var(--md-text-3)', lineHeight: 1.7 }}>
                        윤명 潤名 · 정통 성명학 연구소<br />본 분석은 전통 성명학 이론에 기반한 참고 자료입니다

                        {/* 법적 고지 링크 */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--md-line)', fontSize: 11, fontWeight: 600, color: 'var(--md-text-2)' }}>
                            <Link href="/yunmyeong/legal/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>개인정보처리방침</Link>
                            <Link href="/yunmyeong/legal/terms" style={{ color: 'inherit', textDecoration: 'none' }}>이용약관</Link>
                            <Link href="/yunmyeong/legal/refund" style={{ color: 'inherit', textDecoration: 'none' }}>환불정책</Link>
                        </div>

                        {/* 사업자 정보 */}
                        <div style={{ marginTop: 14, fontSize: 10.5, lineHeight: 1.8, color: 'var(--md-text-3)', textAlign: 'center' }}>
                            <p>상호명 : 인사이트랩 | 대표자 : 최혁준</p>
                            <p>사업자등록번호 : 207-30-92414</p>
                            <p>통신판매업신고번호 : 제 2026-서울관악-0869호</p>
                            <p>이메일 : support@dasisaju.com | 전화 : 070-8098-4109</p>
                            <p>주소 : 서울특별시 관악구 난곡로 284, 603호</p>
                            <p>호스팅 서비스 제공자 : Vercel Inc.</p>
                            <p style={{ marginTop: 10 }}>© {new Date().getFullYear()} 인사이트랩. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
        </MdShell>
    );
}
