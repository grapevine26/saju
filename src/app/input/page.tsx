import type { Metadata } from "next";
import DualInputForm from "@/components/DualInputForm";

export const metadata: Metadata = {
  title: "정보 입력 | 다시, 우리 🔮",
  description: "정밀한 재회 가능성 분석을 위해 나와 상대방의 생년월일시 및 태어난 장소를 입력해 주세요.",
};

export default function InputPage() {
    return (
        <DualInputForm />
    );
}
