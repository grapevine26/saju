'use client';

import { MdDistRow } from '@/features/naming/yunmyeong';
import { Ohaeng } from '@/features/naming/types';

// ─────────────────────────────────────────────
// 윤명 — 오행 분포 차트 (핸드오프 charts.jsx 포팅)
// 채택 변형: Hook 화면 = 방사형 레이더 / 리포트 = 수평 막대
// 모든 색상은 --md-* CSS 변수만 참조한다.
// ─────────────────────────────────────────────

interface ChartProps {
    dist: MdDistRow[];
    lacking: Ohaeng;
}

/* ---------- 방사형 (오각 레이더) ---------- */
export function MdChartRadar({ dist, lacking }: ChartProps) {
    const cx = 130, cy = 122, R = 88;
    const pt = (i: number, r: number): [number, number] => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const poly = (r: number) => dist.map((_, i) => pt(i, r).join(',')).join(' ');
    const valPoly = dist
        .map((d, i) => pt(i, Math.max(0.06, d.pct / 38) * R * 0.9).join(','))
        .join(' ');

    return (
        <svg viewBox="0 0 260 244" style={{ width: '100%', display: 'block' }} role="img" aria-label="오행 분포 레이더 차트">
            {[1, 0.72, 0.45].map((k) => (
                <polygon key={k} points={poly(R * k)} fill="none" stroke="var(--md-line)" strokeWidth="1" />
            ))}
            {dist.map((d, i) => {
                const [x, y] = pt(i, R);
                return <line key={d.el} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--md-line)" strokeWidth="1" />;
            })}
            <polygon points={valPoly} fill="var(--md-chart-fill)" stroke="var(--md-chart-stroke)" strokeWidth="1.6" strokeLinejoin="round" />
            {dist.map((d, i) => {
                const [x, y] = pt(i, R + 24);
                const isLack = d.el === lacking;
                return (
                    <g key={d.el} textAnchor="middle">
                        <text x={x} y={y - 3} fontSize="16" fontWeight="600"
                            fill={isLack ? 'var(--md-danger)' : 'var(--md-text)'} fontFamily="var(--md-font-serif)">{d.hanja}</text>
                        <text x={x} y={y + 13} fontSize="10.5" fontWeight="600"
                            fill={isLack ? 'var(--md-danger)' : 'var(--md-text-3)'}>{d.pct}%</text>
                    </g>
                );
            })}
        </svg>
    );
}

/* ---------- 수평 막대 (리포트 전용 — 수치 가독성) ---------- */
export function MdChartBars({ dist, lacking }: ChartProps) {
    return (
        <div style={{ display: 'grid', gap: 13, padding: '6px 2px' }}>
            {dist.map((d, i) => {
                const isLack = d.el === lacking;
                return (
                    <div key={d.el} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 38px', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span className="md-serif" style={{ fontSize: 17, fontWeight: 600, color: isLack ? 'var(--md-danger)' : 'var(--md-text)' }}>{d.hanja}</span>
                            <span style={{ fontSize: 11, color: 'var(--md-text-3)' }}>{d.el}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: 'var(--md-accent-soft)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 4,
                                width: `${Math.max(3, d.pct)}%`,
                                background: isLack ? 'var(--md-danger)' : 'var(--md-chart-stroke)',
                                opacity: isLack ? 0.85 : 1,
                                transition: `width 0.9s ${0.08 * i}s var(--md-ease-smooth)`,
                            }}></div>
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right', color: isLack ? 'var(--md-danger)' : 'var(--md-text-2)' }}>{d.pct}%</span>
                    </div>
                );
            })}
        </div>
    );
}
