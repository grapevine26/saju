"use client";

/**
 * ODD TAROT — 메뉴 페이지
 * 타로 전용 유틸리티 네비게이션 (보관함 · 새 리딩 · 재회 사주 크로스셀 · 고객센터)
 * 사주 메뉴(/menu)와 동일한 구성 원칙, 타로 테마(--tarot-*)로 디자인
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Archive, Moon, Heart, ChevronRight, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
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
    const [historyCount, setHistoryCount] = useState(0);

    useEffect(() => {
        setHistoryCount(countHistory());
    }, []);

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

            {/* 푸터 — 묘연 홈 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: 36, textAlign: "center" }}
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
