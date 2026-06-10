import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "분석 완료 | 다시, 우리 🔮",
  description: "두 사람의 사주를 정밀 분석한 궁합 및 재회 가능성 점수 결과입니다.",
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
