import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dasisaju.com"),
  title: "묘연 妙緣 | 재회 사주 · 연애 타로",
  description: "닿을 듯 닿지 않는 인연의 실마리를 읽습니다. 재회 사주 '다시, 우리'와 연애 타로 'ODD TAROT' — 두 가지 길로 당신의 인연을 비춥니다.",
  openGraph: {
    title: "묘연 妙緣 | 재회 사주 · 연애 타로",
    description: "재회 사주 · 연애 타로. 두 가지 길로 당신의 인연을 비춥니다.",
    url: "https://dasisaju.com",
    siteName: "묘연",
    images: [
      {
        url: "/og-image.png", // 퍼블릭 폴더에 위치할 이미지
        width: 1200,
        height: 630,
        alt: "묘연 서비스 썸네일",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "묘연 妙緣 | 재회 사주 · 연애 타로",
    description: "재회 사주 · 연애 타로. 두 가지 길로 당신의 인연을 비춥니다.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon.ico' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png' },
    ],
  },
  manifest: '/favicon_io/site.webmanifest',
};

import ChannelTalk from "@/components/ChannelTalk";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased flex justify-center min-h-screen" style={{background:'radial-gradient(ellipse 1200px 700px at 50% 10%, #1E0C12 0%, #0F080B 45%, #0A090C 75%)'}}>
        <ChannelTalk />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              fontWeight: '500',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        <main className="w-full max-w-[480px] min-h-screen relative overflow-hidden bg-cosmic">
          {children}
        </main>
      </body>
    </html>
  );
}
