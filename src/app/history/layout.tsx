import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "리포트 보관함 | 다시, 우리 🔮",
  description: "이전에 분석했던 재회 리포트 목록을 보관하고 다시 확인합니다.",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
