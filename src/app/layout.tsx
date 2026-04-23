import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "다시, 우리 | 프리미엄 재회 컨설팅 🔮",
  description: "사주 데이터 분석을 통한 정밀한 재회 가능성 진단. 최적의 연락 타이밍과 전략을 알려드립니다.",
  openGraph: {
    title: "다시, 우리 | 프리미엄 재회 컨설팅 🔮",
    description: "사주 데이터 기반, 연락 최적기와 성공 전략을 알려드립니다.",
    url: "https://reconnection.ai", // 임시 URL
    siteName: "다시, 우리",
    images: [
      {
        url: "/og-image.png", // 퍼블릭 폴더에 위치할 이미지
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
      <body className="antialiased flex justify-center min-h-screen bg-[#0a0e1a]">
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
