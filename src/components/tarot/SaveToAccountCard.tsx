"use client";

/**
 * 결제 후 "계정에 저장하기" 카드 — 결제 전 로그인 강요 대신, 결과를 받은 뒤
 * 가볍게 계정 연결을 제안한다 (전환을 깎지 않는 사후 로그인 유도).
 * 로그인 → OAuth 복귀 → 자동 연결까지 처리하며, 이미 연결된 리딩에는 노출되지 않는다.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

const CLAIM_INTENT_KEY = "tarot_claim_intent";

interface Props {
    jobId: string;
    hasOwner: boolean;
}

export default function SaveToAccountCard({ jobId, hasOwner }: Props) {
    const [mode, setMode] = useState<"hidden" | "loggedout" | "loggedin" | "saving" | "saved">("hidden");

    const claim = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/tarot/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            });
            const data = await res.json();
            return !!data.success;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        if (hasOwner) return; // 이미 어떤 계정에 연결됨 — 노출 안 함
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) {
                setMode("loggedout");
                return;
            }
            // OAuth 복귀 직후: 로그인 전에 눌렀던 저장 의도를 이어서 실행
            let intent: string | null = null;
            try { intent = sessionStorage.getItem(CLAIM_INTENT_KEY); } catch {}
            if (intent === jobId) {
                try { sessionStorage.removeItem(CLAIM_INTENT_KEY); } catch {}
                setMode("saving");
                setMode((await claim()) ? "saved" : "loggedin");
            } else {
                setMode("loggedin");
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, hasOwner]);

    const handleDirectSave = async () => {
        setMode("saving");
        setMode((await claim()) ? "saved" : "loggedin");
    };

    const handleLogin = async (provider: "kakao" | "google") => {
        try { sessionStorage.setItem(CLAIM_INTENT_KEY, jobId); } catch {}
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/tarot/result/${jobId}`,
                ...(provider === "kakao" ? { scopes: "profile_nickname account_email" } : {}),
            },
        });
    };

    if (mode === "hidden") return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
                marginTop: 28, borderRadius: 18, padding: "20px 22px",
                background: "rgba(27,31,74,0.45)",
                border: "1px solid var(--tarot-border)",
            }}
        >
            {mode === "saved" ? (
                <p style={{ fontSize: 13.5, color: "var(--tarot-text-1)", margin: 0, textAlign: "center", fontWeight: 600 }}>
                    ✓ 계정에 저장됐어요 — 어느 기기에서든 지난 리딩에서 볼 수 있어요
                </p>
            ) : (
                <>
                    <p className="tarot-serif" style={{ fontSize: 15.5, fontWeight: 700, color: "var(--tarot-text-1)", marginBottom: 6 }}>
                        이 리딩, 계정에 저장해두세요
                    </p>
                    <p style={{ fontSize: 12.5, color: "var(--tarot-text-2)", lineHeight: 1.7, marginBottom: 14 }}>
                        지금은 이 기기에서만 볼 수 있어요. 계정에 연결하면 폰을 바꾸거나 링크를 잃어버려도 지난 리딩에서 다시 열 수 있습니다.
                    </p>
                    {mode === "loggedin" || mode === "saving" ? (
                        <button
                            onClick={handleDirectSave}
                            disabled={mode === "saving"}
                            style={{
                                display: "block", width: "100%", padding: "13px 20px", borderRadius: 12,
                                background: "var(--tarot-btn-bg)", border: "none", cursor: "pointer",
                                color: "#FFF", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
                                opacity: mode === "saving" ? 0.6 : 1,
                            }}
                        >
                            {mode === "saving" ? "저장 중..." : "내 계정에 저장하기"}
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => handleLogin("kakao")}
                                style={{
                                    flex: 1, padding: "12px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                                    background: "#FEE500", color: "#191919", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                                }}
                            >
                                카카오로 저장
                            </button>
                            <button
                                onClick={() => handleLogin("google")}
                                style={{
                                    flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer",
                                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.15)",
                                    color: "#333", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                                }}
                            >
                                구글로 저장
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}
