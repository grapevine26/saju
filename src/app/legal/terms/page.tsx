import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TERMS_OF_SERVICE } from "@/constants/policies";

export const metadata: Metadata = {
  title: "이용약관 | 다시, 우리 🔮",
  description: "다시, 우리 서비스의 이용약관입니다. 서비스 이용 조건 및 절차에 대한 안내입니다.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen text-[var(--text-secondary)] pb-20" style={{background:'var(--bg-primary)'}}>
            <header className="sticky top-0 left-0 right-0 flex items-center p-4 bg-[var(--bg-primary)]/90 backdrop-blur-md z-50 border-b border-[var(--line-soft)]">
                <Link href="/" className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-[var(--text-primary)] ml-2">이용약관</span>
            </header>

            <main className="p-6 space-y-8 text-sm leading-relaxed">
                {TERMS_OF_SERVICE.sections.map((section, idx) => (
                    <section key={idx}>
                        {section.title && (
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{section.title}</h2>
                        )}
                        {typeof section.content === 'string' ? (
                            <p>{section.content}</p>
                        ) : (
                            section.content
                        )}
                        {section.list && (
                            <ul className="mt-2 space-y-2">
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
