'use client';

/**
 * 인앱 브라우저(인스타/페북 웹뷰 등) 소프트 키보드 대응 훅
 *
 * 문제: iOS 웹뷰는 키보드가 열려도 레이아웃 뷰포트를 줄이지 않아
 * (interactive-widget은 크로미움 전용) 하단 입력칸이 키보드에 가려지고,
 * 폼 맨 아래 필드는 아래쪽 스크롤 공간이 없어 scrollIntoView로도 못 올린다.
 *
 * 해결: visualViewport로 키보드가 가린 높이를 실측해
 *  1) keyboardPadding — 그만큼 폼 하단에 동적 여백을 만들어 스크롤 공간 확보
 *  2) 포커스된 입력칸을 "보이는 영역"의 상단 30% 지점으로 스크롤
 *  3) 키보드 높이가 바뀔 때(열림/전환)도 포커스 필드를 다시 정렬
 */
import { useEffect, useRef, useState } from 'react';

const isKeyboardTarget = (el: HTMLElement): boolean => {
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    const type = (el as HTMLInputElement).type;
    return type !== 'checkbox' && type !== 'radio' && type !== 'button';
};

const scrollToVisibleTop = (el: HTMLElement) => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const visibleHeight = vv ? vv.height : window.innerHeight;
    const rect = el.getBoundingClientRect();
    // 보이는 영역(키보드 위) 기준 상단 30% 지점으로
    const delta = rect.top - visibleHeight * 0.3;
    if (Math.abs(delta) > 8) window.scrollBy({ top: delta, behavior: 'smooth' });
};

export function useKeyboardAwareForm() {
    const [keyboardPadding, setKeyboardPadding] = useState(0);
    const focusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const onViewportChange = () => {
            // 키보드(및 인앱 하단 바)가 가린 높이
            const overlap = Math.max(0, window.innerHeight - vv.height);
            setKeyboardPadding(Math.round(overlap));
            // 키보드 애니메이션이 끝나 뷰포트가 확정된 뒤 포커스 필드 재정렬
            if (focusedRef.current) {
                const el = focusedRef.current;
                setTimeout(() => { if (focusedRef.current === el) scrollToVisibleTop(el); }, 80);
            }
        };
        vv.addEventListener('resize', onViewportChange);
        return () => vv.removeEventListener('resize', onViewportChange);
    }, []);

    const handleFieldFocus = (e: React.FocusEvent<HTMLElement>) => {
        const el = e.target as HTMLElement;
        if (!isKeyboardTarget(el)) return;
        focusedRef.current = el;
        // visualViewport resize 이벤트가 안 오는 환경 대비 폴백 (키보드 애니메이션 후)
        setTimeout(() => { if (focusedRef.current === el) scrollToVisibleTop(el); }, 350);
    };

    const handleFieldBlur = (e: React.FocusEvent<HTMLElement>) => {
        if (focusedRef.current === (e.target as HTMLElement)) focusedRef.current = null;
    };

    return { keyboardPadding, handleFieldFocus, handleFieldBlur };
}
