"use client";

/**
 * 운명의 합 — 4파트 궁합 리포트 뷰
 * 참고 HTML(한지 리포트)의 구성·장치를 묘연 다크 팔레트로 재해석:
 * 파트 헤더 밴드 · him/her 2색 대비 카드 · 점수 그리드 · 등급표 · 인용구.
 */
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ganToHanja } from "@/utils/ganHanja";
import { classifyRelationType } from "@/utils/compatibilityCalc";
import HapSaveToAccountCard from "@/components/hap/HapSaveToAccountCard";
import OhhaengCompareChart from "@/components/hap/OhhaengCompareChart";
import CompatibilityChart from "@/components/CompatibilityChart";

// 운명의 합 — '인장과 금박' 팔레트. him은 먹빛 인장(ink), her는 금박(gold)으로
// 두 사람을 구분하고, accentBright/gold는 브랜드 전체를 관통하는 금 톤.
const C = {
    bg: '#0A090C',
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE',
    himSoft: 'rgba(184,180,190,0.08)',
    himBorder: 'rgba(184,180,190,0.28)',
    her: '#D9B872',
    herSoft: 'rgba(217,184,114,0.09)',
    herBorder: 'rgba(217,184,114,0.35)',
    gold: '#F5C842',
    ink: '#F0EAEB',
    sub: '#B5ABB2',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    band: 'rgba(240,234,235,0.07)',
    warn: '#E4A3AE',
    warnSoft: 'rgba(228,163,174,0.08)',
    serif: "'Noto Serif KR', serif",
    r: 16,
};

interface Props {
    job: { id: string; status: string; ai_result: any } | null;
    myName: string;
    partnerName: string;
    hasOwner?: boolean;
}

/* ── 공용 조각 ── */

// 파트가 진행될수록(첫 만남 → 최종 판정) 밴드 톤이 점점 짙은 금으로 깊어진다 —
// 네 파트가 다 똑같은 카드로 보이지 않게, 그리고 리포트가 결론을 향해
// '무르익는' 감각을 배경 톤 하나로 표현.
const PART_TIERS = [
    { band: 'linear-gradient(135deg, rgba(180,172,160,0.05) 0%, rgba(240,234,235,0.05) 100%)', border: 'rgba(240,234,235,0.13)', glow: null },
    { band: 'linear-gradient(135deg, rgba(201,161,92,0.07) 0%, rgba(240,234,235,0.045) 100%)', border: 'rgba(201,161,92,0.20)', glow: null },
    { band: 'linear-gradient(135deg, rgba(201,161,92,0.11) 0%, rgba(240,234,235,0.04) 100%)', border: 'rgba(201,161,92,0.26)', glow: null },
    { band: 'linear-gradient(135deg, rgba(217,184,114,0.16) 0%, rgba(10,9,8,0.5) 100%)', border: 'rgba(217,184,114,0.4)', glow: '0 0 40px rgba(217,184,114,0.12)' },
];

const PartHead = ({ num, title, anchorId, tier = 0 }: { num: string; title: string; anchorId: string; tier?: number }) => {
    const t = PART_TIERS[tier] || PART_TIERS[0];
    return (
        <div id={anchorId} data-part-anchor style={{ background: t.band, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 22px', margin: '54px 0 24px', scrollMarginTop: 74, boxShadow: t.glow || 'none' }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', color: C.accentBright, margin: '0 0 6px' }}>{num}</p>
            <h2 style={{ fontFamily: C.serif, fontSize: 19 + tier * 0.7, fontWeight: 700, margin: 0, color: C.ink }}>{title}</h2>
        </div>
    );
};

/**
 * 파트 이동 네비 — 스크롤에 따라 현재 파트를 강조하고 클릭 시 부드럽게 이동.
 * 루트 레이아웃의 <main>이 overflow:hidden이라 position:sticky의 기준
 * 스크롤 컨테이너가 되어버려 sticky가 먹지 않는다 — fixed + 히어로를
 * 지나면 나타나는 페이드인으로 우회한다 (하단 CTA 바와 같은 패턴).
 */
const PartNav = ({ parts }: { parts: { id: string; label: string }[] }) => {
    const [active, setActive] = useState(parts[0]?.id);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const els = parts.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
        if (!els.length) return;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length) setActive(visible[0].target.id);
            },
            { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
        );
        els.forEach((el) => io.observe(el));

        const onScroll = () => setVisible(window.scrollY > 300);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
            opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
            transform: visible ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}>
            <div style={{
                maxWidth: 560, margin: '0 auto',
                display: 'flex', justifyContent: 'center', gap: 6, padding: '14px 22px 24px', overflowX: 'auto',
                background: 'linear-gradient(to bottom, rgba(10,9,8,0.95) 0%, rgba(10,9,8,0.88) 60%, transparent 100%)',
                backdropFilter: 'blur(8px)', scrollbarWidth: 'none',
            }}>
                {parts.map((p) => {
                    const isActive = active === p.id;
                    return (
                        <a key={p.id} href={`#${p.id}`}
                            onClick={(e) => { e.preventDefault(); document.getElementById(p.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                            style={{
                                flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: '7px 13px', borderRadius: 999,
                                textDecoration: 'none', transition: 'all 0.2s',
                                color: isActive ? '#241C0C' : C.sub,
                                background: isActive ? C.gold : C.card,
                                border: `1px solid ${isActive ? C.gold : C.cardBorder}`,
                            }}>{p.label}</a>
                    );
                })}
            </div>
        </div>
    );
};

// climax=true는 각 파트를 마무리하는 총평류 소제목 전용 — 45개 소제목이 전부 같은
// 무게로 읽히면 리포트가 단조로워진다는 감사 결과로 도입 (major finding #1, #2).
// 크기·색·여백을 함께 올려서 "여기가 이 파트의 결론"이라는 신호를 시각적으로 준다.
const H3 = ({ children, climax = false }: { children: React.ReactNode; climax?: boolean }) => (
    <h3 style={{
        fontFamily: C.serif, fontWeight: 700, color: climax ? C.accentBright : C.ink,
        fontSize: climax ? 20 : 16.5,
        margin: climax ? '52px 0 14px' : '34px 0 12px',
        paddingBottom: climax ? 12 : 9,
        borderBottom: climax ? `2px solid ${C.accentBorder}` : `1px solid ${C.cardBorder}`,
        letterSpacing: climax ? '-0.01em' : 'normal',
    }}>{children}</h3>
);

const P = ({ children }: { children?: string }) => (
    children ? <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', margin: '0 0 12px' }}>{children}</p> : null
);

const Quote = ({ children }: { children?: string }) => (
    children ? (
        <div style={{ background: C.accentSoft, borderLeft: `3px solid ${C.accentBright}`, borderRadius: '0 12px 12px 0', padding: '16px 20px', margin: '20px 0' }}>
            <p style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 600, color: C.ink, lineHeight: 1.7, margin: 0, wordBreak: 'keep-all' }}>“{children}”</p>
        </div>
    ) : null
);

/**
 * him/her 2색 대비 카드. tone="warn"은 두 칸 다 경고성 내용(피해야 할 행동 등)일 때만 —
 * 평소의 먹빛/금박 대비 대신 로즈 톤으로 통일해 "여기는 주의 구간"이라는 신호를 카드
 * 자체가 준다 (13번 전부 같은 톤으로 반복되던 걸 감사에서 지적받아 도입, major finding #3).
 */
const PairCards = ({ myTitle, partnerTitle, myBody, partnerBody, tone = 'default' }: {
    myTitle: string; partnerTitle: string;
    myBody: React.ReactNode; partnerBody: React.ReactNode;
    tone?: 'default' | 'warn';
}) => {
    const isWarn = tone === 'warn';
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, margin: '14px 0 18px' }}>
            <div style={{
                background: isWarn ? C.warnSoft : C.himSoft, border: `1px solid ${C.cardBorder}`,
                borderTop: `3px solid ${isWarn ? C.warn : C.him}`, borderRadius: 13, padding: '15px 17px',
            }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: isWarn ? C.warn : C.him, margin: '0 0 8px' }}>{myTitle}</p>
                {myBody}
            </div>
            <div style={{
                background: isWarn ? C.warnSoft : C.herSoft, border: `1px solid ${C.cardBorder}`,
                borderTop: `3px solid ${isWarn ? C.warn : C.her}`, borderRadius: 13, padding: '15px 17px',
            }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: isWarn ? C.warn : C.her, margin: '0 0 8px' }}>{partnerTitle}</p>
                {partnerBody}
            </div>
        </div>
    );
};

const SmallP = ({ children }: { children?: string }) => (
    children ? <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', margin: 0 }}>{children}</p> : null
);

const CheckList = ({ items, tone = 'check' }: { items?: string[]; tone?: 'check' | 'warn' }) => (
    Array.isArray(items) && items.length ? (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
            {items.map((it, i) => (
                <li key={i} style={{ fontSize: 13, color: C.sub, lineHeight: 1.75, padding: '3px 0 3px 22px', position: 'relative', wordBreak: 'keep-all' }}>
                    <span style={{ position: 'absolute', left: 0, color: tone === 'check' ? C.gold : C.him, fontSize: 11 }}>{tone === 'check' ? '✔' : '✖'}</span>
                    {it}
                </li>
            ))}
        </ul>
    ) : null
);

const starsText = (stars: number) => '★'.repeat(Math.floor(stars)) + (stars % 1 >= 0.5 ? '½' : '');

export default function HapResultClient({ job, myName, partnerName, hasOwner = false }: Props) {
    if (!job || !job.ai_result?.hapReport) {
        return (
            <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: 'Pretendard, sans-serif', padding: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 700 }}>리포트를 찾을 수 없어요</p>
                <p style={{ fontSize: 13, color: C.sub, textAlign: 'center', wordBreak: 'keep-all' }}>{job && job.status !== 'completed' ? '아직 분석이 진행 중이거나 실패한 작업입니다.' : '링크가 정확한지 확인해 주세요.'}</p>
                <Link href="/hap" style={{ fontSize: 13, color: C.accentBright }}>운명의 합 처음으로 →</Link>
            </div>
        );
    }

    const r = job.ai_result;
    const rep = r.hapReport;
    const scores = r.hapScores || {};
    const gradeTable: { area: string; score: number; grade: string }[] = r.gradeTable || [];
    const mySeal = ganToHanja(r.myManseryeok?.day?.gan);
    const partnerSeal = ganToHanja(r.partnerManseryeok?.day?.gan);
    const comp = r.compatibility;
    const relationType = comp ? classifyRelationType(comp.attractionScore, comp.conflictScore, comp.complementScore) : null;

    const scoreBoxes = [
        { label: '💕 연애궁합', v: scores.romance },
        { label: '💍 결혼궁합', v: scores.marriage },
        { label: '💰 재물궁합', v: scores.wealth },
        { label: '🧩 성격궁합', v: scores.personality },
        { label: '🏠 가정궁합', v: scores.family },
        { label: '💬 소통궁합', v: scores.communication },
    ];

    const p1 = rep.part1 || {}, p2 = rep.part2 || {}, p3 = rep.part3 || {}, fin = rep.final || {};

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 22px 110px' }}>

                {/* ── 히어로 ── */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '58px 0 8px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: C.accentBright, marginBottom: 24 }}>운명의 합 · PREMIUM 궁합 리포트</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 58, height: 58, border: `2.5px solid ${C.him}`, color: C.him, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 24, fontWeight: 900, transform: 'rotate(-4deg)', boxShadow: '0 0 18px rgba(184,180,190,0.16)' }}>{mySeal}</div>
                        <span style={{ fontSize: 15, color: C.sub }}>✕</span>
                        <div style={{ width: 58, height: 58, border: `2.5px solid ${C.her}`, color: C.her, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 24, fontWeight: 900, transform: 'rotate(4deg)', boxShadow: '0 0 18px rgba(217,184,114,0.22)' }}>{partnerSeal}</div>
                    </div>
                    <h1 style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 900, margin: '0 0 10px' }}>{myName} ✕ {partnerName}</h1>
                    {rep.hero?.metaphorLine && <p style={{ fontSize: 14, color: C.sub, margin: 0, wordBreak: 'keep-all' }}>{rep.hero.metaphorLine}</p>}
                </motion.div>

                {/* ── 궁합 데이터 요약 — 무료 미리보기와 같은 계산 결과, 유료에서 더 적게 보이면 안 된다 ── */}
                {relationType && (
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 99, padding: '5px 14px' }}>
                            {relationType.badge}
                        </span>
                        <p style={{ fontSize: 12.5, color: C.sub, margin: '10px 0 0' }}>{relationType.desc}</p>
                    </div>
                )}
                {comp && (
                    <div style={{
                        ['--accent-gold' as any]: '#D9B872',
                        ['--accent-soft' as any]: 'rgba(201,161,92,0.10)',
                        ['--accent-border' as any]: 'rgba(201,161,92,0.32)',
                    }}>
                        <CompatibilityChart
                            attractionScore={comp.attractionScore} conflictScore={comp.conflictScore} complementScore={comp.complementScore}
                            hapList={comp.hapList} chungList={comp.chungList} hyeongList={comp.hyeongList} haeList={comp.haeList}
                            dayMasterRelation={comp.dayMasterRelation} spouseHouseRelation={comp.spouseHouseRelation}
                        />
                    </div>
                )}
                {r.myOhhaeng && r.partnerOhhaeng && (
                    <div style={{ marginTop: 24 }}>
                        <OhhaengCompareChart
                            myName={myName} partnerName={partnerName}
                            myOhhaeng={r.myOhhaeng} partnerOhhaeng={r.partnerOhhaeng}
                            ohhaengAnalysis={comp?.ohhaengAnalysis}
                        />
                    </div>
                )}

                <PartNav parts={[
                    { id: 'part1', label: 'PART 1' },
                    { id: 'part2', label: 'PART 2' },
                    { id: 'part3', label: 'PART 3' },
                    { id: 'final', label: 'FINAL' },
                ]} />

                {/* ══════════ PART 1 ══════════ */}
                <PartHead num="PART 1" title="첫 만남의 설계도" anchorId="part1" tier={0} />

                <H3>첫인상</H3>
                <P>{p1.firstImpression}</P>

                <H3>궁합 총점</H3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, margin: '14px 0 8px' }}>
                    {scoreBoxes.map((b) => (
                        <div key={b.label} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '14px 10px', textAlign: 'center' }}>
                            <p style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, margin: '0 0 5px' }}>{b.label}</p>
                            <p style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 900, color: C.accentBright, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{b.v ?? '-'}</p>
                        </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(150deg, rgba(201,161,92,0.18) 0%, rgba(10,9,12,0.9) 70%)', border: `1px solid ${C.accentBorder}`, borderRadius: 13, padding: '16px 10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, margin: '0 0 5px' }}>종합점수 <span style={{ color: C.gold, letterSpacing: 2, marginLeft: 6 }}>{typeof r.stars === 'number' ? starsText(r.stars) : ''}</span></p>
                        <p style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 900, color: C.ink, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{scores.total ?? '-'}점 <span style={{ fontSize: 16, color: C.accentBright }}>· {r.totalGrade}급</span></p>
                    </div>
                </div>
                <P>{p1.scoreComment}</P>

                <H3>오행 궁합</H3>
                <P>{p1.ohaengHarmony}</P>

                <H3>음양의 균형</H3>
                <P>{p1.yinYang}</P>

                <H3>왜 서로 끌릴까?</H3>
                <PairCards
                    myTitle={`${myName}님이 끌리는 이유`} partnerTitle={`${partnerName}님이 끌리는 이유`}
                    myBody={<SmallP>{p1.attraction?.myView}</SmallP>}
                    partnerBody={<SmallP>{p1.attraction?.partnerView}</SmallP>}
                />

                <H3>서로가 주는 변화</H3>
                <P>{p1.mutualGrowth}</P>

                <H3>대화 궁합</H3>
                <P>{p1.conversation}</P>

                <H3>사랑의 온도 차이</H3>
                <PairCards
                    myTitle={`${myName}님의 표현 방식`} partnerTitle={`${partnerName}님이 사랑을 느끼는 방식`}
                    myBody={<SmallP>{p1.loveTemperature?.myStyle}</SmallP>}
                    partnerBody={<SmallP>{p1.loveTemperature?.partnerStyle}</SmallP>}
                />
                <P>{p1.loveTemperature?.comment}</P>

                <H3>전생 인연</H3>
                <P>{p1.pastLife}</P>

                <H3>서로에게 가장 끌리는 매력</H3>
                <PairCards
                    myTitle={`${partnerName}님이 느끼는 ${myName}님의 매력`} partnerTitle={`${myName}님이 느끼는 ${partnerName}님의 매력`}
                    myBody={<CheckList items={p1.charmPoints?.myCharms} />}
                    partnerBody={<CheckList items={p1.charmPoints?.partnerCharms} />}
                />

                <H3>이 궁합의 가장 큰 장점</H3>
                <P>{p1.bestStrength}</P>

                <H3>가장 위험한 부분</H3>
                <P>{p1.biggestRisk}</P>

                <H3 climax>총평</H3>
                <P>{p1.expertReview}</P>
                <Quote>{p1.quote}</Quote>

                {/* ══════════ PART 2 ══════════ */}
                <PartHead num="PART 2" title="연애의 실전" anchorId="part2" tier={1} />

                <H3>누가 먼저 마음을 열까?</H3>
                <P>{p2.whoOpensFirst?.comment}</P>
                <PairCards
                    myTitle={`${myName}님`} partnerTitle={`${partnerName}님`}
                    myBody={<CheckList items={p2.whoOpensFirst?.myTraits} />}
                    partnerBody={<CheckList items={p2.whoOpensFirst?.partnerTraits} />}
                />

                <H3>연애 초기 모습</H3>
                <PairCards
                    myTitle={`${myName}님`} partnerTitle={`${partnerName}님`}
                    myBody={<CheckList items={p2.earlyDays?.myBehaviors} />}
                    partnerBody={<CheckList items={p2.earlyDays?.partnerBehaviors} />}
                />

                <H3>사랑이 깊어질수록</H3>
                <P>{p2.deepening}</P>

                <H3>가장 많이 싸울 수 있는 이유</H3>
                {(p2.fightReasons || []).map((f: any, i: number) => (
                    <div key={i} style={{ margin: '0 0 16px' }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: '0 0 6px' }}>{['①', '②', '③'][i] || '·'} {f.title}</p>
                        <SmallP>{f.detail}</SmallP>
                    </div>
                ))}

                <H3>싸우면 누가 먼저 풀까?</H3>
                <P>{p2.reconciliation}</P>

                <H3>권태기</H3>
                <P>{p2.slump}</P>

                <H3>이별 위험 신호</H3>
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '15px 17px', marginBottom: 14 }}>
                    <CheckList items={p2.dangerSignals} tone="warn" />
                </div>

                <H3>스킨십과 애정 표현</H3>
                <P>{p2.affection}</P>

                <H3>결혼 후 실제 생활</H3>
                <PairCards
                    myTitle={`${myName}님의 역할`} partnerTitle={`${partnerName}님의 역할`}
                    myBody={<CheckList items={p2.marriedLife?.myRoles} />}
                    partnerBody={<CheckList items={p2.marriedLife?.partnerRoles} />}
                />
                <P>{p2.marriedLife?.comment}</P>

                <H3>자녀와의 관계</H3>
                <P>{p2.parenting}</P>

                <H3 climax>Part 2 총평</H3>
                <PairCards
                    myTitle="가장 큰 장점" partnerTitle="가장 중요한 과제"
                    myBody={<CheckList items={p2.review?.strengths} />}
                    partnerBody={<CheckList items={p2.review?.tasks} tone="warn" />}
                />
                <P>{p2.review?.comment}</P>
                <Quote>{p2.review?.quote}</Quote>

                {/* ══════════ PART 3 ══════════ */}
                <PartHead num="PART 3" title="함께 만드는 생활" anchorId="part3" tier={2} />

                <H3>두 사람의 재물운 구조</H3>
                <PairCards
                    myTitle={`${myName}님`} partnerTitle={`${partnerName}님`}
                    myBody={<SmallP>{p3.wealthStructure?.myRole}</SmallP>}
                    partnerBody={<SmallP>{p3.wealthStructure?.partnerRole}</SmallP>}
                />
                <P>{p3.wealthStructure?.comment}</P>

                <H3>재물궁합</H3>
                <p style={{ color: C.gold, letterSpacing: 3, fontSize: 15, margin: '0 0 10px' }}>{starsText(Math.max(2.5, Math.min(5, Math.round(((scores.wealth || 70) / 20) * 2) / 2)))} <span style={{ color: C.sub, fontSize: 13, letterSpacing: 0 }}>— {scores.wealth}점</span></p>
                <P>{p3.wealthComment}</P>

                <H3>누가 경제권을 가질까?</H3>
                <P>{p3.moneyControl}</P>

                <H3>함께 사업하면?</H3>
                <PairCards
                    myTitle="잘 맞는 분야" partnerTitle="부담이 되는 방식"
                    myBody={<CheckList items={p3.business?.goodFields} />}
                    partnerBody={<CheckList items={p3.business?.badFields} tone="warn" />}
                />
                <P>{p3.business?.comment}</P>

                <H3>결혼 후 돈 관리</H3>
                <P>{p3.moneyAfterMarriage}</P>

                <H3>자녀운</H3>
                <PairCards
                    myTitle={`${myName}님의 스타일`} partnerTitle={`${partnerName}님의 스타일`}
                    myBody={<SmallP>{p3.children?.myStyle}</SmallP>}
                    partnerBody={<SmallP>{p3.children?.partnerStyle}</SmallP>}
                />
                <P>{p3.children?.comment}</P>

                <H3>평생 함께 살 가능성</H3>
                <P>{p3.lifelong}</P>

                <H3>가장 위험한 순간</H3>
                <P>{p3.riskyMoment}</P>

                <H3>오래가는 비결</H3>
                <P>{p3.secret}</P>

                <H3>노년운</H3>
                <P>{p3.oldAge}</P>

                <H3>서로에게 배우는 점</H3>
                <PairCards
                    myTitle={`${myName}님이 배우는 것`} partnerTitle={`${partnerName}님이 배우는 것`}
                    myBody={<CheckList items={p3.learning?.myLearns} />}
                    partnerBody={<CheckList items={p3.learning?.partnerLearns} />}
                />

                <H3 climax>Part 3 총평</H3>
                <P>{p3.review}</P>
                <Quote>{p3.reviewQuote}</Quote>

                {/* ══════════ FINAL ══════════ */}
                <PartHead num="FINAL" title="최종 판정" anchorId="final" tier={3} />

                <H3>두 사람의 인연을 한 문장으로</H3>
                <Quote>{fin.oneLineDestiny}</Quote>

                <H3>서로의 운을 높여줄 가능성</H3>
                <PairCards
                    myTitle={`${myName}님이 받는 것`} partnerTitle={`${partnerName}님이 받는 것`}
                    myBody={<CheckList items={fin.synergy?.myGifts} />}
                    partnerBody={<CheckList items={fin.synergy?.partnerGifts} />}
                />
                <P>{fin.synergy?.comment}</P>

                <H3>결혼 적기</H3>
                <P>{fin.marriageTiming}</P>

                <H3>결혼 후의 모습</H3>
                <P>{fin.afterMarriage}</P>

                <H3>가장 주의해야 할 시기</H3>
                <P>{fin.cautionPeriod}</P>

                <H3>피하면 좋은 행동</H3>
                <PairCards tone="warn"
                    myTitle={`${myName}님`} partnerTitle={`${partnerName}님`}
                    myBody={<CheckList items={fin.avoidActions?.myAvoid} tone="warn" />}
                    partnerBody={<CheckList items={fin.avoidActions?.partnerAvoid} tone="warn" />}
                />

                <H3>오래가는 비결</H3>
                <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '15px 17px', marginBottom: 14 }}>
                    <CheckList items={fin.lastingTips} />
                </div>

                <H3>궁합 등급</H3>
                <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 13, overflow: 'hidden', marginBottom: 18 }}>
                    {gradeTable.map((g, i) => (
                        <div key={g.area} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < gradeTable.length - 1 ? `1px solid ${C.cardBorder}` : 'none', background: i % 2 ? 'transparent' : C.card }}>
                            <span style={{ fontSize: 13.5, color: C.sub, fontWeight: 600 }}>{g.area}</span>
                            <span style={{ fontSize: 13, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{g.score}점 <strong style={{ fontFamily: C.serif, fontSize: 15, color: C.accentBright, marginLeft: 8 }}>{g.grade}</strong></span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'linear-gradient(150deg, rgba(201,161,92,0.18) 0%, rgba(10,9,12,0.9) 70%)' }}>
                        <span style={{ fontSize: 14, color: C.ink, fontWeight: 800 }}>종합 등급</span>
                        <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 900, color: C.accentBright }}>{r.totalGrade}급 궁합</span>
                    </div>
                </div>

                <H3 climax>역술가의 최종 총평</H3>
                <P>{fin.finalReview}</P>
                <Quote>{fin.lastQuote}</Quote>

                {/* 결제 후 계정 연결 유도 (결제 전 로그인 강요 대신) */}
                {job && <HapSaveToAccountCard jobId={job.id} hasOwner={hasOwner} />}

                {/* 푸터 */}
                <p style={{ marginTop: 46, fontSize: 11, color: C.muted, textAlign: 'center', opacity: 0.75, lineHeight: 1.7 }}>
                    운명의 합 · 전통 명리학적 해석을 바탕으로 한 참고 자료입니다.<br />이 링크는 언제든 다시 열 수 있어요.
                </p>
            </div>
        </div>
    );
}
