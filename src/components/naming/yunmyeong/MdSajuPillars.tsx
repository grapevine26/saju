'use client';

// ─────────────────────────────────────────────
// 윤명 — 사주 명식 4주 표 (시/일/월/연)
// 기존 baziCalc의 manseryeok 데이터를 그대로 연결한다.
// 일주 열만 accent-soft 배경으로 강조 (핸드오프 hook.jsx SajuPillars)
// ─────────────────────────────────────────────

/** baziCalc manseryeok 기둥 (사용하는 필드만 타입 선언) */
export interface MdPillar {
    gan: string;
    ganHanja: string;
    zhi: string;
    zhiHanja: string;
}

export interface MdManseryeok {
    year: MdPillar | null;
    month: MdPillar | null;
    day: MdPillar | null;
    time: MdPillar | null;
}

export default function MdSajuPillars({ manseryeok }: { manseryeok: MdManseryeok }) {
    const cols: Array<[string, MdPillar | null]> = [
        ['시주', manseryeok.time],
        ['일주', manseryeok.day],
        ['월주', manseryeok.month],
        ['연주', manseryeok.year],
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--md-line)', borderRadius: 'var(--md-radius-md)', overflow: 'hidden' }}>
            {cols.map(([label, p], i) => (
                <div key={label} style={{
                    padding: '12px 4px 14px', textAlign: 'center',
                    borderLeft: i ? '1px solid var(--md-line)' : 'none',
                    background: label === '일주' ? 'var(--md-accent-soft)' : 'transparent',
                }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--md-text-3)', marginBottom: 8 }}>{label}</div>
                    {p ? (
                        <div>
                            <div className="md-serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                                {p.ganHanja}<br />{p.zhiHanja}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--md-text-2)', marginTop: 6 }}>{p.gan}{p.zhi}</div>
                        </div>
                    ) : (
                        <div style={{ fontSize: 12, color: 'var(--md-text-3)', padding: '14px 0' }}>시간<br />미상</div>
                    )}
                </div>
            ))}
        </div>
    );
}
