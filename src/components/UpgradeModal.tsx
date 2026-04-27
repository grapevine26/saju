"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import PhoneInput from "./PhoneInput";
import { MessageCircle } from "lucide-react"; // 카카오 아이콘 대신 사용 (또는 커스텀 SVG)

interface UpgradeModalProps {
    onClose: () => void;
    onStartGuest: (phoneNumber: string) => void;
    onStartMember: (userId: string) => void;
}

export default function UpgradeModal({ onClose, onStartGuest, onStartMember }: UpgradeModalProps) {
    const [mode, setMode] = useState<'select' | 'guest'>('select');
    const [phoneNumber, setPhoneNumber] = useState('');
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

    const handleKakaoLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`
            }
        });
        if (error) {
            console.error('Kakao login error:', error);
            alert('로그인 중 오류가 발생했습니다.');
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`
            }
        });
        if (error) {
            console.error('Google login error:', error);
            alert('로그인 중 오류가 발생했습니다.');
        }
    };

    if (user) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0f1423] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                >
                    <h3 className="text-xl font-bold text-white mb-2 text-center">결제 및 분석 시작</h3>
                    <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
                        계정이 연동되었습니다.<br/>분석이 완료되면(약 3분) 자동으로 기록에 저장됩니다.
                    </p>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-semibold bg-white/5 text-slate-300 active:bg-white/10"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => onStartMember(user.id)}
                            className="flex-1 py-3.5 rounded-xl font-bold bg-amber-500 text-white shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:bg-amber-600"
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
                className="bg-[#0f1423] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
                {mode === 'select' ? (
                    <>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">기록 평생 보관하기</h3>
                        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
                            프리미엄 리포트를 평생 소장하려면<br/>1초 만에 안전하게 시작하세요.
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
                            <div className="flex-1 h-px bg-white/10"></div>
                            <span className="text-xs text-slate-500 font-medium">또는</span>
                            <div className="flex-1 h-px bg-white/10"></div>
                        </div>

                        <button
                            onClick={() => setMode('guest')}
                            className="w-full mt-6 py-3.5 rounded-xl font-medium border border-white/10 text-slate-300 hover:bg-white/5 active:scale-95 transition-all"
                        >
                            비회원으로 결제하기
                        </button>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">알림 받으실 연락처</h3>
                        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
                            비회원은 브라우저 캐시 삭제 시 기록이 지워집니다.<br/>분석 완료 시(약 3분) 문자로 링크를 보내드려요!
                        </p>
                        
                        <PhoneInput 
                            value={phoneNumber} 
                            onChange={setPhoneNumber} 
                        />
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setMode('select')}
                                className="flex-1 py-3.5 rounded-xl font-semibold bg-white/5 text-slate-300 active:bg-white/10"
                            >
                                뒤로
                            </button>
                            <button
                                onClick={() => onStartGuest(phoneNumber)}
                                className="flex-1 py-3.5 rounded-xl font-bold bg-amber-500 text-white shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:bg-amber-600"
                            >
                                분석 시작
                            </button>
                        </div>
                    </>
                )}
                
                {mode === 'select' && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                        ✕
                    </button>
                )}
            </motion.div>
        </div>
    );
}
