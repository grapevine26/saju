import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "다시, 우리 | 프리미엄 재회 컨설팅 🔮",
    description: "사주 데이터 분석을 통한 정밀한 재회 가능성 진단. 최적의 연락 타이밍과 전략을 알려드립니다.",
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
