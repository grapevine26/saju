import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PRIVACY_POLICY } from "@/constants/policies";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0e1a] text-slate-300 pb-20">
            <header className="sticky top-0 left-0 right-0 flex items-center p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5">
                <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-white ml-2">개인정보처리방침</span>
            </header>

            <main className="p-6 space-y-8 text-sm leading-relaxed">
                {PRIVACY_POLICY.sections.map((section, idx) => (
                    <section key={idx}>
                        {section.title && (
                            <h2 className="text-lg font-bold text-white mb-4">{section.title}</h2>
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
                                {sub.subtitle && <span className="font-bold text-slate-200">{sub.subtitle} </span>}
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
