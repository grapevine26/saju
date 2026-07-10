'use client';

import { NamingInput, NamingServiceType, Ohaeng } from '@/features/naming/types';
import {
    MdDistRow,
    MdPricing,
    MD_DAYMASTER,
    MD_EL_ASSET,
    MD_EL_HANJA,
    MD_EL_LACK_COPY,
    mdBalanceLabel,
    mdConflictCopy,
    mdWon,
} from '@/features/naming/yunmyeong';
import { MdChartRadar } from './MdCharts';

// ─────────────────────────────────────────────
// 윤명 — 무료 진단 / 페이월 (The Hook · 채택 변형: 클리프)
// 헤더 → 진단 카피 → 리포트 티저 → 가격 카드 순으로 조립한다.
// 카피는 핸드오프 hook.jsx 원문 그대로 (템플릿 변수만 연산 결과 연결)
// ─────────────────────────────────────────────

/* ---------- 잠금 아이콘 (SVG) ---------- */
export function LockGlyph({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'block' }}>
            <rect x="2.5" y="7" width="11" height="7.5" rx="1.8" fill={color} />
            <path d="M5 7V5.2a3 3 0 0 1 6 0V7" stroke={color} strokeWidth="1.6" fill="none" />
        </svg>
    );
}

/* ---------- 공통 헤더 ---------- */
export function HookHeader({ input, lacking }: { input: NamingInput; lacking: MdDistRow }) {
    return (
        <header style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span className="md-eyebrow" style={{ whiteSpace: 'nowrap' }}>무료 진단 결과</span>
                <span style={{ fontSize: 11.5, color: 'var(--md-text-3)', textAlign: 'right' }}>
                    {input.surname ? input.surname + '씨' : ''} · {input.birthYear}.{String(input.birthMonth).padStart(2, '0')}.{String(input.birthDay).padStart(2, '0')} · {input.gender === 'male' ? '남' : '여'}
                </span>
            </div>
            <h2 className="md-serif" style={{ marginTop: 14, fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>
                명식에 <span style={{ color: 'var(--md-danger)' }}>&lsquo;{lacking.el}({lacking.hanja})&rsquo;</span>의 구멍이 발견되었습니다
            </h2>
        </header>
    );
}

/* ---------- 진단 카피 ---------- */
export function DiagnosisCopy({ input, lacking }: { input: NamingInput; lacking: MdDistRow }) {
    const pctText = lacking.count === 0 ? '0%로 완벽히 고갈' : `${lacking.pct}%로 위험 수위까지 결핍`;
    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {input.concern ? (
                <p className="md-serif" style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--md-text-2)', fontStyle: 'italic', borderLeft: '2px solid var(--md-line-strong)', paddingLeft: 14 }}>
                    &ldquo;{input.concern}&rdquo; — 그 답답함은 우연이 아닙니다. 명식의 {lacking.el}({lacking.hanja}) 결핍에서 이미 드러나고 있습니다.
                </p>
            ) : null}
            <p className="md-serif" style={{ fontSize: 17.5, lineHeight: 1.7, fontWeight: 600, textWrap: 'pretty' }}>
                분석 결과, 선천적 명식에 {MD_EL_ASSET[lacking.el]}을 뜻하는{' '}
                <strong style={{ color: 'var(--md-danger)', fontWeight: 700 }}>&lsquo;{lacking.el}({lacking.hanja})&rsquo;의 기운이 {pctText}</strong>되어 있습니다.
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', textWrap: 'pretty' }}>
                이 결핍을 방치하면 {MD_EL_LACK_COPY[lacking.el]} 다행히 명식의 이러한 빈 곳은 <strong style={{ color: 'var(--md-text)' }}>이름의 자원오행과 획수</strong>를 통해 후천적으로 보완이 가능합니다.
            </p>
        </div>
    );
}

/* ---------- 오행 균형 미터 (차트 카드 하단 부착용) ---------- */
export function BalanceMeter({ score }: { score: number }) {
    const warn = score < 50;
    const color = warn ? 'var(--md-danger)' : 'var(--md-accent)';
    return (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--md-line)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--md-text-2)' }}>오행 균형도</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="md-serif" style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
                    <span style={{ fontSize: 11, color: 'var(--md-text-3)' }}>/ 100</span>
                    <span style={{
                        fontSize: 10.5, fontWeight: 700, color,
                        border: `1px solid ${warn ? 'var(--md-danger)' : 'var(--md-line-strong)'}`,
                        borderRadius: 99, padding: '2px 9px',
                    }}>{mdBalanceLabel(score)}</span>
                </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--md-accent-soft)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${score}%`, borderRadius: 3, background: color,
                    transition: 'width 0.9s var(--md-ease-smooth)',
                }}></div>
            </div>
            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--md-text-3)' }}>다섯 기운이 고르게 갖춰진 명식일수록 100에 가깝습니다</p>
        </div>
    );
}

/* ---------- 일간 캐릭터 카드 — 타고난 그릇 ---------- */
export function DayMasterCard({ gan }: { gan?: string }) {
    const dm = gan ? MD_DAYMASTER[gan] : undefined;
    if (!dm) return null;
    return (
        <div className="md-card" style={{ padding: '18px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="md-serif" aria-hidden="true" style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--md-line-strong)', background: 'var(--md-accent-soft)',
                fontSize: 24, fontWeight: 600, color: 'var(--md-accent)',
            }}>{dm.hanja}</div>
            <div>
                <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--md-text-3)', marginBottom: 4 }}>
                    일간 {gan}{dm.hanja} · 타고난 그릇
                </div>
                <strong className="md-serif" style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.4 }}>{dm.title}</strong>
                <p style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.65, color: 'var(--md-text-2)', textWrap: 'pretty' }}>{dm.desc}</p>
            </div>
        </div>
    );
}

/* ---------- 과다 ↔ 결핍 상극 구조 노트 ---------- */
export function ConflictNote({ strongest, lacking }: { strongest: Ohaeng; lacking: Ohaeng }) {
    const copy = mdConflictCopy(strongest, lacking);
    if (!copy) return null;
    return (
        <p style={{
            fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', textWrap: 'pretty',
            borderLeft: '2px solid var(--md-danger)', paddingLeft: 14,
        }}>
            과다 <strong style={{ color: 'var(--md-text)' }}>{strongest}({MD_EL_HANJA[strongest]})</strong> · 결핍{' '}
            <strong style={{ color: 'var(--md-danger)' }}>{lacking}({MD_EL_HANJA[lacking]})</strong> — {copy}
        </p>
    );
}

/* ---------- AI 정밀 소견 카드 (flash-lite — 명식 글자 인용 개인화) ---------- */
export interface MdTeaser {
    headline?: string;
    diagnosis: string;
    currentNameComment?: string;
    solutionTeaser: string;
}

export function AiInsightCard({ teaser, currentName }: { teaser: MdTeaser; currentName?: string | null }) {
    return (
        <div className="md-card" style={{ padding: '20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="md-eyebrow">명식 정밀 소견</span>
                <span className="md-serif" style={{ fontSize: 11, color: 'var(--md-text-3)', letterSpacing: '0.2em' }}>潤名 鑑定</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.85, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
                {teaser.diagnosis}
            </p>
            {teaser.currentNameComment && currentName ? (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--md-line-strong)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--md-accent)', marginBottom: 6 }}>
                        현재 이름 &lsquo;{currentName}&rsquo;에 대한 소견
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
                        {teaser.currentNameComment}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

/* ---------- 길격 이름 선별 완료 배지 ---------- */
export function CandidateBadge({ count, serviceType }: { count: number; serviceType: NamingServiceType }) {
    if (count <= 0) return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: '1px solid var(--md-line-strong)', borderRadius: 'var(--md-radius-md)',
            background: 'var(--md-accent-soft)', padding: '13px 16px',
        }}>
            <span style={{ color: 'var(--md-accent)' }}><LockGlyph size={12} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--md-text-2)', textAlign: 'center' }}>
                {serviceType === 'evaluation'
                    ? <>수리 4격 길격 통과 — <strong style={{ color: 'var(--md-accent)' }}>보완 후보 3선</strong> 선별 완료</>
                    : <>수리 4격 길격 통과 이름 <strong style={{ color: 'var(--md-accent)' }}>{count}개</strong> 선별 완료 · 리포트에서 공개</>}
            </span>
        </div>
    );
}

/* ---------- 리포트 미리보기 티저 (기울어진 블러 페이지 2장) ---------- */
export function ReportTeaser({
    serviceType, dist, lacking,
}: { serviceType: NamingServiceType; dist: MdDistRow[]; lacking: MdDistRow }) {
    const fakeLines = [88, 96, 72, 92, 60, 84, 90, 52];
    const page = (title: string, idx: number, rot: number) => (
        <div key={idx} className="md-card" style={{
            width: 158, padding: '16px 14px 18px', background: 'var(--md-bg-raise)',
            transform: `rotate(${rot}deg)`, flexShrink: 0,
        }}>
            <div className="md-serif" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--md-accent)', marginBottom: 8 }}>潤名 REPORT</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>{title}</div>
            <div className="md-locked" style={{ display: 'grid', gap: 5 }}>
                {fakeLines.slice(idx * 4, idx * 4 + 4).map((w, i) => (
                    <div key={i} style={{ height: 5, width: `${w}%`, borderRadius: 3, background: 'var(--md-line-strong)' }}></div>
                ))}
                <div style={{ marginTop: 8 }}>
                    {idx === 0
                        ? <MdChartRadar dist={dist} lacking={lacking.el} />
                        : <div style={{ display: 'grid', gap: 5 }}>{fakeLines.map((w, i) => <div key={i} style={{ height: 5, width: `${(w * 7 + i * 13) % 60 + 35}%`, borderRadius: 3, background: 'var(--md-line)' }}></div>)}</div>}
                </div>
            </div>
        </div>
    );
    return (
        <div style={{ position: 'relative' }}>
            <div className="md-eyebrow" style={{ marginBottom: 12 }}>발급 대기 중인 리포트</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '8px 0 4px' }}>
                {page('오행 정밀 진단', 0, -2)}
                {page(serviceType === 'evaluation' ? '감명 판정 · 수리 4격' : '처방 이름 10선 · 한자 풀이', 1, 2)}
            </div>
            <div style={{
                position: 'absolute', left: 0, right: 0, bottom: -8, top: 26,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                background: 'linear-gradient(to bottom, transparent 20%, var(--md-bg) 92%)', pointerEvents: 'none',
            }}>
                <span style={{ fontSize: 12, color: 'var(--md-text-2)', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}><LockGlyph size={12} /> 12페이지 분량 · 결제 즉시 발급</span>
            </div>
        </div>
    );
}

/* ---------- 가격 카드 ---------- */
export function PriceCard({
    pricing, onPay, busy,
}: { pricing: MdPricing; onPay: () => void; busy?: boolean }) {
    return (
        <div className="md-card" style={{
            padding: '24px 22px', position: 'relative', zIndex: 5,
            border: '1px solid var(--md-line-strong)',
            background: 'var(--md-bg-raise)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: 'var(--md-accent)' }}><LockGlyph size={13} /></span>
                <span className="md-eyebrow">잠긴 처방 리포트</span>
            </div>
            <h3 className="md-serif" style={{ fontSize: 17.5, fontWeight: 700, lineHeight: 1.55, textWrap: 'pretty' }}>{pricing.headline}</h3>
            <ul style={{ listStyle: 'none', margin: '16px 0 18px', padding: 0, display: 'grid', gap: 9 }}>
                {pricing.bullets.map((b) => (
                    <li key={b} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 8, fontSize: 13, lineHeight: 1.55, color: 'var(--md-text-2)' }}>
                        <span style={{ color: 'var(--md-good)', fontWeight: 700 }}>✓</span><span>{b}</span>
                    </li>
                ))}
            </ul>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--md-text-3)', textDecoration: 'line-through' }}>오프라인 작명소 {mdWon(pricing.original)}</span>
                <span className="md-serif" style={{ fontSize: 26, fontWeight: 700, color: 'var(--md-accent)' }}>{mdWon(pricing.price)}</span>
            </div>
            <button className="md-btn" onClick={onPay} disabled={busy}>{pricing.cta}</button>
            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--md-text-3)', textAlign: 'center' }}>결제 즉시 열람 · PDF 리포트 발급</p>
        </div>
    );
}
