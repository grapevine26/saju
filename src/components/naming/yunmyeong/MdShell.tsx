'use client';

// ─────────────────────────────────────────────
// 윤명 — 공용 앱 셸
// 루트 레이아웃(재회 서비스 공용)의 다크 배경을 수정하지 않고,
// 뷰포트 전체를 테마 배경색으로 덮는 고정 레이어를 깐 뒤
// 그 위에 460px 모바일 컬럼(md-app)을 올린다.
// (fixed 요소는 루트 main의 overflow-hidden에 잘리지 않음)
// ─────────────────────────────────────────────

interface Props {
    theme: 'hanji' | 'obsidian';
    children: React.ReactNode;
}

export default function MdShell({ theme, children }: Props) {
    return (
        <div data-md-theme={theme} style={{ minHeight: '100dvh' }}>
            {/* 뷰포트 전체 배경 (컬럼 양옆 포함) — 클릭은 통과, 인쇄 시 숨김 */}
            <div aria-hidden="true" className="print-hide" style={{ position: 'fixed', inset: 0, background: 'var(--md-bg)', pointerEvents: 'none' }} />
            <div className="md-app">{children}</div>
        </div>
    );
}
