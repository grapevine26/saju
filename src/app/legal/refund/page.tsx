import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
                <section>
                    <h2 className="text-lg font-bold text-white mb-4">1. 환불의 원칙 (디지털 콘텐츠)</h2>
                    <p>
                        다시우리의 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 제공되는 디지털 콘텐츠(운세 및 사주 분석 리포트)입니다. 제공 즉시 사용이 완료되는 디지털 재화의 특성상, <strong>분석이 완료되어 결과 화면(URL)이 제공된 이후에는 단순 변심으로 인한 환불 및 청약 철회가 불가능합니다.</strong>
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">2. 환불이 가능한 경우</h2>
                    <p>
                        아래의 경우에 한하여 결제 취소 및 환불이 가능합니다.<br/>
                        1. 결제 후 시스템 오류로 인해 24시간 내에 분석 결과가 제공되지 않은 경우<br/>
                        2. 결제 직후 분석 프로세스가 시작되기 전 (결제 후 5분 이내, 결과 생성 전) 요청한 경우<br/>
                        3. 회사 측의 귀책사유로 인해 정상적인 서비스를 도저히 이용할 수 없는 경우
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">3. 환불 신청 절차</h2>
                    <p>
                        환불 요건에 해당하는 경우, 아래 고객센터를 통해 환불을 접수하실 수 있습니다.<br/>
                        - 고객센터 이메일 : help@sajupop.com<br/>
                        - 필수 기재 사항 : 결제하신 분의 전화번호, 결제 일시, 환불 사유<br/><br/>
                        환불 신청 접수 후, 회사는 영업일 기준 3일 이내에 환불 규정에 따른 처리 결과를 안내해 드립니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-4">4. 책임 한계</h2>
                    <p>
                        제공되는 사주 분석 및 컨설팅 내용은 참고용 정보입니다. 분석 결과에 불만족하거나, 결과대로 이루어지지 않았다는 사유는 환불의 사유가 될 수 없습니다.
                    </p>
                </section>
            </main>
        </div>
    );
}
