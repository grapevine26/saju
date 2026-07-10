import type { Metadata } from "next";

// ─────────────────────────────────────────────
// 윤명(潤名) 작명 서비스 전용 레이아웃
// 루트 layout.tsx는 건드리지 않고, /yunmyeong 하위에서만
// Noto Serif KR 400~600 웨이트를 추가 로드한다.
// (루트는 700;900만 로드 — 윤명 디자인은 400~700을 사용)
// ─────────────────────────────────────────────

export const metadata: Metadata = {
    title: "윤명 潤名 | 정통 수리 성명학 정밀 분석",
    description:
        "정통 수리 성명학의 규칙 연산에 명식 맞춤 풀이를 더해, 사주 명식의 빈 곳을 채우는 이름을 찾아드립니다.",
    openGraph: {
        title: "윤명 潤名 | 정통 수리 성명학 정밀 분석",
        description:
            "정통 수리 성명학의 규칙 연산에 명식 맞춤 풀이를 더해, 사주 명식의 빈 곳을 채우는 이름을 찾아드립니다.",
        url: "https://dasisaju.com/yunmyeong",
        siteName: "윤명 潤名",
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "윤명 潤名 | 정통 수리 성명학 정밀 분석",
        description:
            "정통 수리 성명학의 규칙 연산에 명식 맞춤 풀이를 더해, 사주 명식의 빈 곳을 채우는 이름을 찾아드립니다.",
    },
};

export default function NamingLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            {/* body 내 stylesheet link는 유효하며, 루트 head를 수정하지 않기 위한 선택 */}
            <link
                href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600&display=swap"
                rel="stylesheet"
            />
            {children}
        </>
    );
}
