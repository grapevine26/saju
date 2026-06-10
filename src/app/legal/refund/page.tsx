import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { REFUND_POLICY } from "@/constants/policies";

export const metadata: Metadata = {
  title: "취소 및 환불 정책 | 다시, 우리 🔮",
  description: "다시, 우리 서비스의 취소 및 환불 정책입니다. 환불 규정과 관련 절차에 관한 상세 안내입니다.",
};

export default function RefundPage() {
    return (
        <div className="min-h-screen bg-[#0a0e1a] text-slate-300 pb-20">
            <header className="sticky top-0 left-0 right-0 flex items-center p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5">
                <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-white ml-2">취소 및 환불 정책</span>
            </header>

            <main className="p-6 space-y-8 text-sm leading-relaxed">
                {REFUND_POLICY.sections.map((section, idx) => (
                    <section key={idx}>
                        {section.title && (
                            <h2 className="text-lg font-bold text-white mb-4">{section.title}</h2>
                        )}
                        {/* 텍스트 렌더링 최적화 */}
                        {typeof section.content === 'string' ? (
                            <p>{section.content}</p>
                        ) : (
                            section.content
                        )}
                        {section.list && (
                            <ul className="mt-2 space-y-1 list-disc pl-5">
                                {section.list.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {section.footer}
                    </section>
                ))}
            </main>
        </div>
    );
}
