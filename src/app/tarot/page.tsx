"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { TAROT_JOB_ID_KEY, TAROT_HISTORY_KEY } from "@/features/tarot/constants";

/* ── 팔레트 상수 (#0D1026 → #1B1F4A → #3D2C6D → #B07BB4 → #F6D6E8) ── */
const P    = "rgba(176,123,180,";   // lavender
const DP   = "rgba(61,44,109,";     // dark purple
const NP   = "rgba(168,85,247,";    // neon purple
const LAV  = "#B07BB4";
const BLUSH = "#F6D6E8";
const GOLD  = "#D4A853";
const GOLD_D = "rgba(212,168,83,";

/* ── 글래스카드 스타일 헬퍼 ── */
function glass(extra?: React.CSSProperties): React.CSSProperties {
    return {
        background: "rgba(27,31,74,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${P}0.22)`,
        borderRadius: 16,
        ...extra,
    };
}

/* ── 배경 별 좌표 [x%, y%, radius, isGold] ── */
const STARS: [number,number,number,boolean][] = [
    [6,8,1.5,true],[90,5,1,false],[28,16,2,false],[68,11,1.5,true],[15,38,1,false],
    [84,32,1.5,true],[50,52,1,false],[12,60,2,false],[96,55,1.5,true],[44,72,1,false],
    [78,78,1.5,false],[24,86,1,true],[62,90,2,false],[4,26,1,false],[97,44,1.5,true],
    [48,14,1.5,false],[76,64,1,true],[18,74,1.5,false],[38,45,1,true],[88,20,2,false],
    [54,30,1,false],[8,50,1.5,true],[92,72,1,false],[34,94,1.5,false],
];

/* ── 달 + 카드 히어로 ── */
function MoonHero() {
    return (
        <div style={{ position:"relative", paddingTop:16, paddingBottom:20 }}>
            {/* 배경 보라 글로우 */}
            <div style={{
                position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                width:300, height:300, borderRadius:"50%",
                background:`radial-gradient(circle, ${DP}0.38) 0%, ${DP}0.10) 55%, transparent 75%)`,
                filter:"blur(24px)", pointerEvents:"none",
            }} />

            {/* 달 SVG - 단독, 카드와 분리 */}
            <motion.div
                initial={{ opacity:0, y:-12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.9, ease:"easeOut" }}
                style={{ display:"flex", justifyContent:"center", marginBottom:20, position:"relative", zIndex:2 }}
            >
                <svg width="160" height="96" viewBox="0 0 160 96" fill="none">
                    <defs>
                        {/* 달 본체 — 밝은 중심에서 보라로 은은하게 퍼짐 */}
                        <radialGradient id="mg2" cx="32%" cy="32%" r="75%">
                            <stop offset="0%"  stopColor="#F6D6E8" />
                            <stop offset="32%" stopColor="#D9B8EE" />
                            <stop offset="65%" stopColor="#9B6FCC" />
                            <stop offset="100%" stopColor="#5A3490" />
                        </radialGradient>
                        {/* 배경으로 퍼지는 은은한 헤일로 */}
                        <radialGradient id="moon-halo" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"  stopColor={`${P}0.4)`} />
                            <stop offset="55%" stopColor={`${P}0.12)`} />
                            <stop offset="100%" stopColor={`${P}0)`} />
                        </radialGradient>
                        <filter id="moon-glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        {/* 마스크로 슬림한 크레센트 */}
                        <mask id="moon-mask">
                            <circle cx="70" cy="48" r="29" fill="white" />
                            <circle cx="83" cy="39" r="27" fill="black" />
                        </mask>
                    </defs>

                    {/* 외곽 은은한 헤일로 */}
                    <circle cx="72" cy="48" r="44" fill="url(#moon-halo)" />

                    {/* 달 본체 — 마스크 크레센트 */}
                    <circle cx="70" cy="48" r="29" fill="url(#mg2)" mask="url(#moon-mask)" />

                    {/* 크레센트 테두리 림 라이트 */}
                    <circle cx="70" cy="48" r="29" fill="none"
                        stroke={BLUSH} strokeWidth="1" strokeOpacity="0.55" mask="url(#moon-mask)"
                        filter="url(#moon-glow)" />

                    {/* 은은한 크레이터 텍스처 */}
                    <circle cx="58" cy="42" r="2.2" fill="#5A3490" opacity="0.28" mask="url(#moon-mask)" />
                    <circle cx="64" cy="58" r="1.4" fill="#5A3490" opacity="0.24" mask="url(#moon-mask)" />
                    <circle cx="52" cy="55" r="1.6" fill="#5A3490" opacity="0.2" mask="url(#moon-mask)" />

                    {/* 별 — 가로로 넓게 흩뿌림 */}
                    <circle cx="134" cy="14" r="1.8" fill={GOLD} opacity="0.9" />
                    <circle cx="14"  cy="20" r="1.2" fill={LAV} opacity="0.78" />
                    <circle cx="148" cy="50" r="1.4" fill={GOLD} opacity="0.8" />
                    <circle cx="6"   cy="56" r="1" fill={LAV} opacity="0.6" />
                    <circle cx="118" cy="84" r="1.5" fill={GOLD} opacity="0.7" />
                    <circle cx="30"  cy="80" r="1.2" fill={LAV} opacity="0.65" />

                    {/* 반짝이 */}
                    <path d="M134 6 L135.2 9.2 L134 12.4 L132.8 9.2 Z" fill={GOLD} opacity="0.95"/>
                    <path d="M8 40 L9.2 43.2 L8 46.4 L6.8 43.2 Z" fill={LAV} opacity="0.7"/>
                    <path d="M154 30 L155.2 33.2 L154 36.4 L152.8 33.2 Z" fill={GOLD} opacity="0.8"/>
                </svg>
            </motion.div>

            {/* 3장 카드 팬 스프레드 - flex로 자연스럽게 */}
            <div style={{
                display:"flex", alignItems:"flex-end", justifyContent:"center",
                gap:8, position:"relative", zIndex:3,
            }}>
                {/* 왼쪽 카드 */}
                <motion.div
                    initial={{ opacity:0, x:-20 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.3, duration:0.6, type:"spring", stiffness:180, damping:24 }}
                    style={{ transform:"rotate(-15deg)", transformOrigin:"bottom center", marginBottom:8 }}
                >
                    <motion.div animate={{ y:[0,-7,0] }} transition={{ duration:3.6, repeat:Infinity, ease:"easeInOut", delay:0.5 }}>
                        <TarotCardMini />
                    </motion.div>
                </motion.div>

                {/* 중앙 카드 (앞에, 크게) */}
                <motion.div
                    initial={{ opacity:0, y:18 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.1, duration:0.7, type:"spring", stiffness:160, damping:20 }}
                    style={{ zIndex:4, position:"relative" }}
                >
                    <motion.div animate={{ y:[0,-11,0] }} transition={{ duration:4.2, repeat:Infinity, ease:"easeInOut" }}>
                        <TarotCardMain />
                    </motion.div>
                    {/* 카드 아래 네온 글로우 */}
                    <div style={{
                        position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)",
                        width:100, height:20,
                        background:`radial-gradient(ellipse, ${NP}0.5) 0%, transparent 70%)`,
                        filter:"blur(8px)",
                    }} />
                </motion.div>

                {/* 오른쪽 카드 */}
                <motion.div
                    initial={{ opacity:0, x:20 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.4, duration:0.6, type:"spring", stiffness:180, damping:24 }}
                    style={{ transform:"rotate(15deg)", transformOrigin:"bottom center", marginBottom:8 }}
                >
                    <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3.9, repeat:Infinity, ease:"easeInOut", delay:1 }}>
                        <TarotCardMini />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

function TarotCardMain() {
    return (
        <div style={{
            width:86, height:134,
            borderRadius:13,
            background:"linear-gradient(155deg, #3D2C6D 0%, #1B1F4A 100%)",
            border:`1.5px solid ${P}0.65)`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
            boxShadow:`0 12px 48px ${DP}0.6), 0 0 28px ${NP}0.25), inset 0 1px 0 ${P}0.2)`,
        }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke={`${P}0.32)`} strokeWidth="0.7"/>
                <circle cx="24" cy="24" r="15" stroke={`${P}0.24)`} strokeWidth="0.7"/>
                <circle cx="24" cy="24" r="8"  stroke={`${P}0.38)`} strokeWidth="0.7"/>
                {[0,45,90,135].map(d=>(
                    <line key={d} x1="24" y1="2" x2="24" y2="46"
                        stroke={`${P}0.16)`} strokeWidth="0.7"
                        transform={`rotate(${d} 24 24)`}/>
                ))}
                <text x="24" y="29" textAnchor="middle" fontSize="14" fill={`${GOLD_D}0.9)`} fontFamily="serif">★</text>
            </svg>
        </div>
    );
}

function TarotCardMini() {
    return (
        <div style={{
            width:60, height:96,
            borderRadius:11,
            background:"linear-gradient(155deg, #2A1F54 0%, #1B1F4A 100%)",
            border:`1px solid ${P}0.38)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 6px 24px ${DP}0.4), 0 0 12px ${NP}0.1)`,
            fontSize:20, color:`${GOLD_D}0.5)`,
        }}>★</div>
    );
}

/* ── 실제 결과 화면 블러 목업 ── */
function MockLine({ w, strong }: { w: string | number; strong?: boolean }) {
    return (
        <div style={{
            height: 6, borderRadius: 3, width: w, marginBottom: 6,
            background: strong ? "rgba(237,232,248,0.45)" : "rgba(237,232,248,0.22)",
        }} />
    );
}

function ResultMockups() {
    const panelStyle: React.CSSProperties = {
        width: 172, flexShrink: 0,
        borderRadius: 14,
        border: `1px solid ${P}0.24)`,
        background: "rgba(27,31,74,0.5)",
        padding: "14px 13px",
        overflow: "hidden",
        position: "relative",
    };
    const blurWrap: React.CSSProperties = {
        filter: "blur(3px)",
        userSelect: "none",
        pointerEvents: "none",
    };

    return (
        <div>
            <div style={{
                display: "flex", gap: 10, overflowX: "auto",
                padding: "4px 2px 10px",
                scrollbarWidth: "none",
                maskImage: "linear-gradient(90deg, black 88%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(90deg, black 88%, transparent 100%)",
            }}>
                {/* 패널 1 — 카드 심층 풀이 */}
                <div>
                    <div style={panelStyle}>
                        <div style={blurWrap}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                                <div style={{
                                    width: 26, height: 38, borderRadius: 5, flexShrink: 0,
                                    background: "linear-gradient(155deg, #3D2C6D, #1B1F4A)",
                                    border: `1px solid ${P}0.5)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 9, color: `${GOLD_D}0.7)`,
                                }}>★</div>
                                <div style={{ flex: 1 }}>
                                    <MockLine w="70%" strong />
                                    <div style={{
                                        display: "inline-block", padding: "2px 7px", borderRadius: 5,
                                        background: "rgba(139,92,246,0.2)", border: `1px solid ${P}0.3)`,
                                        fontSize: 7.5, color: LAV, fontWeight: 600,
                                    }}>숨겨진 속마음</div>
                                </div>
                            </div>
                            <MockLine w="100%" /><MockLine w="94%" /><MockLine w="98%" /><MockLine w="72%" />
                            <div style={{ height: 6 }} />
                            <MockLine w="96%" /><MockLine w="88%" /><MockLine w="60%" />
                        </div>
                    </div>
                    <p style={{ fontSize: 10.5, color: `${P}0.6)`, textAlign: "center", margin: "8px 0 0" }}>카드 심층 풀이</p>
                </div>

                {/* 패널 2 — 궁합 온도 */}
                <div>
                    <div style={panelStyle}>
                        <div style={{ ...blurWrap, textAlign: "center" }}>
                            <MockLine w="52%" />
                            <p className="tarot-serif" style={{ fontSize: 34, fontWeight: 700, color: GOLD, margin: "10px 0 10px", lineHeight: 1 }}>
                                8_°
                            </p>
                            <div style={{
                                height: 5, borderRadius: 3, background: "rgba(176,123,180,0.15)",
                                overflow: "hidden", margin: "0 8px 12px",
                            }}>
                                <div style={{ height: "100%", width: "82%", borderRadius: 3, background: `linear-gradient(90deg, #6B3FA8, ${LAV}, ${GOLD})` }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <MockLine w="84%" strong />
                                <MockLine w="66%" />
                            </div>
                            <div style={{ height: 8 }} />
                            <div style={{ textAlign: "left" }}>
                                <MockLine w="100%" /><MockLine w="92%" /><MockLine w="74%" />
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: 10.5, color: `${P}0.6)`, textAlign: "center", margin: "8px 0 0" }}>궁합 온도</p>
                </div>

                {/* 패널 3 — 카드의 최종 답 */}
                <div>
                    <div style={panelStyle}>
                        <div style={blurWrap}>
                            <p style={{ fontSize: 8.5, fontWeight: 700, color: `${P}0.6)`, margin: "0 0 6px" }}>◆ 당신이 물어본 것</p>
                            <MockLine w="80%" strong />
                            <div style={{ height: 8 }} />
                            <p style={{ fontSize: 8.5, fontWeight: 700, color: LAV, margin: "0 0 6px" }}>◆ 카드의 최종 답</p>
                            <MockLine w="100%" /><MockLine w="95%" /><MockLine w="98%" /><MockLine w="90%" /><MockLine w="55%" />
                        </div>
                    </div>
                    <p style={{ fontSize: 10.5, color: `${P}0.6)`, textAlign: "center", margin: "8px 0 0" }}>내 질문에 대한 답</p>
                </div>

                {/* 패널 4 — 최종 메시지 */}
                <div>
                    <div style={{ ...panelStyle, border: `1px solid ${P}0.35)`, boxShadow: `0 0 16px ${NP}0.1)` }}>
                        <div style={{ ...blurWrap, textAlign: "center" }}>
                            <p className="tarot-serif" style={{ fontSize: 9, fontWeight: 700, color: LAV, margin: "0 0 10px" }}>
                                ✦ 7장의 카드가 전하는 최종 메시지 ✦
                            </p>
                            <div style={{ textAlign: "left" }}>
                                <MockLine w="100%" /><MockLine w="96%" /><MockLine w="99%" /><MockLine w="70%" />
                                <div style={{ height: 6 }} />
                                <MockLine w="97%" /><MockLine w="92%" /><MockLine w="84%" />
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: 10.5, color: `${P}0.6)`, textAlign: "center", margin: "8px 0 0" }}>최종 메시지</p>
                </div>
            </div>

            <p style={{ fontSize: 11, color: `${P}0.45)`, textAlign: "center", margin: "6px 0 0" }}>
                🔒 옆으로 밀어서 구성 미리보기 · 전체 내용은 리딩 후 공개됩니다
            </p>
        </div>
    );
}

/* ── FAQ 아코디언 ── */
const FAQS = [
    { q:"어떻게 해석이 이루어지나요?", a:"입력하신 두 분의 이름, 성별, 현재 상황과 선택한 카드 조합을 기반으로 실시간으로 맞춤 해석이 이루어집니다. 일반적인 카드 풀이가 아닌, 두 분만의 이야기로 리딩됩니다." },
    { q:"결제는 언제 하나요?", a:"1라운드(2장) 무료 해석을 먼저 확인하신 후, 마음에 드시면 전체 리딩 결제를 진행하시면 됩니다. 무료 체험 후 결정하세요." },
    { q:"개인정보는 안전한가요?", a:"입력하신 이름과 상황 정보는 리딩에만 사용되며, 분석 완료 후 별도로 저장되지 않습니다." },
];

function FaqItem({ q, a }: { q:string; a:string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ ...glass({ borderRadius:14 }), overflow:"hidden" }}>
            <button onClick={()=>setOpen(o=>!o)} style={{
                width:"100%", padding:"16px 18px",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:"none", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit",
            }}>
                <span style={{ fontSize:14, fontWeight:600, color:"#EDE8F8", lineHeight:1.4, wordBreak:"keep-all", flex:1, paddingRight:12 }}>{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
                    <ChevronDown size={16} color={`${P}0.6)`} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }} style={{ overflow:"hidden" }}>
                        <p style={{ fontSize:13, color:`${P}0.82)`, lineHeight:1.75, padding:"0 18px 16px", margin:0, wordBreak:"keep-all" }}>{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Divider() {
    return <div style={{ margin:"0 24px", height:1, background:`linear-gradient(90deg, transparent, ${P}0.25), transparent)` }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p style={{ fontSize:11, fontWeight:700, color:LAV, letterSpacing:"0.16em", marginBottom:6, textAlign:"center", opacity:0.7 }}>
            {children}
        </p>
    );
}

/* ── 메인 ── */
export default function TarotLandingPage() {
    const router = useRouter();
    const go = () => router.push("/tarot/input");
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(TAROT_HISTORY_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            setHasHistory(arr.length > 0 || !!localStorage.getItem(TAROT_JOB_ID_KEY));
        } catch {}
    }, []);

    return (
        <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", position:"relative", overflowX:"hidden" }}>

            {/* 고정 배경 별 */}
            <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
                {STARS.map(([x,y,r,isGold],i)=>(
                    <motion.div key={i}
                        initial={{ opacity:0 }}
                        animate={{ opacity: 0.12 + (i%5)*0.08 }}
                        transition={{ delay:i*0.025 }}
                        style={{
                            position:"absolute", left:`${x}%`, top:`${y}%`,
                            width:r as number, height:r as number,
                            borderRadius:"50%",
                            background: isGold ? GOLD : LAV,
                            boxShadow: (i%4===0) ? `0 0 ${(r as number)*4}px ${isGold ? GOLD_D+"0.5)" : P+"0.4)"}` : "none",
                        }}
                    />
                ))}
                {/* 상단 중앙 보라 글로우 */}
                <div style={{
                    position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)",
                    width:500, height:500, borderRadius:"50%",
                    background:`radial-gradient(circle, ${DP}0.28) 0%, ${DP}0.08) 50%, transparent 70%)`,
                }} />
                {/* 하단 왼쪽 보라 글로우 */}
                <div style={{
                    position:"absolute", bottom:0, left:"20%",
                    width:300, height:300, borderRadius:"50%",
                    background:`radial-gradient(circle, ${NP}0.08) 0%, transparent 70%)`,
                }} />
            </div>

            {/* 헤더 */}
            <header style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 20px 12px", position:"relative", zIndex:10 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:10, color:`${GOLD_D}0.55)`, letterSpacing:"0.1em" }}>✦</span>
                        <span style={{
                            fontSize:13, fontWeight:800, letterSpacing:"0.38em",
                            background:`linear-gradient(90deg, ${GOLD} 0%, #EDE8F8 45%, ${LAV} 100%)`,
                            WebkitBackgroundClip:"text", backgroundClip:"text",
                            WebkitTextFillColor:"transparent", color:"transparent",
                            display:"inline-block",
                        }}>ODD TAROT</span>
                        <span style={{ fontSize:10, color:`${GOLD_D}0.55)`, letterSpacing:"0.1em" }}>✦</span>
                    </div>
                    <div style={{
                        width:80, height:1,
                        background:`linear-gradient(90deg, transparent, ${GOLD_D}0.4), transparent)`,
                    }} />
                </div>
            </header>

            {/* 본문 */}
            <div style={{ position:"relative", zIndex:1, flex:1 }}>

                {/* ── 1. 히어로 ── */}
                <section style={{ padding:"0 24px", textAlign:"center" }}>
                    <MoonHero />

                    <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.6 }}>
                        {/* 무료 뱃지 */}
                        <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:18 }}>
                            <span style={{
                                fontSize:11, fontWeight:700, color:GOLD,
                                background:`${GOLD_D}0.1)`,
                                border:`1px solid ${GOLD_D}0.35)`,
                                padding:"4px 12px", borderRadius:999,
                                display:"inline-flex", alignItems:"center", gap:5,
                            }}>
                                <span style={{ width:5, height:5, borderRadius:"50%", background:GOLD, display:"inline-block", boxShadow:`0 0 8px ${GOLD}` }} />
                                1라운드 무료 · 결제 없이 시작
                            </span>
                        </div>

                        <h1 className="tarot-serif" style={{ fontSize:28, fontWeight:700, lineHeight:1.42, marginBottom:14, letterSpacing:"-0.01em", wordBreak:"keep-all" }}>
                            <span style={{ color:"#EDE8F8" }}>그 사람의 마음속,</span><br />
                            <span style={{
                                background:"linear-gradient(90deg, #F0DDFF 0%, #C49FF5 45%, #A06DE0 100%)",
                                WebkitBackgroundClip:"text",
                                backgroundClip:"text",
                                WebkitTextFillColor:"transparent",
                                color:"transparent",
                                display:"inline-block",
                            }}>타로가 먼저 알고 있습니다</span>
                        </h1>

                        <p style={{ fontSize:14, color:LAV, lineHeight:1.85, marginBottom:30, wordBreak:"keep-all", opacity:0.88 }}>
                            그 사람 기억 속에 남은 당신의 묘한 잔상.<br />
                            7장의 카드가 기묘할 정도로 정밀하게 읽어냅니다.
                        </p>

                        <button onClick={go} style={{
                            width:"100%", padding:"17px 20px", borderRadius:16, border:`1px solid ${P}0.3)`,
                            background:"var(--tarot-btn-bg)", color:"#EDE8F8", fontSize:16, fontWeight:700,
                            cursor:"pointer", boxShadow:"var(--tarot-btn-shadow)",
                            letterSpacing:"-0.01em", fontFamily:"inherit",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        }}>
                            무료로 첫 카드 뽑기 <ChevronRight size={18} />
                        </button>

                        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:14 }}>
                            {["3라운드","총 7장","실시간 해석"].map((t,i)=>(
                                <span key={i} style={{ fontSize:11.5, color:`${P}0.5)`, display:"flex", alignItems:"center", gap:4 }}>
                                    {i>0 && <span style={{ opacity:0.3 }}>·</span>}{t}
                                </span>
                            ))}
                        </div>

                        {/* 결제 이력이 있으면 히스토리 링크 노출 */}
                        {hasHistory && (
                            <button
                                onClick={() => router.push("/tarot/history")}
                                style={{
                                    marginTop: 16, padding: "10px 18px",
                                    background: "none", border: `1px solid ${P}0.25)`,
                                    borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                                    fontSize: 12.5, fontWeight: 600, color: LAV,
                                }}
                            >
                                ✦ 지난 리딩 기록 보기
                            </button>
                        )}
                    </motion.div>
                </section>

                <div style={{ height:44 }} />
                <Divider />

                {/* ── 2. 감성 훅 ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <SectionLabel>혹시 지금,</SectionLabel>
                        <h2 className="tarot-serif" style={{ fontSize:21, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:24, lineHeight:1.48, wordBreak:"keep-all" }}>
                            이런 생각<br />하고 계신가요?
                        </h2>
                    </motion.div>

                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                        {[
                            "그 사람이 지금 나를 생각하고 있을까?",
                            "이 관계, 아직 가능성이 남아 있을까?",
                            "내가 먼저 연락해도 되는 걸까?",
                            "그 사람 마음속엔 지금 누가 있을까?",
                        ].map((q,i)=>(
                            <motion.div key={i}
                                initial={{ opacity:0, x:-16 }}
                                whileInView={{ opacity:1, x:0 }}
                                viewport={{ once:true }}
                                transition={{ delay:i*0.08 }}
                                style={{
                                    ...glass({ borderRadius:13, padding:"15px 18px" }),
                                    display:"flex", alignItems:"center", gap:14,
                                }}
                            >
                                <div style={{
                                    width:8, height:8, borderRadius:"50%", flexShrink:0,
                                    background: i%2===0 ? LAV : GOLD,
                                    boxShadow:`0 0 10px ${i%2===0 ? P+"0.7)" : GOLD_D+"0.6)"}`,
                                }} />
                                <p style={{ fontSize:14, color:"#EDE8F8", margin:0, lineHeight:1.5, fontWeight:500, wordBreak:"keep-all" }}>{q}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{ opacity:0, y:8 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                        style={{ marginTop:18, ...glass({ padding:"15px 18px", textAlign:"center", borderRadius:13 }) }}>
                        <p style={{ fontSize:13, color:LAV, margin:0, lineHeight:1.75, wordBreak:"keep-all" }}>
                            타로는 그 사람의 <strong style={{ color:BLUSH }}>지금 이 순간의 마음</strong>을 읽습니다.<br />
                            확신이 없어도, 두려워도 — 카드는 솔직하게 말해줍니다.
                        </p>
                    </motion.div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 3. 결과 화면 미리보기 (FOMO) ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <SectionLabel>PREVIEW</SectionLabel>
                        <h2 className="tarot-serif" style={{ fontSize:20, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:6, lineHeight:1.45 }}>
                            실제 결과 화면 미리보기
                        </h2>
                        <p style={{ fontSize:13, color:`${P}0.7)`, textAlign:"center", marginBottom:20, lineHeight:1.6 }}>
                            리딩이 끝나면 이런 화면을 받게 돼요
                        </p>
                    </motion.div>
                    <motion.div initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                        <ResultMockups />
                    </motion.div>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.2 }}>
                        <button onClick={go} style={{
                            width:"100%", marginTop:14, padding:"14px",
                            borderRadius:13, border:`1px solid ${P}0.35)`,
                            background:`rgba(61,44,109,0.25)`,
                            backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                            color:LAV, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                        }}>
                            전체 해석 보러 가기 →
                        </button>
                    </motion.div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 4. 상세 목차 ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <SectionLabel>CONTENTS</SectionLabel>
                        <h2 className="tarot-serif" style={{ fontSize:20, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:6, lineHeight:1.45 }}>
                            리딩 상세 목차
                        </h2>
                        <p style={{ fontSize:13, color:`${P}0.7)`, textAlign:"center", marginBottom:22, lineHeight:1.6 }}>
                            총 7장 · 13가지 풀이로 완성되는 리딩
                        </p>
                    </motion.div>

                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {[
                            {
                                num:"01", title:"과거 — 두 사람의 연결 고리",
                                tag:"무료 해석", tc:GOLD, tbg:`${GOLD_D}0.08)`, tbd:`${GOLD_D}0.28)`,
                                items:["관계의 뿌리 — 두 사람이 이어지게 된 근원", "이어져 온 흐름 — 그 시작이 남긴 것"],
                            },
                            {
                                num:"02", title:"현재 — 그 사람의 마음",
                                tag:"프리미엄", tc:LAV, tbg:`${DP}0.15)`, tbd:`${P}0.35)`,
                                items:["겉으로 드러난 태도 — 지금 보여주는 모습", "숨겨진 속마음 — 겉과 다르게 품은 감정", "당신을 향한 진심 — 마음 깊은 곳의 본심"],
                            },
                            {
                                num:"03", title:"미래 — 앞으로의 흐름",
                                tag:"프리미엄", tc:LAV, tbg:`${DP}0.15)`, tbd:`${P}0.35)`,
                                items:["다가올 흐름 — 두 사람 앞에 펼쳐질 기류", "흐름의 열쇠 — 좋은 방향으로 여는 힘"],
                            },
                            {
                                num:"04", title:"스페셜 풀이",
                                tag:"프리미엄", tc:LAV, tbg:`${DP}0.15)`, tbd:`${P}0.35)`,
                                items:["두 사람의 궁합 온도 — 0~100", "그 사람이 끌리는 당신의 모습", "상황별 다가가는 법과 타이밍", "앞으로 한 달, 조심할 것"],
                            },
                            {
                                num:"05", title:"카드의 답",
                                tag:"프리미엄", tc:LAV, tbg:`${DP}0.15)`, tbd:`${P}0.35)`,
                                items:["내 질문에 대한 카드의 최종 답", "7장 전체를 하나로 엮은 최종 메시지"],
                            },
                        ].map((ch,i)=>(
                            <motion.div key={i}
                                initial={{ opacity:0, y:14 }}
                                whileInView={{ opacity:1, y:0 }}
                                viewport={{ once:true }}
                                transition={{ delay:i*0.08 }}
                                style={{ ...glass({ padding:"18px 18px 8px" }) }}
                            >
                                {/* 챕터 헤더 */}
                                <div style={{ marginBottom:12 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                                        <span style={{ fontSize:10.5, fontWeight:800, color:LAV, letterSpacing:"0.18em" }}>
                                            CHAPTER {ch.num}
                                        </span>
                                        <span style={{ fontSize:10, fontWeight:700, color:ch.tc, background:ch.tbg, padding:"2px 7px", borderRadius:999, border:`1px solid ${ch.tbd}` }}>{ch.tag}</span>
                                    </div>
                                    <p className="tarot-serif" style={{ fontSize:16, fontWeight:700, color:"#EDE8F8", margin:0, wordBreak:"keep-all" }}>
                                        {ch.title}
                                    </p>
                                </div>

                                {/* 풀이 목록 */}
                                {ch.items.map((item, j)=>(
                                    <div key={j} style={{
                                        display:"flex", alignItems:"baseline", gap:10,
                                        padding:"10px 2px",
                                        borderTop:`1px solid ${P}0.1)`,
                                    }}>
                                        <span style={{ fontSize:11, fontWeight:800, color:`${P}0.6)`, flexShrink:0, letterSpacing:"0.04em" }}>
                                            풀이 {j+1}
                                        </span>
                                        <span style={{ fontSize:13, color:"rgba(237,232,248,0.85)", lineHeight:1.6, wordBreak:"keep-all" }}>
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 5. 후기 ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <SectionLabel>REVIEWS</SectionLabel>
                        <h2 className="tarot-serif" style={{ fontSize:20, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:22, lineHeight:1.45 }}>실제 후기</h2>
                    </motion.div>

                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                        {[
                            { rel:"헤어진 사이 · 20대", text:"1라운드 무료 해석 보고 소름 돋았어요. 제 상황을 정확히 짚어줬고, 2라운드에서 그 사람 마음 보는데 진짜 눈물 났습니다.." },
                            { rel:"썸 타는 중 · 30대", text:"이렇게 섬세한 해석이 나올 줄 몰랐음... 카드 하나하나 풀이가 구체적이고 마지막 종합 메시지에서 용기 얻었어요" },
                            { rel:"짝사랑 중 · 20대", text:"반신반의하다가 해봤는데 생각보다 훨씬 내용이 풍부해요. 고백 타이밍 조언이 현실적이라 도움됐어요!!" },
                        ].map((r,i)=>(
                            <motion.div key={i}
                                initial={{ opacity:0, y:12 }}
                                whileInView={{ opacity:1, y:0 }}
                                viewport={{ once:true }}
                                transition={{ delay:i*0.1 }}
                                style={{ display:"flex", flexDirection:"column", alignItems: i%2 === 0 ? "flex-start" : "flex-end" }}
                            >
                                {/* 채팅 말풍선 */}
                                <div style={{
                                    ...glass({
                                        padding:"14px 17px",
                                        borderRadius: i%2 === 0 ? "18px 18px 18px 5px" : "18px 18px 5px 18px",
                                        maxWidth:"88%",
                                    }),
                                }}>
                                    <p style={{ fontSize:13.5, color:"rgba(237,232,248,0.9)", lineHeight:1.75, margin:0, wordBreak:"keep-all" }}>
                                        {r.text}
                                    </p>
                                </div>
                                <p style={{ fontSize:10.5, color:`${P}0.45)`, margin:"6px 6px 0", letterSpacing:"0.02em" }}>
                                    {r.rel}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 6. 가격 ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <SectionLabel>PRICING</SectionLabel>
                        <h2 className="tarot-serif" style={{ fontSize:20, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:22, lineHeight:1.45 }}>
                            먼저 경험하고,<br />마음에 들면 결제
                        </h2>
                    </motion.div>

                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {/* 무료 */}
                        <div style={{
                            background:`${GOLD_D}0.06)`, border:`1px solid ${GOLD_D}0.25)`,
                            borderRadius:16, padding:"18px 20px",
                            display:"flex", alignItems:"center", justifyContent:"space-between",
                        }}>
                            <div>
                                <p style={{ fontSize:12, fontWeight:700, color:GOLD, margin:"0 0 4px" }}>1라운드</p>
                                <p style={{ fontSize:15, fontWeight:700, color:"#EDE8F8", margin:0 }}>과거와 연결 고리</p>
                                <p style={{ fontSize:11.5, color:"rgba(237,232,248,0.45)", margin:"3px 0 0" }}>카드 2장 · 타로 해석</p>
                            </div>
                            <p style={{ fontSize:22, fontWeight:800, color:GOLD, margin:0 }}>무료</p>
                        </div>

                        {/* 유료 */}
                        <div style={{
                            background:`linear-gradient(135deg, ${DP}0.22) 0%, rgba(27,31,74,0.3) 100%)`,
                            border:`1.5px solid ${P}0.32)`,
                            borderRadius:16, padding:"18px 20px",
                            boxShadow:`0 0 24px ${NP}0.08)`,
                        }}>
                            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                                <div>
                                    <p style={{ fontSize:12, fontWeight:700, color:LAV, margin:"0 0 4px" }}>심층 리딩 (전체)</p>
                                    <p style={{ fontSize:15, fontWeight:700, color:"#EDE8F8", margin:0 }}>그 사람의 마음과 앞날의 흐름</p>
                                    <p style={{ fontSize:11.5, color:"rgba(237,232,248,0.45)", margin:"3px 0 0" }}>카드 5장 심층 풀이 + 스페셜 풀이 4가지 + 최종 메시지</p>
                                </div>
                                <div style={{ flexShrink:0, marginLeft:12 }}>
                                    <p style={{ fontSize:20, fontWeight:800, color:"#EDE8F8", margin:0 }}>3,900원</p>
                                </div>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                                {[["★","정밀\n해석"],["◈","완전\n개인화"],["◎","즉시\n결과 확인"]].map(([icon,label],i)=>(
                                    <div key={i} style={{
                                        background:`rgba(61,44,109,0.3)`,
                                        border:`1px solid ${P}0.2)`,
                                        borderRadius:11, padding:"11px 6px", textAlign:"center",
                                    }}>
                                        <p style={{ fontSize:15, marginBottom:4, color:GOLD }}>{icon}</p>
                                        <p style={{ fontSize:10, color:LAV, lineHeight:1.4, whiteSpace:"pre-line", margin:0 }}>{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 7. FAQ ── */}
                <section style={{ padding:"36px 24px 0" }}>
                    <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
                        <h2 className="tarot-serif" style={{ fontSize:20, fontWeight:700, color:"#EDE8F8", textAlign:"center", marginBottom:20 }}>자주 묻는 질문</h2>
                    </motion.div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {FAQS.map((f,i)=><FaqItem key={i} {...f} />)}
                    </div>
                </section>

                <div style={{ height:40 }} />
                <Divider />

                {/* ── 8. 최종 CTA ── */}
                <section style={{ padding:"36px 24px 64px", textAlign:"center" }}>
                    <motion.div initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                        <p style={{ fontSize:14, color:`${P}0.55)`, marginBottom:8, letterSpacing:"0.1em" }}>★ ★ ★</p>
                        <h2 className="tarot-serif" style={{ fontSize:22, fontWeight:700, color:"#EDE8F8", marginBottom:10, lineHeight:1.5, wordBreak:"keep-all" }}>
                            오늘,<br />그 사람의 마음을 확인하세요
                        </h2>
                        <p style={{ fontSize:13.5, color:LAV, marginBottom:28, lineHeight:1.7, wordBreak:"keep-all", opacity:0.85 }}>
                            1라운드는 무료입니다. 지금 바로 카드를 뽑아보세요.
                        </p>
                        <button onClick={go} style={{
                            width:"100%", padding:"18px 20px", borderRadius:16,
                            border:`1px solid ${P}0.3)`,
                            background:"var(--tarot-btn-bg)", color:"#EDE8F8", fontSize:17, fontWeight:700,
                            cursor:"pointer", boxShadow:"var(--tarot-btn-shadow)",
                            letterSpacing:"-0.01em", fontFamily:"inherit",
                        }}>
                            ★ 지금 바로 리딩 시작하기
                        </button>
                        <p style={{ fontSize:12, color:`${P}0.38)`, marginTop:10 }}>
                            가입 없이 · 1라운드 무료 · 결제는 나중에
                        </p>
                    </motion.div>
                </section>

            </div>
        </div>
    );
}
