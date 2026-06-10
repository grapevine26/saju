import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "심층 분석 리포트 | 다시, 우리 🔮",
  description: "사주 데이터를 기반으로 도출된 두 사람의 관계 에너지 분석 및 맞춤형 재회 전략 보고서입니다.",
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
