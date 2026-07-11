'use client';

import { useCallback, useRef, useState } from 'react';
import { NameCandidate, Ohaeng, SagyeokResult } from '@/features/naming/types';
import { AppraisalResult } from '@/features/naming/appraisal';
import { MdDistRow, MD_EL_ASSET, MD_EL_HANJA } from '@/features/naming/yunmyeong';
import { MdPillar } from './MdSajuPillars';

// ─────────────────────────────────────────────
// 윤명 — 명명증서 리포트 구성 요소
// SuriGrid(수리 4격) · 이름 카드 아코디언 · 감명 판정 · 공유 카드 · 토스트
// ─────────────────────────────────────────────

/* ---------- 토스트 (md-toast — 2.6s 자동 소멸) ---------- */
export function useMdToast(): [string | null, (msg: string) => void] {
    const [msg, setMsg] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toast = useCallback((m: string) => {
        setMsg(null);
        if (timer.current) clearTimeout(timer.current);
        requestAnimationFrame(() => setMsg(m));
        timer.current = setTimeout(() => setMsg(null), 2700);
    }, []);

    return [msg, toast];
}

export function MdToast({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return <div className="md-toast" role="status">{msg}</div>;
}

/* ---------- 수리 4격 그리드 ---------- */
const SURI_META: Array<[keyof Pick<SagyeokResult, 'won' | 'hyeong' | 'i' | 'jeong'>, string, string]> = [
    ['won', '원격(元格)', '초년운'],
    ['hyeong', '형격(亨格)', '청년운 · 주운'],
    ['i', '이격(利格)', '중년운'],
    ['jeong', '정격(貞格)', '말년운 · 총운'],
];

export function SuriGrid({ sagyeok }: { sagyeok: SagyeokResult }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SURI_META.map(([k, label, sub]) => {
                const s = sagyeok[k];
                const good = s.grade === '길' || s.grade === '대길';
                return (
                    <div key={k} style={{ border: '1px solid var(--md-line)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>
                            <span style={{ fontSize: 10, color: 'var(--md-text-3)' }}>{sub}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                            <span className="md-serif" style={{ fontSize: 13, color: 'var(--md-text-2)' }}>{s.value}수 · {s.title}</span>
                            <span style={{
                                fontSize: 11, fontWeight: 800,
                                color: s.grade === '대길' ? 'var(--md-accent)' : good ? 'var(--md-good)' : 'var(--md-text-3)',
                            }}>{s.grade}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---------- 이름 카드 (아코디언) ---------- */
interface MdNameCardProps {
    rank: number;
    surnameHangul: string;
    surnameHanja: string;
    candidate: NameCandidate;
    /** AI 해설 (catchphrase=어감 캡션, interpretation=해설 문단) */
    aiComment?: { catchphrase?: string; interpretation?: string; callingVibe?: string };
    match: number;
    defaultOpen?: boolean;
}

export function MdNameCard({ rank, surnameHangul, surnameHanja, candidate, aiComment, match, defaultOpen }: MdNameCardProps) {
    const [open, setOpen] = useState(!!defaultOpen);
    const rawCommentary = [aiComment?.interpretation, aiComment?.callingVibe].filter(Boolean).join('\n\n');
    const commentary = rawCommentary.replace(/\\n/g, '\n');

    return (
        <div className="md-card" style={{ overflow: 'hidden' }}>
            <button onClick={() => setOpen(!open)} aria-expanded={open}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>
                <span className="md-serif" style={{ fontSize: 13, color: 'var(--md-accent)', fontWeight: 700, width: 22 }}>{String(rank).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                        <strong className="md-serif" style={{ fontSize: 19, fontWeight: 700 }}>{surnameHangul}{candidate.hangul}</strong>
                        <span className="md-serif" style={{ fontSize: 14, color: 'var(--md-text-2)' }}>{surnameHanja}{candidate.hanja.map((c) => c.char).join('')}</span>
                    </div>
                    {aiComment?.catchphrase ? (
                        <div style={{ fontSize: 12, color: 'var(--md-text-3)', marginTop: 3 }}>{aiComment.catchphrase}</div>
                    ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="md-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--md-accent)' }}>{match}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--md-text-3)', letterSpacing: '0.08em' }}>MATCH</div>
                </div>
                <span aria-hidden="true" style={{ color: 'var(--md-text-3)', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▾</span>
            </button>
            {open ? (
                <div style={{ padding: '0 18px 20px', display: 'grid', gap: 14, animation: 'md-fadeup 0.35s var(--md-ease-smooth) both' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {candidate.hanja.map((c) => {
                            const parts = c.meaning.split(',');
                            const hunmin = parts[0].trim();
                            const desc = parts[1]?.trim();
                            return (
                                <div key={c.char} style={{ 
                                    border: '1px solid var(--md-line)', 
                                    borderRadius: 14, 
                                    padding: '20px 10px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    background: 'var(--md-bg-raise, rgba(255, 255, 255, 0.02))',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    gap: 10
                                }}>
                                    <span className="md-serif" style={{ fontSize: 38, fontWeight: 500, color: 'var(--md-text)', lineHeight: 1 }}>{c.char}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--md-text)' }}>{hunmin}</span>
                                        {desc ? (
                                            <span style={{ fontSize: 11.5, color: 'var(--md-text-2)', lineHeight: 1.4 }}>{desc}</span>
                                        ) : null}
                                        <div style={{ fontSize: 10.5, color: 'var(--md-text-2)', opacity: 0.8, fontWeight: 500, marginTop: 4 }}>
                                            {c.strokes}획 · {c.element}({MD_EL_HANJA[c.element]})
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <SuriGrid sagyeok={candidate.sagyeok} />
                    {commentary ? (
                        <p style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--md-text-2)', textWrap: 'pretty', whiteSpace: 'pre-line' }}>{commentary}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

/* ---------- 감명 판정 / 현재 이름 진단 카드 ---------- */
interface AppraisalVerdictProps {
    appraisal: AppraisalResult;
    surnameHangul: string;
    surnameHanja: string;
    lacking: MdDistRow;
    /** evaluation = 감명(검증이 목적) / rename = 개명(처방 비교가 목적) — 문구 분기 */
    variant?: 'evaluation' | 'rename';
}

export function AppraisalVerdict({ appraisal, surnameHangul, surnameHanja, lacking, variant = 'evaluation' }: AppraisalVerdictProps) {
    const matchedAll = appraisal.chars.length === 2 && appraisal.chars.every(Boolean);
    const isRename = variant === 'rename';
    return (
        <div className="md-card" style={{ padding: '26px 22px', textAlign: 'center' }}>
            <div className="md-eyebrow" style={{ marginBottom: 16 }}>{isRename ? '현재 이름 진단' : '감명 판정'}</div>
            <div className="md-serif" style={{ fontSize: 34, fontWeight: 700 }}>{surnameHangul}{appraisal.name}</div>
            {matchedAll ? (
                <div className="md-serif" style={{ fontSize: 16, color: 'var(--md-text-2)', marginTop: 6 }}>
                    {surnameHanja}{appraisal.chars.map((c) => c!.char).join('')}
                </div>
            ) : null}
            {appraisal.estimated ? (
                <div style={{ margin: '20px auto 8px', maxWidth: 300, padding: '16px 18px', borderRadius: 14, border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)' }}>
                    <div className="md-serif" style={{ fontSize: 20, fontWeight: 700, color: appraisal.fillsLack ? 'var(--md-accent)' : 'var(--md-danger)', marginBottom: 6 }}>
                        {appraisal.fillsLack ? '결핍 기운 보완' : '결핍 기운 미보완'}
                    </div>
                    <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--md-text-3)', margin: 0 }}>
                        정밀 수리 점수는 실제 사용 중인 한자를 알아야 산출됩니다. 독음 기준 오행 보완 여부로 안내드려요.
                    </p>
                </div>
            ) : (
                <div style={{ margin: '20px auto 8px', width: 116, height: 116, borderRadius: '50%', border: '1px solid var(--md-line-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--md-accent-soft)' }}>
                    <span className="md-serif" style={{ fontSize: 36, fontWeight: 700, color: appraisal.score >= 80 ? 'var(--md-accent)' : 'var(--md-danger)' }}>{appraisal.score}</span>
                    <span style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--md-text-3)' }}>/ 100</span>
                </div>
            )}
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', marginTop: 14, textWrap: 'pretty' }}>
                {appraisal.fillsLack ? (
                    isRename
                        ? <span>이 이름은 명식에 고갈된 <strong style={{ color: 'var(--md-text)' }}>{lacking.el}({lacking.hanja})의 기운을 직접 보충</strong>하는 배열입니다. 기운 자체는 안정적인 편이지만, 아래 처방 이름들은 같은 조건 위에서 어감과 수리까지 한층 더 끌어올린 구성입니다.</span>
                        : <span>이 이름은 명식에 고갈된 <strong style={{ color: 'var(--md-text)' }}>{lacking.el}({lacking.hanja})의 기운을 직접 보충</strong>하는 배열입니다. 어감과 수리의 균형이 좋아 그대로 사용하셔도 충분합니다.</span>
                ) : (
                    isRename
                        ? <span>어감은 준수하지만, 명식의 핵심 결핍인 <strong style={{ color: 'var(--md-danger)' }}>{lacking.el}({lacking.hanja}) 기운을 채우지 못하는 배열</strong>입니다. 아래 처방 이름 10선에서 새 흐름을 선택해 보시길 권합니다.</span>
                        : <span>어감은 준수하지만, 명식의 핵심 결핍인 <strong style={{ color: 'var(--md-danger)' }}>{lacking.el}({lacking.hanja}) 기운을 채우지 못하는 배열</strong>입니다. 아래 보완 후보와 비교해 보시길 권합니다.</span>
                )}
            </p>
            {appraisal.sagyeok ? <div style={{ marginTop: 18, textAlign: 'left' }}><SuriGrid sagyeok={appraisal.sagyeok} /></div> : null}
        </div>
    );
}

/* ---------- 공유 카드 (9:16 영수증 미리보기) ---------- */
interface ShareCardProps {
    dayPillar: MdPillar | null;
    strongest: { el: Ohaeng; pct: number };
    lacking: MdDistRow;
    onSave: () => void;
}

export function ShareCard({ dayPillar, strongest, lacking, onSave }: ShareCardProps) {
    return (
        <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
            <div className="md-card" style={{ width: 192, aspectRatio: '9 / 16', padding: '18px 16px', display: 'flex', flexDirection: 'column', background: 'var(--md-bg-raise)' }}>
                <div className="md-serif" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--md-accent)', textAlign: 'center' }}>潤名 RECEIPT</div>
                <div style={{ borderBottom: '1px dashed var(--md-line-strong)', margin: '10px 0' }}></div>
                <div style={{ fontSize: 9, color: 'var(--md-text-3)', display: 'grid', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>일주</span>
                        <span className="md-serif" style={{ color: 'var(--md-text)' }}>{dayPillar ? dayPillar.ganHanja + dayPillar.zhiHanja : '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>과다</span>
                        <span style={{ color: 'var(--md-text)' }}>{strongest.el}({MD_EL_HANJA[strongest.el]}) {strongest.pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>결핍</span>
                        <span style={{ color: 'var(--md-danger)' }}>{lacking.el}({lacking.hanja}) {lacking.pct}%</span>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8.5, letterSpacing: '0.2em', color: 'var(--md-text-3)' }}>내 사주의 빈칸</span>
                    <span className="md-serif" style={{ fontSize: 52, fontWeight: 700, color: 'var(--md-accent)' }}>{lacking.hanja}</span>
                    <span style={{ fontSize: 9, color: 'var(--md-text-2)' }}>{MD_EL_ASSET[lacking.el]}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--md-line-strong)', paddingTop: 8, fontSize: 8, color: 'var(--md-text-3)', textAlign: 'center' }}>dasisaju.com · 무료 오행 진단</div>
            </div>
            <button className="md-btn md-btn--ghost" style={{ minHeight: 44, fontSize: 13, maxWidth: 220 }} onClick={onSave}>공유 이미지 저장 (1080×1920)</button>
        </div>
    );
}
