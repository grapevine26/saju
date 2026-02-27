import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사주팝 | 톡톡 튀는 내 운명 🔮",
  description: "990원으로 가볍게 '팝'하고 터트려보는 내 사주팔자! 사주팝에서 지금 확인하세요.",
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
      <body className="antialiased bg-slate-100 flex justify-center min-h-screen">
        <main className="w-full max-w-[480px] bg-white min-h-screen shadow-xl relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
