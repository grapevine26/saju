"use client";

/**
 * 메뉴 페이지 — 로그인/로그아웃, 리포트 보관함 등 유틸리티 네비게이션
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Archive, LogIn, LogOut, Heart, Sparkles, ChevronRight, HelpCircle, FileText } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useSajuStore } from "@/store/useSajuStore";
import toast from "react-hot-toast";

export default function MenuPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { reunionHistory } = useSajuStore();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user ?? null);
            setLoading(false);
        });
    }, [supabase]);

    const handleKakaoLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "kakao",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/menu`,
                scopes: "profile_nickname account_email",
            },
        });
        if (error) {
            console.error("Kakao login error:", error);
            toast.error("로그인 중 오류가 발생했습니다.");
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/menu`,
            },
        });
        if (error) {
            console.error("Google login error:", error);
            toast.error("로그인 중 오류가 발생했습니다.");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast.success("로그아웃 되었습니다.");
    };

    // 메뉴 항목 정의
    const menuItems = [
        {
            icon: <Archive className="w-5 h-5" />,
            label: "리포트 보관함",
            subtitle: reunionHistory.length > 0 ? `${reunionHistory.length}개의 리포트` : "아직 분석 기록이 없어요",
            href: "/history",
            color: "text-amber-400",
        },
        {
            icon: <HelpCircle className="w-5 h-5" />,
            label: "고객센터",
            subtitle: "실시간 상담하기",
            href: "#",
            color: "text-slate-400",
        },
    ];

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            {/* 상단 헤더 */}
            <header className="flex items-center justify-between p-4 border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-[17px] font-bold text-white tracking-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    다시, 우리
                </h1>
                <div className="w-10" /> {/* 좌우 균형을 위한 스페이서 */}
            </header>

            {/* 프로모션 배너 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-4 mt-5"
            >
                <Link href="/input">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/20 p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[12px] text-amber-400/80 font-medium mb-1">
                                재회 가능성이 궁금하다면
                            </p>
                            <p className="text-[16px] font-bold text-white leading-snug">
                                지금 바로 사주 리포트를 확인하세요
                            </p>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* 환영 메시지 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5 mt-8 mb-6"
            >
                {user ? (
                    <div>
                        <p className="text-amber-400 text-[15px] font-bold mb-1">환영합니다 ✨</p>
                        <p className="text-[13px] text-slate-500 font-medium">
                            {user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username || "회원"}님의 리포트를 확인해보세요.
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-amber-400 text-[15px] font-bold mb-1">
                            감동을 주는 나만의 특별한 이야기,
                        </p>
                        <p className="text-white text-[17px] font-black">다시, 우리 재회 사주</p>
                    </div>
                )}
            </motion.div>

            {/* 메뉴 리스트 */}
            <div className="px-4 space-y-1 flex-1">
                {menuItems.map((item, i) => {
                    const isChannelTalk = item.label === "고객센터";
                    const content = (
                        <div className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group cursor-pointer text-left w-full">
                            <span className={item.color}>{item.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-semibold text-white">{item.label}</p>
                                {item.subtitle && (
                                    <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate">{item.subtitle}</p>
                                )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </div>
                    );

                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.08 }}
                        >
                            {isChannelTalk ? (
                                <button
                                    onClick={() => {
                                        if (window.ChannelIO) {
                                            window.ChannelIO('showMessenger');
                                        } else {
                                            toast.error("고객센터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
                                        }
                                    }}
                                    className="w-full"
                                >
                                    {content}
                                </button>
                            ) : (
                                <Link href={item.href}>
                                    {content}
                                </Link>
                            )}
                        </motion.div>
                    );
                })}

                {/* 로그아웃 버튼 (로그인 상태에서만 표시) */}
                {user && (
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group"
                        >
                            <span className="text-rose-400"><LogOut className="w-5 h-5" /></span>
                            <div className="flex-1 text-left">
                                <p className="text-[15px] font-semibold text-white">로그아웃</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* 하단 구분선 */}
            <div className="px-4 mt-auto">
                <div className="border-t border-white/5 my-4" />
            </div>

            {/* 하단 로그인 버튼 또는 유저 정보 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="px-4 pb-8"
            >
                {loading ? (
                    <div className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                ) : user ? (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                            <Heart className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">
                                {user.user_metadata?.name || user.email || "회원"}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={handleKakaoLogin}
                            className="w-full py-4 rounded-2xl font-bold text-[15px] bg-[#FEE500] text-[#000000] flex justify-center items-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.794 5.11 4.504 6.46-.146.543-.53 1.97-.607 2.275-.096.382.14.377.295.274.122-.081 1.943-1.32 2.735-1.86.683.1 1.392.152 2.073.152 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
                            </svg>
                            카카오로 간편 로그인하기
                        </button>
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 rounded-2xl font-bold text-[15px] bg-white text-black flex justify-center items-center gap-2 active:scale-[0.98] transition-transform"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            구글로 계속하기
                        </button>
                    </div>
                )}
            </motion.div>

            {/* 하단 법적 링크 */}
            <div className="px-4 pb-6 flex items-center justify-center gap-3 text-[11px] text-slate-600">
                <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">이용약관</Link>
                <span>·</span>
                <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">개인정보처리방침</Link>
                <span>·</span>
                <Link href="/legal/refund" className="hover:text-slate-400 transition-colors">환불정책</Link>
            </div>
        </div>
    );
}
