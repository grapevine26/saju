"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TarotInput, TarotGender, TarotSituation } from "@/features/tarot/types";
import { TAROT_INPUT_KEY } from "@/features/tarot/constants";
import { useKeyboardAwareForm } from "@/hooks/useKeyboardAwareForm";

const SITUATIONS: { id: TarotSituation; label: string }[] = [
    { id: "dating",     label: "연인 사이" },
    { id: "crush",      label: "썸 타는 중" },
    { id: "unrequited", label: "짝사랑 중" },
    { id: "breakup",    label: "헤어진 사이" },
];

/* 배경 별 [x%, y%, r, isGold] */
const STARS: [number, number, number, boolean][] = [
    [8, 10, 1.5, true], [90, 6, 1, false], [26, 18, 2, false], [72, 13, 1.5, true],
    [12, 42, 1, false], [88, 36, 1.5, true], [50, 6, 1, false], [5, 66, 1.5, false],
    [95, 58, 1.5, true], [36, 90, 1, false], [78, 84, 1.5, false], [18, 80, 1, true],
];

function inputStyle(): React.CSSProperties {
    return {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 11,
        border: "1px solid rgba(176,123,180,0.22)",
        background: "rgba(13,16,38,0.55)",
        color: "var(--tarot-text-1)",
        fontSize: 15,
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
    };
}

/* 폼 섹션을 감싸는 글래스 카드 */
function sectionStyle(): React.CSSProperties {
    return {
        background: "rgba(27,31,74,0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(176,123,180,0.16)",
        borderRadius: 16,
        padding: "14px 14px 15px",
    };
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <p style={{
            fontSize: 11, fontWeight: 700,
            color: "var(--tarot-accent-light)",
            letterSpacing: "0.12em",
            marginBottom: 10,
            textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
        }}>
            <span style={{ fontSize: 9, opacity: 0.7 }}>✦</span>
            {children}
        </p>
    );
}

/* 성별 세그먼트 토글 (여 | 남) */
function GenderToggle({ value, onChange }: { value: TarotGender | null; onChange: (g: TarotGender) => void }) {
    return (
        <div style={{
            display: "flex", flexShrink: 0,
            border: "1px solid rgba(176,123,180,0.22)",
            borderRadius: 11, overflow: "hidden",
            background: "rgba(13,16,38,0.55)",
        }}>
            {(["female", "male"] as TarotGender[]).map((g, i) => {
                const active = value === g;
                return (
                    <button
                        key={g}
                        onClick={() => onChange(g)}
                        style={{
                            width: 52, padding: "12px 0",
                            border: "none",
                            borderLeft: i === 1 ? "1px solid rgba(176,123,180,0.18)" : "none",
                            background: active ? "rgba(61,44,109,0.6)" : "transparent",
                            color: active ? "var(--tarot-accent-light)" : "var(--tarot-text-3)",
                            fontSize: 13.5, fontWeight: active ? 700 : 500,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {g === "female" ? "여" : "남"}
                    </button>
                );
            })}
        </div>
    );
}

/* 타이틀 위 미니 카드 팬 */
function MiniFan() {
    return (
        <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", marginBottom: 14 }}
        >
            {[{ deg: -14, w: 27, h: 42, z: 1 }, { deg: 0, w: 33, h: 50, z: 2 }, { deg: 14, w: 27, h: 42, z: 1 }].map((c, i) => (
                <div key={i} style={{
                    width: c.w, height: c.h,
                    borderRadius: 7,
                    background: "linear-gradient(155deg, #3D2C6D 0%, #1B1F4A 100%)",
                    border: "1px solid rgba(176,123,180,0.5)",
                    boxShadow: "0 6px 20px rgba(61,44,109,0.55), 0 0 12px rgba(168,85,247,0.18)",
                    transform: `rotate(${c.deg}deg)`,
                    transformOrigin: "bottom center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: i === 1 ? 12 : 9, color: "rgba(212,168,83,0.7)",
                    marginLeft: i === 0 ? 0 : -8,
                    marginBottom: i === 1 ? 0 : 4,
                    position: "relative", zIndex: c.z,
                }}>★</div>
            ))}
        </motion.div>
    );
}

export default function TarotInputPage() {
    const router = useRouter();
    const [form, setForm] = useState<{
        myName: string;
        myGender: TarotGender | null;
        partnerName: string;
        partnerGender: TarotGender | null;
        situation: TarotSituation | null;
        question: string;
    }>({
        myName: "",
        myGender: null,
        partnerName: "",
        partnerGender: null,
        situation: null,
        question: "",
    });

    const isValid =
        form.myName.trim().length >= 2 &&
        form.myGender !== null &&
        form.partnerName.trim().length >= 2 &&
        form.partnerGender !== null &&
        form.situation !== null;

    const handleStart = () => {
        if (!isValid) return;
        const input: TarotInput = {
            myName: form.myName.trim(),
            myGender: form.myGender!,
            partnerName: form.partnerName.trim(),
            partnerGender: form.partnerGender!,
            situation: form.situation!,
            question: form.question.trim(),
        };
        try { sessionStorage.setItem(TAROT_INPUT_KEY, JSON.stringify(input)); } catch {}
        router.push("/tarot/select");
    };

    // 인앱 브라우저(인스타 등) 키보드 대응 — visualViewport 기반 (iOS 웹뷰 포함)
    const { keyboardPadding, handleFieldFocus, handleFieldBlur } = useKeyboardAwareForm();

    return (
        <div onFocusCapture={handleFieldFocus} onBlurCapture={handleFieldBlur} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", paddingBottom: keyboardPadding }}>
            {/* ── 배경: 별 + 상단 글로우 ── */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                {STARS.map(([x, y, r, isGold], i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.12, 0.5, 0.12] }}
                        transition={{ duration: 2.8 + (i % 4) * 0.6, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.4 }}
                        style={{
                            position: "absolute", left: `${x}%`, top: `${y}%`,
                            width: r, height: r, borderRadius: "50%",
                            background: isGold ? "#D4A853" : "#B07BB4",
                            boxShadow: i % 3 === 0 ? `0 0 ${r * 4}px ${isGold ? "rgba(212,168,83,0.5)" : "rgba(176,123,180,0.4)"}` : "none",
                        }}
                    />
                ))}
                <div style={{
                    position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
                    width: 460, height: 460, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(61,44,109,0.3) 0%, rgba(61,44,109,0.08) 55%, transparent 75%)",
                }} />
            </div>

            {/* Header */}
            <header style={{ display: "flex", alignItems: "center", padding: "14px 20px 10px", gap: 12, position: "relative", zIndex: 10 }}>
                <Link href="/tarot" style={{ color: "var(--tarot-text-2)", display: "flex", opacity: 0.7 }}>
                    <ArrowLeft size={22} />
                </Link>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tarot-text-2)", letterSpacing: "0.14em", opacity: 0.6 }}>
                    ODD TAROT
                </span>
            </header>

            <div style={{ flex: 1, padding: "4px 22px 24px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: 18 }}
                >
                    <MiniFan />
                    <h1 className="tarot-serif" style={{
                        fontSize: 21, fontWeight: 700, color: "var(--tarot-text-1)",
                        textAlign: "center", lineHeight: 1.45, marginBottom: 6, wordBreak: "keep-all",
                    }}>
                        두 사람의 이야기를<br />카드에게 들려주세요
                    </h1>
                    <p style={{ fontSize: 12.5, color: "var(--tarot-text-2)", textAlign: "center", lineHeight: 1.6, opacity: 0.8 }}>
                        이름과 상황을 알아야 정확한 리딩이 가능합니다
                    </p>
                </motion.div>

                {/* Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* 두 사람 — 이름 + 성별 한 줄씩 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={sectionStyle()}>
                        <Label>두 사람</Label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    value={form.myName}
                                    onChange={e => setForm(f => ({ ...f, myName: e.target.value }))}
                                    placeholder="내 이름"
                                    maxLength={6}
                                    style={{ ...inputStyle(), flex: 1, minWidth: 0 }}
                                />
                                <GenderToggle value={form.myGender} onChange={g => setForm(f => ({ ...f, myGender: g }))} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    value={form.partnerName}
                                    onChange={e => setForm(f => ({ ...f, partnerName: e.target.value }))}
                                    placeholder="그 사람 이름"
                                    maxLength={6}
                                    style={{ ...inputStyle(), flex: 1, minWidth: 0 }}
                                />
                                <GenderToggle value={form.partnerGender} onChange={g => setForm(f => ({ ...f, partnerGender: g }))} />
                            </div>
                        </div>
                    </motion.div>

                    {/* 우리 사이 — 가로 1줄 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} style={sectionStyle()}>
                        <Label>우리 사이</Label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                            {SITUATIONS.map(s => {
                                const active = form.situation === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setForm(f => ({ ...f, situation: s.id }))}
                                        style={{
                                            padding: "11px 2px",
                                            borderRadius: 10,
                                            border: active ? "1.5px solid rgba(176,123,180,0.65)" : "1px solid rgba(176,123,180,0.18)",
                                            background: active ? "rgba(61,44,109,0.45)" : "rgba(13,16,38,0.45)",
                                            color: active ? "var(--tarot-accent-light)" : "var(--tarot-text-2)",
                                            fontSize: 12, fontWeight: active ? 700 : 500,
                                            cursor: "pointer", fontFamily: "inherit",
                                            transition: "all 0.16s ease",
                                            boxShadow: active ? "0 0 14px rgba(176,123,180,0.3)" : "none",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* 가장 궁금한 것 — 한 줄 */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} style={sectionStyle()}>
                        <Label>가장 궁금한 것 <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(선택)</span></Label>
                        <input
                            value={form.question}
                            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                            placeholder="예) 그 사람은 지금 나를 어떻게 생각할까요?"
                            maxLength={120}
                            style={inputStyle()}
                        />
                    </motion.div>
                </div>

                {/* CTA — 남는 공간이 있으면 하단에 붙음 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    style={{ marginTop: 22 }}
                >
                    <button
                        onClick={handleStart}
                        disabled={!isValid}
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: 16,
                            border: "none",
                            background: isValid ? "var(--tarot-btn-bg)" : "rgba(139,92,246,0.1)",
                            color: isValid ? "#fff" : "rgba(167,139,250,0.4)",
                            fontSize: 16, fontWeight: 700,
                            cursor: isValid ? "pointer" : "default",
                            boxShadow: isValid ? "var(--tarot-btn-shadow)" : "none",
                            transition: "all 0.2s ease",
                            letterSpacing: "-0.01em",
                            fontFamily: "inherit",
                        }}
                    >
                        카드 뽑으러 가기 →
                    </button>
                    <p style={{ fontSize: 11.5, color: "rgba(167,139,250,0.45)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                        3라운드 · 총 7장 · 1라운드 무료 해석 제공
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
