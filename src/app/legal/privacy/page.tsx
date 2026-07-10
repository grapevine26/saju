import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PRIVACY_POLICY } from "@/constants/policies";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 다시, 우리 🔮",
  description: "다시, 우리 서비스의 개인정보처리방침입니다. 고객님의 소중한 개인정보를 어떻게 보호하고 관리하는지 안내해 드립니다.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen text-[var(--text-secondary)] pb-20" style={{background:'var(--bg-primary)'}}>
            <header className="sticky top-0 left-0 right-0 flex items-center p-4 bg-[var(--bg-primary)]/90 backdrop-blur-md z-50 border-b border-[var(--line-soft)]">
                <Link href="/" className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-[var(--text-primary)] ml-2">개인정보처리방침</span>
            </header>

            <main className="p-6 space-y-8 text-sm leading-relaxed">
                {PRIVACY_POLICY.sections.map((section, idx) => (
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
                            <ul className="mt-2 space-y-1 list-disc pl-5">
                                {section.list.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {section.subSections?.map((sub, i) => (
                            <div key={i} className="mt-2">
                                {sub.subtitle && <span className="font-bold text-[var(--text-primary)]">{sub.subtitle} </span>}
                                {sub.content}
                            </div>
                        ))}
                        {section.footer}
                    </section>
                ))}
            </main>
        </div>
    );
}
