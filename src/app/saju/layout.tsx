import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "재회 사주 | 재회 가능성·연락 타이밍 진단 - 묘연",
    // SERP에서 잘리지 않으면서 공간을 다 쓰도록 70~160자 범위를 유지한다
    description: "헤어진 그 사람과 다시 만날 수 있을까. 두 사람의 사주로 재회 가능성 점수와 연락하기 좋은 시기(골든 윈도우)를 계산해 드려요. 가입 없이 무료로 먼저 확인할 수 있고, 상대방은 알 수 없어요.",
    alternates: { canonical: "/saju" },
    openGraph: {
        title: "다시, 우리 | 프리미엄 재회 컨설팅 🔮",
        description: "사주 데이터 기반, 연락 최적기와 성공 전략을 알려드립니다.",
        url: "https://dasisaju.com/saju",
        siteName: "다시, 우리",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "다시, 우리 서비스 썸네일",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "다시, 우리 | 프리미엄 재회 컨설팅 🔮",
        description: "사주 데이터 기반, 연락 최적기와 성공 전략을 알려드립니다.",
        images: ["/og-image.png"],
    },
};

export default function SajuLayout({ children }: { children: React.ReactNode }) {
    return children;
}
