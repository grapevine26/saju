import type { Metadata } from "next";

// PDF 변환 전용 라우트: 검색 노출 금지 + 서버 Chromium용 이모지 웹폰트 로드
// (리눅스 Chromium에는 시스템 이모지 폰트가 없어 리포트 본문의 이모지가 깨진다)
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function PdfLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet" />
            {children}
        </>
    );
}
