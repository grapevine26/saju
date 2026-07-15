'use client';

/**
 * framer-motion 전역 설정 — OS의 "동작 줄이기(prefers-reduced-motion)" 설정을 존중한다.
 * 설정이 켜진 사용자에게는 transform 계열 애니메이션(별 깜빡임·펄스·부유 등)이
 * 자동으로 비활성화되고 opacity 전환만 유지된다. (접근성: 전정기관 민감 사용자 배려)
 */
import { MotionConfig } from 'framer-motion';

export default function MotionProvider({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
