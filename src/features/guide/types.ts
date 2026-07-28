/**
 * 칼럼 공통 타입 — 재회 사주(/saju/guide)와 타로(/tarot/guide)가 같은 구조를 쓴다.
 * 렌더링 컴포넌트도 공유하되, 색과 링크는 각 라우트가 주입해 두 세계관을 섞지 않는다.
 */

/** 문단 블록 — p 안의 **굵게**는 렌더링 시 강조로 변환된다 */
export type Block =
    | { t: 'h2'; text: string }
    | { t: 'p'; text: string }
    | { t: 'hr' };

export interface Column {
    slug: string;
    /** 검색 결과용 제목 */
    title: string;
    /** 페이지 안에서 보이는 제목 (H1) */
    heading: string;
    description: string;
    /** 목록·카드에 쓰는 한 줄 요약 */
    excerpt: string;
    keywords: string[];
    publishedAt: string;
    blocks: Block[];
    /** 본문 아래 CTA 문구 */
    ctaLead: string;
    /** 이어 읽을 칼럼 슬러그 */
    related: string[];
    faqs: { q: string; a: string }[];
}

/** 칼럼 페이지가 쓰는 색·링크 묶음. 서비스마다 다른 값을 주입한다. */
export interface GuideTheme {
    card: string; cardBorder: string;
    accentBorder: string; accentSoft: string; accentBright: string;
    ink: string; sub: string; muted: string; lineSoft: string;
    btnBg: string; btnInk: string;
    serif: string; r: number;
}

export interface GuideConfig {
    /** 목록 페이지 경로 (예: /saju/guide) */
    basePath: string;
    /** 서비스 랜딩 경로 (예: /saju) */
    servicePath: string;
    /** 브레드크럼에 쓸 서비스 이름 (예: 재회 사주) */
    serviceName: string;
    /** 목록 페이지 이름 (예: 재회 가이드) */
    guideName: string;
    /** CTA 버튼 문구 */
    ctaLabel: string;
    /** CTA 버튼 아래 보조 문구 */
    ctaNote: string;
    /** 스키마 publisher 이름 */
    siteName: string;
}

/** 슬러그로 칼럼 찾기 — Next.js params가 percent-encoding으로 올 수 있어 디코딩을 보장한다 */
export const findColumn = (columns: Column[], slug: string): Column | undefined => {
    let decoded = slug;
    try { decoded = decodeURIComponent(slug); } catch { /* 이미 디코딩됨 */ }
    return columns.find((c) => c.slug === decoded);
};
