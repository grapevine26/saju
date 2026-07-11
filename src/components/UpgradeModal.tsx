"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

interface UpgradeModalProps {
    onClose: () => void;
    onStartGuest: (phoneNumber: string) => void;
    onStartMember: (userId: string) => void;
    /** OAuth 로그인 전에 결제 정보를 저장하기 위한 콜백 */
    pendingPaymentInfo?: {
        packageId: string;
        email: string;
        /** 지속 저장된 기록 id — OAuth 복귀를 이 기록의 상세 페이지로 보내 인메모리 상태 유실을 방지 */
        recordId?: string;
    };
}

export default function UpgradeModal({ onClose, onStartGuest, onStartMember, pendingPaymentInfo }: UpgradeModalProps) {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        // 현재 로그인 상태 확인
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUser(user);
            }
        });
    }, [supabase]);

    // OAuth 복귀 지점: 인메모리 상태가 유실되는 /analysis 대신, 지속 저장된 기록의
    // 상세 페이지(/history/{recordId})로 돌아가 안전하게 결제를 재개한다.
    const returnPath = pendingPaymentInfo?.recordId
        ? `/history/${pendingPaymentInfo.recordId}`
        : (typeof window !== 'undefined' ? window.location.pathname : '/');

    /** OAuth 로그인 전에 결제 컨텍스트를 localStorage에 저장 */
    const savePendingPaymentContext = () => {
        if (pendingPaymentInfo) {
            localStorage.setItem('pendingOAuthPayment', JSON.stringify({
                packageId: pendingPaymentInfo.packageId,
                email: pendingPaymentInfo.email,
                recordId: pendingPaymentInfo.recordId,
                returnPath,
                timestamp: Date.now(),
            }));
        }
    };

    const handleKakaoLogin = async () => {
        // OAuth 리다이렉트 전에 결제 정보 저장
        savePendingPaymentContext();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=${returnPath}`,
                scopes: 'profile_nickname account_email'
            }
        });
        if (error) {
            console.error('Kakao login error:', error);
            toast.error('로그인 중 오류가 발생했습니다.');
        }
    };

    const handleGoogleLogin = async () => {
        // OAuth 리다이렉트 전에 결제 정보 저장
        savePendingPaymentContext();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=${returnPath}`
            }
        });
        if (error) {
            console.error('Google login error:', error);
            toast.error('로그인 중 오류가 발생했습니다.');
        }
    };

    if (user) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[var(--bg-primary)] border border-[var(--border-glass)] p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                >
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">결제 및 분석 시작</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6 text-center leading-relaxed">
                        계정이 연동되었습니다.<br />분석이 완료되면(약 3분) 자동으로 기록에 저장됩니다.
                    </p>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-semibold bg-[var(--bg-glass)] text-[var(--text-primary)] active:opacity-80"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => onStartMember(user.id)}
                            className="flex-1 py-3.5 rounded-xl font-bold"
                            style={{background: 'var(--btn-bg)', color: 'var(--btn-ink)', boxShadow: 'var(--btn-shadow)'}}
                        >
                            결제하고 시작
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--bg-primary)] border border-[var(--border-glass)] p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">기록 평생 보관하기</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6 text-center leading-relaxed">
                    프리미엄 리포트를 평생 소장하려면<br />1초 만에 안전하게 시작하세요.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleKakaoLogin}
                        className="w-full py-3.5 rounded-xl font-bold bg-[#FEE500] text-[#000000] flex justify-center items-center gap-2 active:scale-95 transition-transform"
                    >
                        <MessageCircle className="w-5 h-5" />
                        카카오로 1초 만에 시작하기
                    </button>
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3.5 rounded-xl font-bold bg-white text-black flex justify-center items-center gap-2 active:scale-95 transition-transform"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        구글로 계속하기
                    </button>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--border-glass)]"></div>
                    <span className="text-xs text-[var(--text-muted)] font-medium">또는</span>
                    <div className="flex-1 h-px bg-[var(--border-glass)]"></div>
                </div>

                <button
                    onClick={() => onStartGuest('')}
                    className="w-full mt-6 py-3.5 rounded-xl font-medium border border-[var(--border-glass)] text-[var(--text-primary)] hover:bg-[var(--bg-glass)] active:scale-95 transition-all"
                >
                    비회원으로 결제하기
                </button>

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    ✕
                </button>
            </motion.div>
        </div>
    );
}
