'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Gift, CreditCard, Check } from "lucide-react";
import { PRIVACY_POLICY, TERMS_OF_SERVICE, REFUND_POLICY, PolicyData } from "@/constants/policies";

interface PaymentModalProps {
    onClose: () => void;
    onPaymentSuccess: () => void;
    tier: 'premium' | 'signature';
}

export default function PaymentModal({ onClose, onPaymentSuccess, tier }: PaymentModalProps) {
    const [email, setEmail] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'refund' | null>(null);

    const price = tier === 'premium' ? "19,000" : "39,000";
    const tierName = tier === 'premium' ? "프리미엄 리포트" : "시그니처 컨설팅";

    const handlePayment = () => {
        if (!email || !agreed) return;
        // 결제 로직 시뮬레이션
        onPaymentSuccess();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-[#0a0e1a] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t sm:border border-white/10 shadow-2xl relative"
            >
                {/* Header */}
                <div className="p-6 pb-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            {tierName}
                            <span className="text-amber-500 text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">HOT</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">평생 소장 가능한 상세 분석 리포트</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Price Card */}
                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 p-6 rounded-3xl border border-amber-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Gift className="w-20 h-20 text-amber-500" />
                        </div>
                        <div className="relative">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">{price}</span>
                                <span className="text-xl font-bold text-slate-400">원</span>
                                <span className="ml-2 text-sm text-slate-500 line-through">49,000원</span>
                            </div>
                            <p className="text-amber-500 text-sm font-bold mt-1">오픈 기념 60% 한정 할인가</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-amber-500" />
                            </div>
                            <span className="text-sm font-medium">재회 가능성 수치 및 시기 분석</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-amber-500" />
                            </div>
                            <span className="text-sm font-medium">상대방 속마음 및 심리 메커니즘</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-amber-500" />
                            </div>
                            <span className="text-sm font-medium">1:1 맞춤형 재회 행동 지침서</span>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1">리포트 받으실 이메일</label>
                        <input 
                            type="email" 
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                    </div>

                    {/* Agreement */}
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500/20"
                            />
                            <span className="text-[13px] text-slate-400 leading-snug group-hover:text-slate-300 transition-colors">
                                <span className="font-bold text-slate-200">개인정보 수집 및 이용</span>과 <span className="font-bold text-slate-200">서비스 이용약관</span>, <span className="font-bold text-slate-200">환불 정책</span>을 확인하였으며 이에 동의합니다.
                            </span>
                        </label>
                        <div className="flex items-center gap-4 text-[12px] text-slate-500 ml-7">
                            <button onClick={() => setLegalModalType('terms')} className="hover:text-slate-300 transition-colors">이용약관</button>
                            <div className="w-[1px] h-2.5 bg-white/10"></div>
                            <button onClick={() => setLegalModalType('privacy')} className="hover:text-slate-300 transition-colors font-bold">개인정보처리방침</button>
                            <div className="w-[1px] h-2.5 bg-white/10"></div>
                            <button onClick={() => setLegalModalType('refund')} className="hover:text-slate-300 transition-colors">환불정책</button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button 
                        onClick={handlePayment}
                        disabled={!email || !agreed}
                        className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                            email && agreed 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/20' 
                            : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                        }`}
                    >
                        <CreditCard className="w-5 h-5" />
                        분석 리포트 받기
                    </button>
                </div>

                {/* 법적 고지 모달 오버레이 */}
                <AnimatePresence>
                    {legalModalType && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a0e1a]/95 backdrop-blur-sm"
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
            </motion.div>
        </div>
    );
}
