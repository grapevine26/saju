"use client";

/**
 * ODD TAROT — 메뉴 페이지
 * 타로 전용 유틸리티 네비게이션 (보관함 · 새 리딩 · 재회 사주 크로스셀 · 고객센터 · 로그인)
 * 사주 메뉴(/menu)와 동일한 구성 원칙, 타로 테마(--tarot-*)로 디자인
 * 로그인 후에는 이 메뉴로 복귀한다 (next=/tarot/menu)
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Archive, Moon, Heart, ChevronRight, HelpCircle, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { TAROT_HISTORY_KEY, TAROT_JOB_ID_KEY } from "@/features/tarot/constants";

const P = "rgba(176,123,180,"; // lavender alpha helper

function countHistory(): number {
    try {
        const raw = localStorage.getItem(TAROT_HISTORY_KEY);
        const arr: { jobId: string }[] = raw ? JSON.parse(raw) : [];
        const legacyJobId = localStorage.getItem(TAROT_JOB_ID_KEY);
        if (legacyJobId && !arr.some(e => e.jobId === legacyJobId)) return arr.length + 1;
        return arr.length;
    } catch {
        return 0;
    }
}

export default function TarotMenuPage() {
    const router = useRouter();
    const supabase = createClient();
    const [historyCount, setHistoryCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setHistoryCount(countHistory());
        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user ?? null);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKakaoLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "kakao",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/tarot/menu`,
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
                redirectTo: `${window.location.origin}/api/auth/callback?next=/tarot/menu`,
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

    const menuItems = [
        {
            icon: <Archive size={19} />,
            label: "리딩 보관함",
            subtitle: historyCount > 0 ? `${historyCount}개의 리딩` : "아직 리딩 기록이 없어요",
            href: "/tarot/history",
            accent: "var(--tarot-accent-gold)",
        },
        {
            icon: <Moon size={19} />,
            label: "새 타로 리딩",
            subtitle: "7장으로 읽는 그 사람의 진심",
            href: "/tarot/input",
            accent: "var(--tarot-accent-light)",
        },
        {
            icon: <Heart size={19} />,
            label: "재회 사주",
            subtitle: "다시 만날 수 있을까, 사주로 보는 골든 타이밍",
            href: "/saju",
            accent: "#F06A7E",
        },
        {
            icon: <HelpCircle size={19} />,
            label: "고객센터",
            subtitle: "실시간 상담하기",
            href: "#channeltalk",
            accent: "var(--tarot-text-3)",
        },
    ];

    return (
        <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
            {/* 헤더 */}
            <header style={{
                display: "flex", alignItems: "center", padding: "16px 20px", gap: 12,
                borderBottom: "1px solid var(--tarot-border)",
                position: "sticky", top: 0, background: "var(--tarot-bg)", zIndex: 10,
            }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--tarot-text-3)", display: "flex" }}
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="tarot-serif" style={{ fontSize: 15, fontWeight: 700, color: "var(--tarot-text-1)", letterSpacing: "0.14em" }}>
                    ODD TAROT
                </span>
            </header>

            {/* 인트로 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{ padding: "26px 24px 18px" }}
            >
                <p style={{ fontSize: 12, color: "var(--tarot-accent-gold)", fontWeight: 700, letterSpacing: "0.06em", margin: 0 }}>
                    ✦ 카드는 기억하고 있습니다
                </p>
                <p className="tarot-serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--tarot-text-1)", margin: "8px 0 0", lineHeight: 1.5 }}>
                    지난 리딩과 새로운 질문,<br />어느 쪽이든 좋아요
                </p>
            </motion.div>

            {/* 메뉴 리스트 */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {menuItems.map((item, i) => {
                    const isChannelTalk = item.href === "#channeltalk";
                    const content = (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 16,
                            padding: "16px 18px", borderRadius: 16,
                            background: "var(--tarot-bg-card)",
                            border: "1px solid var(--tarot-border)",
                            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                            cursor: "pointer",
                        }}>
                            <span style={{ color: item.accent, display: "flex", flexShrink: 0 }}>{item.icon}</span>
                            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--tarot-text-1)", margin: 0 }}>{item.label}</p>
                                <p style={{
                                    fontSize: 12, color: "var(--tarot-text-3)", margin: "3px 0 0",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{item.subtitle}</p>
                            </div>
                            <ChevronRight size={16} color={`${P}0.5)`} style={{ flexShrink: 0 }} />
                        </div>
                    );

                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.07 }}
                        >
                            {isChannelTalk ? (
                                <button
                                    onClick={() => {
                                        if (window.ChannelIO) {
                                            window.ChannelIO("showMessenger");
                                        } else {
                                            toast.error("고객센터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
                                        }
                                    }}
                                    style={{ background: "none", border: "none", padding: 0, width: "100%", fontFamily: "inherit" }}
                                >
                                    {content}
                                </button>
                            ) : (
                                <Link href={item.href} style={{ textDecoration: "none", display: "block" }}>
                                    {content}
                                </Link>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* 로그인 / 계정 */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ padding: "28px 16px 0" }}
            >
                {loading ? (
                    <div style={{ height: 56, borderRadius: 16, background: "rgba(237,232,248,0.05)" }} />
                ) : user ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "14px 18px", borderRadius: 16,
                            background: "var(--tarot-bg-card)",
                            border: "1px solid var(--tarot-border)",
                        }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                                background: "linear-gradient(135deg, rgba(123,91,184,0.4), rgba(61,44,109,0.5))",
                                border: "1px solid var(--tarot-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Moon size={17} color="var(--tarot-accent-gold)" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: 13.5, fontWeight: 700, color: "var(--tarot-text-1)", margin: 0,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{user.user_metadata?.name || user.email || "회원"}</p>
                                <p style={{
                                    fontSize: 11, color: "var(--tarot-text-3)", margin: "2px 0 0",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "12px", borderRadius: 14,
                                background: "none", border: "1px solid var(--tarot-border)",
                                cursor: "pointer", fontFamily: "inherit",
                                fontSize: 13, fontWeight: 600, color: "var(--tarot-text-3)",
                            }}
                        >
                            <LogOut size={14} /> 로그아웃
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <p style={{ fontSize: 12, color: "var(--tarot-text-3)", textAlign: "center", margin: "0 0 2px" }}>
                            로그인하면 리딩 기록을 안전하게 보관할 수 있어요
                        </p>
                        <button
                            onClick={handleKakaoLogin}
                            style={{
                                width: "100%", padding: "15px", borderRadius: 16, border: "none",
                                background: "#FEE500", color: "#000000", fontSize: 15, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="19" height="19">
                                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.794 5.11 4.504 6.46-.146.543-.53 1.97-.607 2.275-.096.382.14.377.295.274.122-.081 1.943-1.32 2.735-1.86.683.1 1.392.152 2.073.152 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
                            </svg>
                            카카오로 간편 로그인하기
                        </button>
                        <button
                            onClick={handleGoogleLogin}
                            style={{
                                width: "100%", padding: "15px", borderRadius: 16, border: "none",
                                background: "#FFFFFF", color: "#000000", fontSize: 15, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="19" height="19" />
                            구글로 계속하기
                        </button>
                    </div>
                )}
            </motion.div>

            {/* 푸터 — 묘연 홈 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ marginTop: 32, textAlign: "center" }}
            >
                <Link href="/" style={{
                    fontSize: 12, color: "var(--tarot-text-3)", textDecoration: "none",
                    letterSpacing: "0.08em",
                }}>
                    묘연 妙緣 홈으로 ›
                </Link>
            </motion.div>
        </div>
    );
}
