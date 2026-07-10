'use client';

import { useEffect, useRef, useState } from 'react';
import { MD_LOADING_STEPS } from '@/features/naming/yunmyeong';

// ─────────────────────────────────────────────
// 윤명 — 연산 로딩 연출 (채택 변형: 오행 만다라)
// - 진행 곡선: 85%까지 약간 느리게 → 마지막 15% 가속 (연산 느낌)
// - 타이머: rAF가 아닌 setInterval(60ms) + 경과시간 계산
//   (백그라운드 탭에서 멈춤 방지 — 핸드오프 명세)
// - API 응답 대기: done=false면 97%에서 홀드, done=true가 되면 100% 진입
// ─────────────────────────────────────────────

function useLoadingProgress(seconds: number, done: boolean, onDone: () => void) {
    const [p, setP] = useState(0);
    const doneRef = useRef(done);
    const onDoneRef = useRef(onDone);
    doneRef.current = done;
    onDoneRef.current = onDone;

    useEffect(() => {
        const t0 = performance.now();
        let fired = false;
        const tick = () => {
            const x = Math.min(1, (performance.now() - t0) / (seconds * 1000));
            // 비선형: 빠르게 → 중간 머뭇 → 마지막 가속
            const eased = x < 0.85 ? x * 0.92 : 0.782 + (x - 0.85) * (0.218 / 0.15);
            let pct = Math.round(eased * 100);
            // 연출 시간이 끝나도 실제 연산(API)이 안 끝났으면 97%에서 대기
            if (!doneRef.current) pct = Math.min(pct, 97);
            setP(pct);
            if (x >= 1 && doneRef.current && !fired) {
                fired = true;
                clearInterval(iv);
                setP(100);
                setTimeout(() => onDoneRef.current(), 450);
            }
        };
        const iv = setInterval(tick, 60);
        tick();
        return () => clearInterval(iv);
    }, [seconds]);

    return p;
}

const ELS = ['木', '火', '土', '金', '水'];

interface Props {
    /** 연출 길이 (초) — 기본 4.5초 */
    seconds?: number;
    /** 실제 연산 완료 여부 (false면 97%에서 홀드) */
    done: boolean;
    onDone: () => void;
}

export default function MdLoadingMandala({ seconds = 4.5, done, onDone }: Props) {
    const p = useLoadingProgress(seconds, done, onDone);
    const si = Math.min(MD_LOADING_STEPS.length - 1, Math.floor((p / 100) * MD_LOADING_STEPS.length));

    return (
        <div className="md-screen" role="status" aria-label="분석 진행 중"
            style={{ justifyContent: 'center', alignItems: 'center', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 210, height: 210, marginBottom: 44 }}>
                <svg viewBox="0 0 210 210" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                    <circle cx="105" cy="105" r="88" fill="none" stroke="var(--md-line)" strokeWidth="1" />
                    <circle cx="105" cy="105" r="88" fill="none" stroke="var(--md-accent)" strokeWidth="1.5"
                        strokeDasharray={`${(p / 100) * 553} 553`} strokeLinecap="round"
                        transform="rotate(-90 105 105)" style={{ transition: 'stroke-dasharray 0.2s linear' }} />
                    <circle cx="105" cy="105" r="56" fill="none" stroke="var(--md-line)" strokeWidth="1" strokeDasharray="2 5" />
                </svg>
                <div className="md-orbit" aria-hidden="true">
                    {ELS.map((e, i) => (
                        <span key={e} style={{
                            position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
                            display: 'block',
                            transform: `rotate(${i * 72}deg) translateY(-88px)`,
                        }}>
                            <span className="md-serif md-orbit-glyph" style={{
                                ['--a' as string]: `${i * 72}deg`,
                                position: 'absolute', left: -17, top: -17, width: 34, height: 34,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 600, color: 'var(--md-accent)',
                                border: '1px solid var(--md-line-strong)', borderRadius: '50%', background: 'var(--md-surface)',
                            }}>{e}</span>
                        </span>
                    ))}
                </div>
                <div className="md-serif md-breathe" style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 40, fontWeight: 600, color: 'var(--md-text)',
                }}>命</div>
            </div>
            <p key={si} style={{ fontSize: 13.5, color: 'var(--md-text-2)', animation: 'md-fadeup 0.4s var(--md-ease-smooth) both', minHeight: 22 }}>
                {MD_LOADING_STEPS[si]}<span className="md-dots"></span>
            </p>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--md-text-3)', fontVariantNumeric: 'tabular-nums' }}>{p}%</div>
        </div>
    );
}
