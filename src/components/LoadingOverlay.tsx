'use client';

import React, { useState, useEffect } from 'react';

/* ── 토큰 ── */
const C = {
  accent: '#D8485E',
  accentBright: '#F06A7E',
  accentSoft: 'rgba(216,72,94,0.10)',
  accentBorder: 'rgba(216,72,94,0.35)',
  ink: '#F0EAEB',
  sub: '#9C9199',
  muted: '#5F565D',
  serif: "'Noto Serif KR', serif",
};

interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible: visible }: LoadingOverlayProps) {
  const steps = [
    { text: '두 사람의 명식 데이터를 교차 분석 중입니다...', sub: '사주 원국 정밀 대조' },
    { text: '과거의 흐름과 현재의 운기를 대조하는 중...', sub: '대운 · 세운 · 월운 분석' },
    { text: '숨겨진 속마음과 무의식을 들여다보고 있어요.', sub: '심리 기제 & 미련 지수 산출' },
    { text: '맞춤형 재회 행동 가이드라인을 작성 중입니다...', sub: '골든 윈도우 캘린더 생성' },
    { text: '거의 다 완료되었습니다. 잠시만 기다려주세요!', sub: '최종 리포트 편집 중' },
  ];

  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!visible) { setIdx(0); setTick(0); return; }
    const t1 = setInterval(() => setIdx(i => Math.min(i + 1, steps.length - 1)), 2200);
    const t2 = setInterval(() => setTick(t => t + 1), 80);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [visible]);

  if (!visible) return null;

  // 나비 날개 펄럭임 (0.56 ~ 1.0)
  const flap = Math.sin(tick * 0.18) * 0.22 + 0.78;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(6,5,8,0.92)', backdropFilter: 'blur(16px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 330, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* 배경 글로우 */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(216,72,94,0.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(8px)' }} />

        {/* 실 + 나비 SVG */}
        <div style={{ position: 'relative', width: 280, height: 140, marginBottom: 8 }}>
          <svg width="280" height="140" viewBox="0 0 280 140" fill="none" style={{ filter: 'drop-shadow(0 0 12px rgba(216,72,94,0.5))' }}>
            {/* 이어진 실 */}
            <path
              d="M20 20 C20 60 40 75 80 82 C115 88 148 78 170 74 C192 70 218 66 254 72 C268 77 272 96 270 118"
              stroke={C.accent} strokeWidth="1.6" fill="none" opacity="0.7"
            />
            {/* 실 끝점 — 나 */}
            <circle cx="22" cy="20" r="4" fill={C.accentBright} opacity="0.9" />
            <circle cx="22" cy="20" r="9" stroke={C.accent} strokeOpacity="0.35" fill="none" />
            {/* 실 끝점 — 그 사람 */}
            <circle cx="270" cy="118" r="4" fill={C.accentBright} opacity="0.9" />
            <circle cx="270" cy="118" r="9" stroke={C.accent} strokeOpacity="0.35" fill="none" />

            {/* 나비 — 실 위 (170, 46) */}
            <g transform="translate(170, 46)">
              {/* 위쪽 날개 */}
              <path d={`M0 10 C${-28*flap} -4 ${-44*flap} 6 ${-42*flap} 18 C${-41*flap} 30 ${-24*flap} 32 0 28Z`} stroke={C.accent} strokeWidth="1.5" fill="rgba(216,72,94,0.15)" strokeLinejoin="round" />
              <path d={`M0 10 C${28*flap} -4 ${44*flap} 6 ${42*flap} 18 C${41*flap} 30 ${24*flap} 32 0 28Z`} stroke={C.accent} strokeWidth="1.5" fill="rgba(216,72,94,0.15)" strokeLinejoin="round" />
              {/* 아래 날개 */}
              <path d={`M0 26 C${-20*flap} 32 ${-28*flap} 32 ${-24*flap} 40 C${-20*flap} 46 ${-10*flap} 46 0 42Z`} stroke={C.accent} strokeWidth="1.3" fill="rgba(216,72,94,0.1)" strokeLinejoin="round" />
              <path d={`M0 26 C${20*flap} 32 ${28*flap} 32 ${24*flap} 40 C${20*flap} 46 ${10*flap} 46 0 42Z`} stroke={C.accent} strokeWidth="1.3" fill="rgba(216,72,94,0.1)" strokeLinejoin="round" />
              {/* 몸통 */}
              <line x1="0" y1="8" x2="0" y2="44" stroke={C.accentBright} strokeWidth="2" strokeLinecap="round" />
              {/* 더듬이 */}
              <path d="M0 8 C-6 2 -10 -1 -12 -4" stroke={C.accentBright} strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M0 8 C6 2 10 -1 12 -4" stroke={C.accentBright} strokeWidth="1" fill="none" strokeLinecap="round" />
              <circle cx="-12" cy="-4" r="1.5" fill={C.accentBright} />
              <circle cx="12" cy="-4" r="1.5" fill={C.accentBright} />
            </g>

            {/* 파티클 */}
            {([[55,84,0.6],[95,79,0.4],[158,70,0.5],[195,70,0.3]] as [number,number,number][]).map(([x,y,o],i) => (
              <circle key={i} cx={x} cy={y} r="1.8" fill={C.accentBright} opacity={o * (0.6 + 0.4 * Math.sin(tick * 0.1 + i))} />
            ))}
          </svg>
        </div>

        {/* 텍스트 카드 */}
        <div style={{ width: '100%', background: 'rgba(15,10,14,0.85)', border: `1px solid ${C.accentBorder}`, borderRadius: 20, padding: '24px 24px 22px', textAlign: 'center', backdropFilter: 'blur(8px)', position: 'relative' }}>
          {/* 상단 라인 */}
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.accentBright, margin: '0 0 10px', textTransform: 'uppercase' }}>분석 진행 중</p>
          <h3 style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 700, color: C.ink, margin: '0 0 6px', lineHeight: 1.45, wordBreak: 'keep-all' }}>운명의 실을 따라가고 있어요</h3>
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, margin: '0 0 20px', minHeight: 38, wordBreak: 'keep-all' }}>
            {steps[idx].text}
          </p>

          {/* 5단계 진행 바 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? C.accent : 'rgba(255,255,255,0.08)', transition: 'background 0.4s', boxShadow: i === idx ? `0 0 6px ${C.accent}` : 'none' }} />
            ))}
          </div>

          {/* 현재 단계 뱃지 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 999 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accentBright, boxShadow: `0 0 6px ${C.accentBright}` }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accentBright }}>{steps[idx].sub}</span>
          </div>

          <p style={{ fontSize: 11, color: C.muted, margin: '14px 0 0', lineHeight: 1.6 }}>
            약 2~3분 소요 · 화면을 닫아도 이메일로 전송됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
