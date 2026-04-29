import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
                <section>
                    <p>
                        다시우리(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법규를 준수하고 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">1. 수집하는 개인정보 항목</h2>
                    <p>
                        회사는 서비스 제공, 결제 처리, 알림 발송을 위해 아래와 같은 개인정보를 수집하고 있습니다.<br/>
                        - 필수항목 : 전화번호, 이름(또는 닉네임), 생년월일, 출생시간, 성별, 결제 기록<br/>
                        - 선택항목 : 없음
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">2. 개인정보의 수집 및 이용 목적</h2>
                    <p>
                        수집한 개인정보는 다음의 목적을 위해 활용됩니다.<br/>
                        - 콘텐츠 제공, 유료 결제 및 요금 정산<br/>
                        - 분석 결과 알림톡(문자) 전송<br/>
                        - 고객 상담 및 불만 처리
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
                    <p>
                        원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.<br/>
                        - 대금결제 및 재화 등의 공급에 관한 기록 : 5년 (전자상거래 등에서의 소비자보호에 관한 법률)<br/>
                        - 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년 (전자상거래 등에서의 소비자보호에 관한 법률)
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">4. 개인정보의 파기절차 및 방법</h2>
                    <p>
                        회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체없이 해당 개인정보를 파기합니다. 파기의 절차, 기한 및 방법은 다음과 같습니다.<br/>
                        전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.
                    </p>
                </section>

            </main>
        </div>
    );
}
