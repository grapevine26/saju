'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Gift, CreditCard, Check } from "lucide-react";
import { PRIVACY_POLICY, TERMS_OF_SERVICE, REFUND_POLICY, PolicyData } from "@/constants/policies";

interface PaymentModalProps {
    onClose: () => void;
    onSelectPayment: (method: 'kakao' | 'naver' | 'general', packageId: string, email: string) => void;
}

const PACKAGES = [
    {
        id: "premium",
        title: "프리미엄 리포트",
        subtitle: "재회사주",
        originalPrice: 29900,
        price: 13900,
        discountRate: 53,
        recommended: false,
        icon: "🔮"
    },
    {
        id: "signature",
        title: "시그니처 컨설팅",
        subtitle: "재회사주 + 궁합",
        originalPrice: 59900,
        price: 19900,
        discountRate: 67,
        recommended: true,
        icon: "💫"
    }
];

export default function PaymentModal({ onClose, onSelectPayment }: PaymentModalProps) {
    const [selectedPkg, setSelectedPkg] = useState<string>("signature");
    const [email, setEmail] = useState("");
    const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'refund' | null>(null);

    const currentPackage = PACKAGES.find(p => p.id === selectedPkg)!;
    const totalDiscount = currentPackage.originalPrice ? currentPackage.originalPrice - currentPackage.price : 0;

    const handlePaymentClick = (method: 'kakao' | 'naver' | 'general') => {
        if (!email || !email.includes('@')) return;
        onSelectPayment(method, selectedPkg, email);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md pb-safe">
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[var(--bg-primary)] w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[var(--border-glass)] flex flex-col max-h-[90vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
                {/* 배경 장식 */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[var(--accent-soft)] to-transparent pointer-events-none" />

                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--line-soft)] relative z-10">
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">상세 분석 리포트 결제</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors bg-[var(--bg-glass)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 스크롤 가능한 본문 */}
                <div className="overflow-y-auto flex-1 p-5 space-y-6 scrollbar-hide relative z-10">

                    {/* 상단 할인 배지 */}
                    {totalDiscount > 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold px-4 py-2.5 rounded-xl inline-block w-full text-center"
                        >
                            🎉 총 <span className="text-rose-500">{totalDiscount.toLocaleString()}원</span> 할인받았어요!
                        </motion.div>
                    )}

                    {/* 이메일 입력 */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[var(--text-primary)] ml-1">
                            이메일 주소 <span className="text-rose-400 text-[11px] font-medium">*필수</span>
                        </label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-3.5 text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] transition-colors"
                        />
                        <p className="text-[11px] text-[var(--text-muted)] ml-1">
                            분석이 완료되면 해당 이메일로 링크를 보내드립니다.
                        </p>
                    </div>

                    {/* 패키지 리스트 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-[var(--text-primary)] font-bold text-sm">패키지 선택</h4>
                            <Gift className="w-4 h-4 text-[var(--accent-gold)]" />
                        </div>
                        <div className="space-y-3">
                            {PACKAGES.map((pkg) => {
                                const isSelected = selectedPkg === pkg.id;
                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => setSelectedPkg(pkg.id)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden
                                            ${isSelected
                                                ? 'bg-[var(--accent-soft)] border-[var(--accent-gold)] shadow-[0_0_15px_rgba(216,72,94,0.15)]'
                                                : 'bg-[var(--bg-glass)] border-[var(--border-glass)] hover:opacity-80'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]' : 'border-[var(--text-muted)]'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[15px] font-bold text-white">{pkg.title} {pkg.icon}</span>
                                                        {pkg.recommended && (
                                                            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-md font-bold tracking-wider">추천</span>
                                                        )}
                                                    </div>
                                                    {pkg.subtitle && (
                                                        <p className="text-[12px] text-[var(--text-secondary)] font-medium mt-1">{pkg.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {pkg.originalPrice && (
                                                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                                        <span className="text-[12px] font-bold text-rose-400">{pkg.discountRate}%</span>
                                                        <span className="text-[12px] text-slate-500 line-through">{pkg.originalPrice.toLocaleString()}원</span>
                                                    </div>
                                                )}
                                                <div className={`text-[16px] font-bold ${isSelected ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                                                    {pkg.price.toLocaleString()}원
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 결제 요약 */}
                    <div className="bg-[var(--bg-glass)] p-5 rounded-2xl border border-[var(--border-glass)] space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[var(--text-secondary)] font-medium">상품 판매가</span>
                            <span className="text-[var(--text-primary)]">{(currentPackage.originalPrice || currentPackage.price).toLocaleString()}원</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-rose-400 font-bold">지금 결제 시 할인</span>
                                <span className="text-rose-400 font-bold">-{totalDiscount.toLocaleString()}원</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-[var(--line-soft)]">
                            <span className="text-[var(--text-primary)] font-bold text-[15px]">최종 결제 금액</span>
                            <span className="text-[var(--accent-gold)] font-bold text-[20px]">{currentPackage.price.toLocaleString()}원</span>
                        </div>
                    </div>

                    {/* 간편 결제 버튼 */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => handlePaymentClick('general')}
                            disabled={!email || !email.includes('@')}
                            className="w-full py-4 rounded-[12px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all text-[16px] font-bold"
                            style={email && email.includes('@')
                                ? {background: 'var(--btn-bg)', color: 'var(--btn-ink)', boxShadow: 'var(--btn-shadow)'}
                                : {background: 'var(--bg-glass)', color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid var(--border-glass)'}}
                        >
                            <CreditCard className="w-5 h-5" />
                            {currentPackage.price.toLocaleString()}원 결제하기
                        </button>
                    </div>

                    {/* 동의 안내 문구 */}
                    <div className="space-y-3 pb-8 text-center px-2">
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed break-keep">
                            결제 정보를 확인하였으며 <button onClick={() => setLegalModalType('privacy')} className="text-[var(--text-secondary)] font-bold underline underline-offset-2 hover:text-[var(--accent-gold)]">개인정보 처리방침</button> 및 <button onClick={() => setLegalModalType('terms')} className="text-[var(--text-secondary)] font-bold underline underline-offset-2 hover:text-[var(--accent-gold)]">이용약관</button>, <button onClick={() => setLegalModalType('refund')} className="text-[var(--text-secondary)] font-bold underline underline-offset-2 hover:text-[var(--accent-gold)]">환불정책</button>에 동의합니다.
                        </p>
                    </div>

                </div>
            </motion.div>

            {/* 법적 고지 모달 오버레이 */}
            <AnimatePresence>
                {legalModalType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-[var(--bg-primary)]/95 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-[420px] h-[70vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="font-bold text-gray-800 text-[15px]">
                                    {legalModalType === 'privacy' && '개인정보 처리방침'}
                                    {legalModalType === 'terms' && '이용 약관'}
                                    {legalModalType === 'refund' && '환불 정책'}
                                </h3>
                                <button onClick={() => setLegalModalType(null)} className="p-1.5 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 text-[12px] text-gray-600 leading-relaxed space-y-6 scrollbar-hide">
                                <style jsx global>{`
                                    .highlight-text { color: #d97706; font-weight: 700; }
                                    .highlight-sub { color: #1f2937; font-weight: 700; }
                                    .company-info-bg { background-color: #f3f4f6; }
                                    .company-info-border { border-color: #e5e7eb; }
                                `}</style>
                                {(() => {
                                    const policy: PolicyData | null =
                                        legalModalType === 'privacy' ? PRIVACY_POLICY :
                                            legalModalType === 'terms' ? TERMS_OF_SERVICE :
                                                legalModalType === 'refund' ? REFUND_POLICY : null;

                                    if (!policy) return null;

                                    return (
                                        <div className="space-y-6">
                                            {policy.sections.map((section, idx) => (
                                                <section key={idx}>
                                                    {section.title && (
                                                        <h4 className="text-[14px] font-bold text-gray-900 mb-2">{section.title}</h4>
                                                    )}
                                                    {typeof section.content === 'string' ? (
                                                        <p>{section.content}</p>
                                                    ) : (
                                                        section.content
                                                    )}
                                                    {section.list && (
                                                        <ul className={`mt-2 space-y-1 pl-5 ${legalModalType === 'terms' ? 'space-y-2' : 'list-disc'}`}>
                                                            {section.list.map((item, i) => (
                                                                <li key={i}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {section.subSections?.map((sub, i) => (
                                                        <div key={i} className="mt-2">
                                                            {sub.subtitle && <span className="font-bold text-gray-800">{sub.subtitle} </span>}
                                                            {sub.content}
                                                        </div>
                                                    ))}
                                                    {section.footer}
                                                </section>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
