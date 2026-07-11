import type { Metadata } from "next";
import TarotThemeWrapper from "./TarotThemeWrapper";

export const metadata: Metadata = {
    title: "ODD TAROT | 그 사람의 마음을 읽는 타로 리딩",
    description: "그 사람 기억 속에 남은 당신의 묘한 잔상. 7장의 카드가 그 사람의 지금 마음과 두 사람의 앞날을 정밀하게 읽어냅니다. 1라운드 무료.",
    openGraph: {
        title: "ODD TAROT | 그 사람의 마음을 읽는 타로 리딩",
        description: "말 못한 감정, 숨겨진 마음, 두 사람의 앞날. 7장의 카드가 당신만의 언어로 읽어드립니다.",
        url: "https://dasisaju.com/tarot",
        siteName: "ODD TAROT",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ODD TAROT" }],
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ODD TAROT | 그 사람의 마음을 읽는 타로 리딩",
        description: "7장의 카드가 그 사람의 지금 마음과 두 사람의 앞날을 읽어드립니다. 1라운드 무료.",
        images: ["/og-image.png"],
    },
};

export default function TarotLayout({ children }: { children: React.ReactNode }) {
    return <TarotThemeWrapper>{children}</TarotThemeWrapper>;
}
