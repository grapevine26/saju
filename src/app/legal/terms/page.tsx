import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0e1a] text-slate-300 pb-20">
            <header className="sticky top-0 left-0 right-0 flex items-center p-4 bg-[#0a0e1a]/90 backdrop-blur-md z-50 border-b border-white/5">
                <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-white ml-2">이용약관</span>
            </header>

            <main className="p-6 space-y-8 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제1조 (목적)</h2>
                    <p>
                        본 약관은 다시우리(이하 "회사"라 합니다)가 제공하는 재회 컨설팅 및 운세 서비스(이하 "서비스"라 합니다)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제2조 (용어의 정의)</h2>
                    <p>
                        1. "서비스"라 함은 회사가 제공하는 디지털 콘텐츠 및 제반 서비스를 의미합니다.<br/>
                        2. "이용자"라 함은 본 약관에 따라 회사가 제공하는 서비스를 받는 자를 의미합니다.<br/>
                        3. 본 약관에서 정의되지 않은 용어는 관계 법령 및 일반 상관례에 따릅니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제3조 (약관의 명시와 개정)</h2>
                    <p>
                        1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면이나 링크로 제공합니다.<br/>
                        2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제4조 (서비스의 제공 및 변경)</h2>
                    <p>
                        1. 회사는 이용자에게 입력받은 정보를 바탕으로 자동화된 분석 결과를 디지털 콘텐츠 형태로 제공합니다.<br/>
                        2. 서비스의 분석 결과는 참고용이며, 개인의 결정에 대한 법적 책임이나 결과를 보장하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제5조 (이용요금)</h2>
                    <p>
                        1. 회사가 제공하는 서비스는 유료 및 무료로 구분됩니다. 유료 서비스의 이용 요금 및 결제 방식은 해당 서비스 화면에 명시된 바에 따릅니다.<br/>
                        2. 회사는 결제 대행사를 통해 결제를 처리하며, 결제와 관련된 사항은 결제 대행사의 정책을 따릅니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">제6조 (면책 조항)</h2>
                    <p>
                        1. 회사는 천재지변, 통신망 장애, 기타 불가항력적인 사유로 인해 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br/>
                        2. 회사는 이용자가 제공한 정보의 부정확성으로 인해 발생한 결과에 대해 책임을 지지 않습니다.
                    </p>
                </section>

            </main>
        </div>
    );
}
