"use client";

/**
 * 운명의 합 — 전용 입력 폼 (다시,우리의 DualInputForm과 별개로 설계).
 * '감정 신청서'를 채워나가는 원장(元帳) 형태 — 진행 표시도 막대바 대신
 * 결과 리포트의 골드 스파인과 같은 장치(3개 노드를 잇는 실선)를 써서
 * 입력→결과 사이의 시각적 일관성을 잇는다.
 */
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Heart, Users, Gem, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useSajuStore } from "@/store/useSajuStore";
import LocationSearch from "@/components/LocationSearch";
import { useKeyboardAwareForm } from "@/hooks/useKeyboardAwareForm";

const C = {
    ink: "#F0EAEB",
    sub: "#9C9199",
    muted: "#8A8290",
    gold: "#D9B872",
    goldBright: "#E8CF9C",
    goldSoft: "rgba(201,161,92,0.10)",
    goldBorder: "rgba(201,161,92,0.32)",
    card: "rgba(240,234,235,0.04)",
    cardBorder: "rgba(240,234,235,0.13)",
    lineSoft: "rgba(240,234,235,0.07)",
    btnBg: "linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)",
    btnInk: "#241C0C",
    serif: "'Noto Serif KR', serif",
    r: 14,
};

const fieldBox: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: C.r,
    padding: "14px 16px",
    color: C.ink,
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
};

const maxYear = new Date().getFullYear();
const strictDateError = (y: string, m: string, d: string): string | null => {
    const year = parseInt(y), month = parseInt(m), day = parseInt(d);
    if (year < 1920 || year > maxYear) return `년도는 1920~${maxYear} 사이로 입력해주세요`;
    if (month < 1 || month > 12) return "월은 1~12 사이로 입력해주세요";
    const maxDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDay) return `${month}월은 최대 ${maxDay}일까지 입력 가능해요`;
    return null;
};

const RELATIONSHIP_OPTIONS = [
    { v: "dating", label: "연인 사이", desc: "지금 만나고 있어요", icon: Heart },
    { v: "some", label: "썸 타는 중", desc: "아직 사귀기 전이에요", icon: Sparkles },
    { v: "marriage", label: "결혼 준비 중", desc: "결혼을 진지하게 생각하고 있어요", icon: Gem },
    { v: "etc", label: "그 외", desc: "복잡하거나 애매한 사이예요", icon: Users },
];

const STEP_META = [
    { eyebrow: "STEP 1", label: "나의 정보", sub: "정확할수록 궁합 판정이 정밀해져요" },
    { eyebrow: "STEP 2", label: "상대방 정보", sub: "생년월일만 알아도 충분해요" },
    { eyebrow: "STEP 3", label: "우리 사이", sub: "지금 두 사람의 관계를 알려주세요" },
];

export default function HapInputForm() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const minuteRef = useRef<HTMLInputElement>(null);

    const {
        name, setName, gender, setGender,
        calendarType, setCalendarType,
        birthYear, birthMonth, birthDay, setBirthDate,
        birthCity, birthHour, birthMinute, isTimeUnknown, setBirthLocationTime,
    } = useSajuStore();
    const {
        partnerName, setPartnerName, partnerGender, setPartnerGender,
        partnerCalendarType, setPartnerCalendarType,
        partnerBirthYear, partnerBirthMonth, partnerBirthDay, setPartnerBirthDate,
        partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, setPartnerBirthLocationTime,
    } = useSajuStore();
    const { relationshipStatus, setRelationshipStatus } = useSajuStore();

    const { keyboardPadding, handleFieldFocus, handleFieldBlur } = useKeyboardAwareForm();
    const keyboardOpen = keyboardPadding > 80;

    const handleNextStep1 = () => {
        if (name.trim().length < 1) { toast.error("이름을 입력해주세요."); return; }
        if (!gender) { toast.error("성별을 선택해주세요."); return; }
        if (!birthYear || !birthMonth || !birthDay) { toast.error("생년월일을 모두 입력해주세요."); return; }
        const pm = birthMonth.padStart(2, "0"), pd = birthDay.padStart(2, "0");
        setBirthDate(birthYear, pm, pd);
        const dateErr = strictDateError(birthYear, pm, pd);
        if (dateErr) { toast.error(dateErr); return; }
        if (!isTimeUnknown && (!birthHour || !birthMinute)) { toast.error("태어난 시와 분을 입력하거나 '모름'을 체크해주세요."); return; }
        setStep(2);
    };

    const handleNextStep2 = () => {
        if (partnerName.trim().length < 1) { toast.error("상대방 이름을 입력해주세요."); return; }
        if (!partnerGender) { toast.error("상대방 성별을 선택해주세요."); return; }
        if (!partnerBirthYear || !partnerBirthMonth || !partnerBirthDay) { toast.error("상대방 생년월일을 모두 입력해주세요."); return; }
        const pm = partnerBirthMonth.padStart(2, "0"), pd = partnerBirthDay.padStart(2, "0");
        setPartnerBirthDate(partnerBirthYear, pm, pd);
        const dateErr = strictDateError(partnerBirthYear, pm, pd);
        if (dateErr) { toast.error(dateErr); return; }
        setStep(3);
    };

    const handleSubmit = () => router.push("/hap/preview");

    const Label = ({ children }: { children: React.ReactNode }) => (
        <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{children}</p>
    );

    const renderPersonFields = (isPartner: boolean) => {
        const cn = isPartner ? partnerName : name;
        const cg = isPartner ? partnerGender : gender;
        const cct = isPartner ? partnerCalendarType : calendarType;
        const cby = isPartner ? partnerBirthYear : birthYear;
        const cbm = isPartner ? partnerBirthMonth : birthMonth;
        const cbd = isPartner ? partnerBirthDay : birthDay;
        const cbc = isPartner ? partnerBirthCity : birthCity;
        const cbh = isPartner ? partnerBirthHour : birthHour;
        const cbmin = isPartner ? partnerBirthMinute : birthMinute;
        const citu = isPartner ? partnerIsTimeUnknown : isTimeUnknown;

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                <div>
                    <Label>{isPartner ? "상대방" : "나의"} 이름</Label>
                    <input
                        type="text" placeholder={isPartner ? "그 사람의 이름" : "홍길동"} value={cn}
                        onChange={(e) => (isPartner ? setPartnerName(e.target.value) : setName(e.target.value))}
                        style={fieldBox}
                    />
                </div>

                <div>
                    <Label>성별</Label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {(["male", "female"] as const).map((g) => {
                            const active = cg === g;
                            return (
                                <button key={g}
                                    onClick={() => (isPartner ? setPartnerGender(g) : setGender(g))}
                                    style={{
                                        flex: 1, padding: "13px 0", borderRadius: C.r,
                                        border: active ? `1px solid ${C.goldBorder}` : `1px solid ${C.cardBorder}`,
                                        background: active ? C.goldSoft : C.card,
                                        color: active ? C.goldBright : C.muted,
                                        fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                                    }}>{g === "male" ? "남자" : "여자"}</button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <Label>생년월일</Label>
                    <div style={{ display: "inline-flex", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 4, marginBottom: 12 }}>
                        {(["solar", "lunar"] as const).map((t) => {
                            const active = cct === t;
                            return (
                                <button key={t}
                                    onClick={() => (isPartner ? setPartnerCalendarType(t) : setCalendarType(t))}
                                    style={{
                                        padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                                        background: active ? C.goldSoft : "transparent",
                                        color: active ? C.goldBright : C.muted,
                                        border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
                                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                                    }}>{t === "solar" ? "양력" : "음력"}</button>
                            );
                        })}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input ref={!isPartner ? yearRef : undefined} type="number" inputMode="numeric" placeholder="YYYY" value={cby}
                            onChange={(e) => { const v = e.target.value.slice(0, 4); isPartner ? setPartnerBirthDate(v, cbm, cbd) : setBirthDate(v, birthMonth, birthDay); if (v.length === 4) (isPartner ? undefined : monthRef.current)?.focus(); }}
                            style={{ ...fieldBox, textAlign: "center" }} />
                        <input ref={!isPartner ? monthRef : undefined} type="number" inputMode="numeric" placeholder="MM" value={cbm}
                            onChange={(e) => { let v = e.target.value.slice(0, 2); if (parseInt(v) > 12) v = "12"; isPartner ? setPartnerBirthDate(cby, v, cbd) : setBirthDate(birthYear, v, birthDay); if (v.length === 2) (isPartner ? undefined : dayRef.current)?.focus(); }}
                            style={{ ...fieldBox, textAlign: "center" }} />
                        <input ref={!isPartner ? dayRef : undefined} type="number" inputMode="numeric" placeholder="DD" value={cbd}
                            onChange={(e) => { let v = e.target.value.slice(0, 2); if (parseInt(v) > 31) v = "31"; isPartner ? setPartnerBirthDate(cby, cbm, v) : setBirthDate(birthYear, birthMonth, v); }}
                            style={{ ...fieldBox, textAlign: "center" }} />
                    </div>
                </div>

                <div>
                    <Label>태어난 시간/지역 <span style={{ fontWeight: 400, textTransform: "none", color: C.muted }}>(선택)</span></Label>
                    <div style={{ marginBottom: 10 }}>
                        <LocationSearch
                            value={cbc}
                            disabled={citu}
                            onSelect={(cityName, timezone, longitude) =>
                                isPartner
                                    ? setPartnerBirthLocationTime(cityName, cbh, cbmin, citu, timezone, longitude)
                                    : setBirthLocationTime(cityName, birthHour, birthMinute, isTimeUnknown, timezone, longitude)
                            }
                        />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <input ref={!isPartner ? hourRef : undefined} type="number" inputMode="numeric" min={0} max={23} placeholder="시 (0~23)"
                                disabled={citu} value={cbh}
                                onChange={(e) => { let v = e.target.value; if (parseInt(v) > 23) v = "23"; isPartner ? setPartnerBirthLocationTime(cbc, v, cbmin, citu) : setBirthLocationTime(birthCity, v, birthMinute, isTimeUnknown); if (v.length === 2) (isPartner ? undefined : minuteRef.current)?.focus(); }}
                                style={{ ...fieldBox, textAlign: "center", opacity: citu ? 0.3 : 1 }} />
                            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>시</span>
                        </div>
                        <div style={{ position: "relative", flex: 1 }}>
                            <input ref={!isPartner ? minuteRef : undefined} type="number" inputMode="numeric" min={0} max={59} placeholder="분 (0~59)"
                                disabled={citu} value={cbmin}
                                onChange={(e) => { let v = e.target.value; if (parseInt(v) > 59) v = "59"; isPartner ? setPartnerBirthLocationTime(cbc, cbh, v, citu) : setBirthLocationTime(birthCity, birthHour, v, isTimeUnknown); }}
                                style={{ ...fieldBox, textAlign: "center", opacity: citu ? 0.3 : 1 }} />
                            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>분</span>
                        </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 12, ...fieldBox, cursor: "pointer" }}>
                        <input type="checkbox" checked={citu}
                            onChange={(e) => (isPartner ? setPartnerBirthLocationTime(cbc, "", "", e.target.checked) : setBirthLocationTime(birthCity, "", "", e.target.checked))}
                            style={{ width: 16, height: 16, accentColor: C.gold, cursor: "pointer" }} />
                        <span style={{ fontSize: 13, color: C.sub }}>태어난 시간을 모릅니다</span>
                    </label>
                </div>
            </div>
        );
    };

    return (
        <div onFocusCapture={handleFieldFocus} onBlurCapture={handleFieldBlur}
            style={{ color: C.ink, fontFamily: "Pretendard, -apple-system, sans-serif", display: "flex", flexDirection: "column", minHeight: "100dvh", paddingBottom: 100 + keyboardPadding }}>

            {/* 헤더 — 진행 표시는 결과 리포트와 같은 '이어지는 실선' 장치 */}
            <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,9,8,0.86)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.lineSoft}`, padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    {step === 1
                        ? <Link href="/hap" style={{ display: "flex", padding: 4, color: C.sub, textDecoration: "none" }}><ArrowLeft size={22} /></Link>
                        : <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} style={{ display: "flex", padding: 4, background: "none", border: "none", color: C.sub, cursor: "pointer" }}><ArrowLeft size={22} /></button>}
                    <span style={{ fontWeight: 700, fontSize: 15 }}>감정 신청서</span>
                </div>
                <div style={{ position: "relative", height: 20, maxWidth: 200, margin: "0 auto" }}>
                    <div style={{ position: "absolute", left: 10, right: 10, top: 9, height: 1, background: C.lineSoft }} />
                    <div style={{ position: "absolute", left: 10, top: 9, height: 1, background: C.gold, width: `${((step - 1) / 2) * 100}%`, transition: "width 0.4s ease" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                        {[1, 2, 3].map((s) => (
                            <div key={s} style={{
                                width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 800,
                                background: step >= s ? C.gold : "#0A0908",
                                border: `1.5px solid ${step >= s ? C.gold : C.cardBorder}`,
                                color: step >= s ? "#241C0C" : C.muted,
                                boxShadow: step === s ? `0 0 10px rgba(217,184,114,0.5)` : "none",
                            }}>{s}</div>
                        ))}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: "26px 20px 0", maxWidth: 480, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, marginBottom: 6 }}>{STEP_META[0].eyebrow}</p>
                            <h2 style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{STEP_META[0].label}</h2>
                            <p style={{ fontSize: 12.5, color: C.muted, marginBottom: 26 }}>{STEP_META[0].sub}</p>
                            {renderPersonFields(false)}
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, marginBottom: 6 }}>{STEP_META[1].eyebrow}</p>
                            <h2 style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{STEP_META[1].label}</h2>
                            <p style={{ fontSize: 12.5, color: C.muted, marginBottom: 26 }}>{STEP_META[1].sub}</p>
                            {renderPersonFields(true)}
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, marginBottom: 6 }}>{STEP_META[2].eyebrow}</p>
                            <h2 style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{STEP_META[2].label}</h2>
                            <p style={{ fontSize: 12.5, color: C.muted, marginBottom: 26 }}>{STEP_META[2].sub}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                                {RELATIONSHIP_OPTIONS.map((opt) => {
                                    const active = relationshipStatus === opt.v;
                                    const Icon = opt.icon;
                                    return (
                                        <button key={opt.v} onClick={() => setRelationshipStatus(opt.v)}
                                            style={{
                                                ...fieldBox, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                                                border: `1px solid ${active ? C.goldBorder : C.cardBorder}`,
                                                background: active ? C.goldSoft : C.card,
                                            }}>
                                            <Icon size={18} style={{ color: active ? C.goldBright : C.muted, flexShrink: 0 }} />
                                            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                <span style={{ fontSize: 14.5, fontWeight: 700, color: active ? C.goldBright : C.ink }}>{opt.label}</span>
                                                <span style={{ fontSize: 12, color: C.muted }}>{opt.desc}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                                <div style={{ background: C.card, border: `1px solid ${C.lineSoft}`, borderRadius: C.r, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
                                    <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
                                    <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.7, margin: 0 }}>관계 상태는 리포트의 말투와 조언 방향을 맞추는 데만 사용됩니다. 선택하지 않아도 분석은 가능해요.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
                padding: "14px 20px 24px", background: "rgba(10,9,8,0.90)", backdropFilter: "blur(12px)",
                borderTop: `1px solid ${C.lineSoft}`, zIndex: 50, display: keyboardOpen ? "none" : "block",
            }}>
                {step === 1 && (
                    <button onClick={handleNextStep1} style={{ width: "100%", background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: "17px 0", borderRadius: C.r, border: "none", boxShadow: "0 6px 30px rgba(140,106,50,0.28)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        다음: 상대방 정보 입력 <ChevronRight size={18} />
                    </button>
                )}
                {step === 2 && (
                    <button onClick={handleNextStep2} style={{ width: "100%", background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: "17px 0", borderRadius: C.r, border: "none", boxShadow: "0 6px 30px rgba(140,106,50,0.28)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        다음: 우리 사이 입력 <ChevronRight size={18} />
                    </button>
                )}
                {step === 3 && (
                    <button onClick={handleSubmit} style={{ width: "100%", background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: "17px 0", borderRadius: C.r, border: "none", boxShadow: "0 6px 30px rgba(140,106,50,0.28)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        무료 궁합 미리보기 <Gem size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
