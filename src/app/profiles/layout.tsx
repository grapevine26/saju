import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 주소록 | 다시, 우리 🔮",
  description: "나와 주변 사람들의 사주 생년월일시 정보를 저장하고 관리하는 주소록입니다.",
};

export default function ProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
