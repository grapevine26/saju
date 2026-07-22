import type { Metadata } from "next";
import HapThemeWrapper from "./HapThemeWrapper";

export const metadata: Metadata = {
    title: "운명의 합 | 사주로 읽는 두 사람의 궁합 리포트",
    description: "우리는 운명의 합일까? 첫 만남의 설계도부터 연애의 실전, 함께 만드는 생활, 최종 판정까지 — 두 사람의 사주가 말하는 궁합의 모든 것.",
    openGraph: {
        title: "운명의 합 | 사주로 읽는 두 사람의 궁합 리포트",
        description: "궁합 총점 6항목과 등급표, 남녀 시선을 나눈 비교 분석까지 — 두 사람의 사주가 말하는 궁합의 모든 장면.",
        url: "https://dasisaju.com/hap",
        siteName: "운명의 합",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "운명의 합" }],
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "운명의 합 | 사주로 읽는 두 사람의 궁합 리포트",
        description: "우리는 운명의 합일까? 궁합 총점 6항목부터 최종 판정까지.",
        images: ["/og-image.png"],
    },
};

export default function HapLayout({ children }: { children: React.ReactNode }) {
    return <HapThemeWrapper>{children}</HapThemeWrapper>;
}
