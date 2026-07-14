'use client';

/**
 * 무료 분석 로딩 화면 — 파문 코어 + 로테이팅 팁
 * 가짜 진행 단계를 나열하지 않고, 대기 시간을 실제로 읽을 만한
 * 재회·궁합 상식으로 채운다. (무료 결과는 점수 + 카드 2장뿐이므로
 * 여러 단계를 거치는 듯한 과장된 인상을 주지 않는 것이 원칙)
 */
import { useEffect, useState } from 'react';

const C = {
    accentBright: '#F06A7E',
    accentSoft: 'rgba(216,72,94,0.10)',
    accentBorder: 'rgba(216,72,94,0.35)',
    ink: '#F0EAEB',
    sub: '#9C9199',
    serif: "'Noto Serif KR', serif",
};

const TIPS = [
    '재회는 사주 궁합보다 "연락 타이밍"이 좌우하는 경우가 훨씬 많아요.',
    '오행이 서로 다른 커플일수록 오히려 강하게 끌리는 경우가 많습니다.',
    '같은 궁합이라도 대운보다 그 해의 세운이 재회 확률에 더 크게 작용해요.',
    '짧은 이별일수록 "왜 헤어졌는가"보다 "지금 무엇이 달라졌는가"가 중요해요.',
];

interface AnalysisLoadingProps {
    myName: string;
    partnerName: string;
}

export default function AnalysisLoading({ myName, partnerName }: AnalysisLoadingProps) {
    const [tipIdx, setTipIdx] = useState(0);
    const [tipVisible, setTipVisible] = useState(true);

    useEffect(() => {
        const t = setInterval(() => {
            setTipVisible(false);
            setTimeout(() => {
                setTipIdx((i) => (i + 1) % TIPS.length);
                setTipVisible(true);
            }, 300);
        }, 3600);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{ background: '#0A090C', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}
            className="flex flex-col items-center justify-center p-6">
            <style>{`
                @keyframes saju-ripple-out {
                    0%   { width: 26px; height: 26px; opacity: 0.7; border-width: 1.5px; }
                    100% { width: 92px; height: 92px; opacity: 0;   border-width: 0.5px; }
                }
                @keyframes saju-core-shimmer {
                    0%, 100% { filter: brightness(1); }
                    50%      { filter: brightness(1.25); }
                }
            `}</style>

            {/* 배경 글로우 */}
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 240, height: 240, background: 'radial-gradient(circle, rgba(216,72,94,0.15) 0%, transparent 72%)',
                filter: 'blur(18px)', pointerEvents: 'none',
            }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 999, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, marginBottom: 22, position: 'relative' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accentBright, boxShadow: `0 0 6px ${C.accentBright}` }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.accentBright, letterSpacing: '0.03em' }}>무료 분석</span>
            </div>

            {/* 파문 코어 */}
            <div style={{ position: 'relative', width: 92, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {[0, 0.9, 1.8].map((delay) => (
                    <div key={delay} style={{
                        position: 'absolute', borderRadius: '50%',
                        border: '1.5px solid rgba(240,106,126,0.5)',
                        animation: `saju-ripple-out 2.8s ease-out ${delay}s infinite`,
                    }} />
                ))}
                <div style={{
                    position: 'relative', width: 26, height: 26, borderRadius: '50%', zIndex: 2,
                    background: 'radial-gradient(circle at 35% 30%, #F6879A, #D8485E 55%, #A82E42 100%)',
                    boxShadow: '0 0 18px rgba(216,72,94,0.5)',
                    animation: 'saju-core-shimmer 2.8s ease-in-out infinite',
                }} />
            </div>

            <h2 style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, lineHeight: 1.45, textAlign: 'center', marginBottom: 22, wordBreak: 'keep-all', position: 'relative' }}>
                {myName && partnerName ? (
                    <>{myName}님과 {partnerName}님의<br />인연을 들여다보는 중</>
                ) : (
                    <>두 사람의 인연을<br />들여다보는 중</>
                )}
            </h2>

            {/* 로테이팅 팁 */}
            <div style={{
                width: '100%', maxWidth: 280, background: 'rgba(216,72,94,0.06)', border: '1px solid rgba(216,72,94,0.22)',
                borderRadius: 12, padding: '13px 15px', textAlign: 'left', minHeight: 82,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, position: 'relative',
            }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: C.accentBright, textTransform: 'uppercase' }}>Tip</span>
                <p style={{
                    fontSize: 12, color: '#d9cfd1', lineHeight: 1.65, margin: 0, wordBreak: 'keep-all',
                    opacity: tipVisible ? 1 : 0, transition: 'opacity 0.3s ease',
                }}>
                    {TIPS[tipIdx]}
                </p>
            </div>

            <p style={{ fontSize: 11, color: '#5F565D', marginTop: 16, lineHeight: 1.6, textAlign: 'center', position: 'relative' }}>
                보통 10~20초 정도 걸려요
            </p>
        </div>
    );
}
