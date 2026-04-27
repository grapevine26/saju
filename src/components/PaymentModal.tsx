"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { X, CheckCircle2, Gift, CreditCard, Check } from "lucide-react";

interface PaymentModalProps {
    onClose: () => void;
    onSelectPayment: (method: 'kakao' | 'naver' | 'general', packageId: string) => void;
}

const PACKAGES = [
    {
        id: "basic",
        title: "재회사주",
        originalPrice: 29900,
        price: 13900,
        discountRate: 53,
        recommended: false,
        icon: "🔮"
    },
    {
        id: "premium",
        title: "완벽한 재회를 위한 궁합 플랜",
        subtitle: "재회사주 + 궁합",
        originalPrice: 59900,
        price: 19900,
        discountRate: 67,
        recommended: true,
        icon: "💫"
    }
];


export default function PaymentModal({ onClose, onSelectPayment }: PaymentModalProps) {
    const [selectedPkg, setSelectedPkg] = useState<string>("premium");


    const currentPackage = PACKAGES.find(p => p.id === selectedPkg)!;
    const totalDiscount = currentPackage.originalPrice ? currentPackage.originalPrice - currentPackage.price : 0;

    const handlePaymentClick = (method: 'kakao' | 'naver' | 'general') => {
        onSelectPayment(method, selectedPkg);
    };


    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md pb-safe">
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#0f1423] w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/10 flex flex-col max-h-[90vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
                {/* 배경 장식 */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
                    <h3 className="text-[18px] font-bold text-white tracking-tight">프리미엄 리포트 결제</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full transition-colors bg-white/5">
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

                    {/* 패키지 리스트 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-slate-300 font-bold text-sm">패키지 할인혜택</h4>
                            <Gift className="w-4 h-4 text-amber-500" />
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
                                                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-500'}`}>
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
                                                        <p className="text-[12px] text-slate-400 font-medium mt-1">{pkg.subtitle}</p>
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
                                                <div className={`text-[16px] font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
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
                    <div className="bg-[#0a0e1a]/50 p-5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium">상품 판매가</span>
                            <span className="text-slate-300">{(currentPackage.originalPrice || currentPackage.price).toLocaleString()}원</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-rose-400 font-bold">지금 결제 시 할인</span>
                                <span className="text-rose-400 font-bold">-{totalDiscount.toLocaleString()}원</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <span className="text-white font-bold text-[15px]">최종 결제 금액</span>
                            <span className="text-amber-400 font-bold text-[20px]">{currentPackage.price.toLocaleString()}원</span>
                        </div>
                    </div>

                    {/* 간편 결제 버튼 */}
                    <div className="space-y-3 pt-2 pb-6">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handlePaymentClick('kakao')}
                                className="flex-1 py-3.5 bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-[12px] flex items-center justify-center active:scale-[0.98] transition-transform"
                            >
                                <Image 
                                    src="/images/kakao_pay_icon.png" 
                                    alt="카카오페이" 
                                    width={90} 
                                    height={28} 
                                    className="h-[26px] w-auto object-contain" 
                                />
                            </button>
                            <button 
                                onClick={() => handlePaymentClick('naver')}
                                className="flex-1 py-3.5 bg-[#00DE5A] hover:bg-[#00DE5A]/90 rounded-[12px] flex items-center justify-center active:scale-[0.98] transition-transform"
                            >
                                <Image 
                                    src="/naver_pay.svg" 
                                    alt="네이버페이" 
                                    width={90} 
                                    height={24} 
                                    className="h-5 w-auto object-contain" 
                                />
                            </button>
                        </div>
                        <button 
                            onClick={() => handlePaymentClick('general')}
                            className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-[12px] flex items-center justify-center gap-2 border border-white/10 active:scale-[0.98] transition-all text-[15px]"
                        >
                            <CreditCard className="w-4 h-4" />
                            일반 결제
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}


