'use client';

/**
 * 결제 완료 후 프리미엄 분석 대기 화면 — 원형 게이지 프리뷰
 * 결과 페이지의 ReunionGauge와 같은 형태를 재사용해 시각적 연속성을 준다.
 * 진행률을 알 수 없는 대기이므로 거짓 수치 대신:
 *  - 얇은 안쪽 링: 전체 대기시간에 걸쳐 한 번만 서서히 채워지는 "체감 진행" (framer-motion만 사용 — 끊김 없음)
 *  - 굵은 바깥 아크: 계속 도는 인디케이터 (연산이 실제로 진행 중임을 표시)
 *  - 중앙 숫자: 무료 분석에서 이미 나온 실제 점수를 블러 처리해 재계산 중임을 암시
 */
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const SUB_LABELS = ['끌림지수', '오행보완도', '갈등지수'];

interface PremiumGaugePreviewProps {
    myName?: string;
    partnerName?: string;
    previewScore?: number;
    size?: number;
}

export default function PremiumGaugePreview({ myName, partnerName, previewScore, size = 150 }: PremiumGaugePreviewProps) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const fillProgress = useMotionValue(0);
    const dashoffset = useTransform(fillProgress, (v) => circumference - (v / 100) * circumference);

    const [activeSub, setActiveSub] = useState(0);

    useEffect(() => {
        // 전체 대기 시간(보통 30초~2분)에 걸쳐 88%까지만 서서히 채워짐 — 끝났다는 착각을 주지 않도록 100%는 피한다
        const controls = animate(fillProgress, 88, { duration: 75, ease: 'easeOut' });
        return () => controls.stop();
    }, [fillProgress]);

    useEffect(() => {
        const t = setInterval(() => setActiveSub((v) => (v + 1) % (SUB_LABELS.length + 1)), 1400);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="flex flex-col items-center">
            {(myName && partnerName) && (
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 text-center leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                    <span className="text-[var(--accent-amber)]">{myName}</span>님과 <span className="text-[var(--accent-amber)]">{partnerName}</span>님의<br />
                    재회 가능성을 다시 계산하는 중
                </h2>
            )}

            <div className="relative mt-4" style={{ width: size, height: size }}>
                <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-25 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent)' }}
                />

                <svg width={size} height={size} className="relative z-10">
                    {/* 배경 트랙 */}
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />

                    {/* 체감 진행 링 — 전체 대기 동안 단 한 번, 부드럽게 채워짐 */}
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke="var(--accent-gold)" strokeWidth={8} strokeLinecap="round"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: dashoffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        opacity={0.55}
                    />

                    {/* 계속 도는 인디케이터 아크 — 연산이 살아있음을 표시 */}
                    <motion.g
                        style={{ transformOrigin: '50% 50%' }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                    >
                        <circle
                            cx={size / 2} cy={size / 2} r={radius} fill="none"
                            stroke="var(--accent-amber)" strokeWidth={8} strokeLinecap="round"
                            strokeDasharray={`${circumference * 0.22} ${circumference}`}
                            style={{ filter: 'drop-shadow(0 0 8px rgba(240,106,126,0.5))' }}
                        />
                    </motion.g>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span
                        className="text-3xl font-black text-[var(--text-primary)] tabular-nums select-none"
                        style={{ filter: 'blur(6px)' }}
                    >
                        {previewScore ?? 68}
                    </span>
                    <span className="text-[9.5px] text-[var(--text-muted)] mt-1">예비 점수 재계산 중</span>
                </div>
            </div>

            <div className="flex gap-4 mt-3">
                {SUB_LABELS.map((label, i) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                        <div
                            className="w-[7px] h-[7px] rounded-full transition-all duration-500"
                            style={{
                                background: i < activeSub ? 'var(--accent-amber)' : 'rgba(255,255,255,0.15)',
                                boxShadow: i < activeSub ? '0 0 6px var(--accent-amber)' : 'none',
                            }}
                        />
                        <span className="text-[8.5px] text-[var(--text-muted)]">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
