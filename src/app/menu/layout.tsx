import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전체 메뉴 | 다시, 우리 🔮",
  description: "다시, 우리 서비스의 전체 메뉴 및 리포트 보관함, 고객센터 안내입니다.",
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
