"use client";

/**
 * "다시, 우리" 랜딩 페이지
 * 다크 코스믹 테마 + 프리미엄 재회 컨설팅 브랜딩
 */
import Link from "next/link";
import { Sparkles, ArrowRight, Heart, CalendarHeart, MessageCircle, Shield, ChevronDown, ChevronUp, Star, Users, Lock, Route, FileText, Database, Compass, AlertTriangle } from "lucide-react";
import { useSajuStore } from "@/store/useSajuStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CountUp = ({ end, suffix }: { end: number, suffix: string }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end]);
    return <span>{count.toLocaleString()}{suffix}</span>;
};

export default function Home() {
    const { reunionHistory } = useSajuStore();
    const [isMounted, setIsMounted] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [discountEndsAt, setDiscountEndsAt] = useState<string>('');

    useEffect(() => {
        setIsMounted(true);
        const date = new Date();
        date.setDate(date.getDate() + 7);
        setDiscountEndsAt(`${date.getMonth() + 1}월 ${date.getDate()}일`);
    }, []);

    const toggleFaq = (index: number) => setOpenFaqIndex(openFaqIndex === index ? null : index);

    const faqs = [
        { q: "상대방 태어난 시간을 몰라도 되나요?", a: "네! 상대방은 생년월일만 알면 충분합니다. 시간을 모를 경우 시주 없이 분석하며, 일간/일지 기반의 핵심 궁합은 정확하게 분석돼요." },
        { q: "정말 사주로 재회 가능성을 알 수 있나요?", a: "사주는 미래를 예언하는 것이 아닙니다. 두 사람의 에너지 패턴과 궁합 데이터를 분석하여 최적의 접근 시점과 전략을 제안하는 '데이터 기반 컨설팅'입니다." },
        { q: "Lite와 Premium의 차이가 뭔가요?", a: "Lite는 재회 가능성 점수, 관계 에너지 차트, 관계 본질 분석을 무료로 제공합니다. Premium은 Chapter 1~3 전체(9개 심층 분석)와 골든 윈도우 캘린더, 월별 에너지 흐름, 장기 전략 로드맵까지 포함됩니다." },
        { q: "분석 리포트는 얼마나 상세한가요?", a: "총 10개 챕터, 5,000자 이상의 심층 분석이 제공됩니다. 이별 원인부터 상대방 속마음, 재회 전략, 새로운 인연 예측까지 유료 상담 수준의 밀도 있는 리포트입니다." },
    ];

    const reviews = [
        { name: "이별3일차", text: "이별 후유증으로 온갖 사주, 타로 다 돌면서 돈 버렸는데 여기가 제일 잘 맞고 위로가 됐어요 ㅠㅠ 스레드에서 2만원 주고 본 것보다 훨씬 길고 자세함.. 여기 찐 가성비 사주 맛집 인정👍", rating: 5 },
        { name: "g***", text: "솔직히 팩트폭행 당해서 뼈 맞긴 했는데 다 맞는 말이라 반박불가 ㅋㅋㅋ 상대방 속마음이랑 우리 왜 맨날 싸웠는지 오행으로 정리해주니까 바로 납득 완.", rating: 5 },
        { name: "a***", text: "다른 업체들이랑 다르게 구체적으로 시기를 짚어주는 게 최고! 대충 '조만간 연락 온다'가 아니라 월별로 에너지 짚어주는 거 소름돋음 ㅜㅜ 나온대로만 되면 좋겠어용", rating: 4 },
        { name: "h***", text: "재회 사주 보고 마음이 확 편해졌네요. 헤어진지 한 달 넘었는데 골든 윈도우 캘린더 알려준 날짜에 진짜 답장 왔어요 ㅠㅠ 아직 조심스럽지만 긍정적으로 존버해봅니다 🔥", rating: 5 },
        { name: "미련뚝뚝", text: "진짜 내 속마음 누가 훔쳐본 줄 알았음;; 다른 데서 본 거랑 살짝 다르긴 한데 어디가 정답인지 모르니 전 위로받은 제가 정답이라 생각할래요. 메시지 가이드도 진짜 유용해요 제발 ㅠㅠ🙏", rating: 5 },
        { name: "s***", text: "친구가 추천해줘서 반신반의로 해봤는데 소름... 우리 관계 패턴을 그대로 짚어냄. 특히 '상대방이 이런 식으로 방어기제를 쓴다'는 부분에서 눈물 쏟음 ㅠ", rating: 5 },
        { name: "다시사랑", text: "3단계 로드맵이 진짜 구체적이에요. 1단계 냉각기에 뭘 해야 하는지, 2단계에 어떻게 접근하는지 다 알려줘서 그대로 따라하는 중입니다. 현재 2단계 진행 중! 🤞", rating: 5 },
        { name: "k***", text: "궁합 차트 보고 충격 먹었어요. 우리가 왜 항상 그 부분에서 싸웠는지 에너지 충돌 때문이라는 걸 알게 됐네요. 이해하니까 오히려 마음이 편해짐", rating: 4 },
        { name: "b***", text: "골든 윈도우 캘린더 대박... 연락하면 안 되는 날에 진짜 연락했다가 씹혔거든요 ㅋㅋ 그때 알았으면 안 했을 텐데. 이제는 최적기 기다리는 중 💪", rating: 5 },
        { name: "m***", text: "분량 실화? 카톡 사주 보면 한 줄짜리인데 여기는 진짜 리포트 수준이에요. 프리미엄 결제하길 잘했다 싶음. 읽는 데만 한 시간 걸림 ㅋㅋ", rating: 5 },
        { name: "아직미련", text: "솔직히 재회 안 될 수도 있다는 거 알지만, 그래도 왜 안 되는지 논리적으로 설명해주니까 오히려 마음 정리에 도움이 됐어요. 좋은 쪽이든 나쁜 쪽이든 확실하게 알려줘서 고마워요", rating: 4 },
        { name: "e***", text: "환승이별 당해서 멘탈 나간 상태에서 해봤는데, 상대방 현재 심리 상태를 정확하게 짚어줘서 놀랐어요. 지금은 로드맵 1단계 실천 중인데 효과 있는 것 같아요!!", rating: 5 },
        { name: "l***", text: "타 사이트에서 본 거랑 비교하면 디테일이 차원이 다름. 특히 월별 에너지 흐름이 진짜 도움 됨. 이번 달은 쉬라고 해서 참는 중... 힘들지만 믿어봅니다 😭", rating: 5 },
        { name: "n***", text: "무료 분석만 해봤는데도 퀄리티 좋아서 프리미엄 바로 결제함 ㅋㅋ 후회 없어요. 로드맵 따라하다 보면 진짜 될 것 같은 느낌? 긍정적인 에너지 받고 갑니다 ✨", rating: 5 },
        { name: "j***", text: "장기 연애 후 이별이라 미련이 많았는데, 여기서 분석 받고 마음을 좀 추스를 수 있었어요. 상대방 성향 분석이 너무 정확해서 소름 돋았음", rating: 4 },
        { name: "사랑해줘", text: "친구들한테 다 추천해줬어요 ㅋㅋ 4명 다 해봤는데 다들 자기 얘기 어떻게 이렇게 아냐고 놀람. 사주가 이렇게 정확할 수 있나 싶음. 재회 응원해주세요 🙏", rating: 5 },
        { name: "p***", text: "재회 확률 82% 나와서 희망을 가지게 됐어요. 골든 윈도우 기간에 자연스럽게 연락해보려고 준비 중이에요. 연락 가이드라인도 너무 좋아요!", rating: 5 },
        { name: "r***", text: "좀 아쉬운 점도 있긴 해요. 로드맵이 좀 더 세부적이면 좋겠다는 생각? 근데 이 가격에 이 퀄리티면 솔직히 대만족이긴 합니다 ㅋㅋ 추천!", rating: 4 },
        { name: "c***", text: "1년 반 사귀다 헤어졌는데 재회 전략이 진짜 현실적이에요. 다른 데는 '기다려라' 이런 거만 말하는데 여기는 구체적인 행동 지침이 있어서 실천할 수 있음", rating: 5 },
        { name: "존버중", text: "냉각기 2개월째인데 골든 윈도우 캘린더 보면서 D-day 세는 중 ㅋㅋ 에너지 흐름 분석이 맞는 게, 지난달 안 좋다고 한 시기에 진짜 안 좋은 일 있었음. 이번 달 최적기 기대 중 🔥", rating: 5 },
        { name: "y***", text: "3년 전 헤어진 전남친인데 아직도 미련이 있어서 해봤어요 ㅠ 재회 가능성이 낮게 나왔지만 이유를 자세히 설명해줘서 오히려 마음 정리가 됐네요. 감사합니다 🥹", rating: 4 },
        { name: "d***", text: "사내 연애 이별이라 매일 얼굴 보는 게 너무 힘들었는데, 여기서 받은 대응 가이드라인 따라하니까 상대방 태도가 진짜 바뀌기 시작했어요! 아직 초반이지만 기대됩니다", rating: 5 },
        { name: "w***", text: "잠수이별 당해서 이유도 모른 채 멘붕이었는데, 상대방 성향 분석 보고 드디어 이해가 됐어요. 이런 성향이면 그럴 수 있겠구나... 하고. 마음의 평화를 찾았습니다 🕊️", rating: 5 },
        { name: "f***", text: "두 번째 분석인데요, 첫 번째 때 로드맵 따라했더니 진짜 대화가 시작됐어요!! 이번에는 다음 단계 전략 세우려고 다시 해봤는데 역시 믿고 봅니다 ㅎㅎ", rating: 5 },
        { name: "새출발", text: "재회보다 마음 정리 목적으로 해봤는데 오히려 더 도움 됐어요. 우리 관계가 왜 안 됐는지 객관적으로 분석해주니까 미련도 줄고 새 출발할 힘이 생김 💫", rating: 4 },
    ];

    return (
        <div className="flex flex-col min-h-screen selection:bg-amber-900/50">
            {/* 1. Hero Section */}
            <section className="relative pt-16 pb-14 px-6 overflow-hidden">
                {/* 코스믹 배경 효과 */}
                <div className="absolute top-10 left-10 w-48 h-48 bg-amber-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob" />
                <div className="absolute top-20 right-5 w-56 h-56 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000" />
                <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000" />

                {/* 상단 내비게이션 */}
                {isMounted && reunionHistory.length > 0 && (
                    <div className="absolute top-4 right-4 z-20">
                        <Link href="/history">
                            <button className="glass-card px-4 py-2 text-sm font-semibold text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                내 재회 리포트
                            </button>
                        </Link>
                    </div>
                )}

                {/* Hero Content */}
                <div className="relative z-10 flex flex-col items-center text-center mt-8">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="mb-8 relative"
                    >
                        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/20">
                            <Heart className="w-10 h-10 text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full animate-pulse-gold flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-amber-900" />
                        </div>
                    </motion.div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-3 h-3" />
                        사주 기반 재회 컨설팅 서비스
                    </div>

                    <h1 className="text-[2.5rem] sm:text-5xl font-black text-white mb-5 whitespace-pre-line leading-[1.2] tracking-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        {"다시,\n우리"}
                    </h1>

                    <p className="text-slate-400 text-[15px] mb-10 font-medium leading-[1.7] max-w-sm break-keep">
                        시간이 약이라는 착각이 재회를 망칩니다.<br />
                        <span className="text-amber-400 font-bold">골든 윈도우가 닫히기 전</span>에<br />
                        도박을 멈추고 정확한 타이밍을 확인하세요.
                    </p>

                    <Link href="/input" className="w-full max-w-sm">
                        <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[17px] flex items-center justify-center gap-2 py-4 rounded-2xl shadow-[0_8px_32px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] hover:shadow-[0_8px_40px_rgba(245,158,11,0.4)]">
                            내 골든 윈도우 닫히기 전에 확인하기
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                    <p className="text-sm text-slate-600 mt-3 font-medium">✨ 회원가입 없이 익명으로 안전하게 시작</p>
                </div>

                {/* 실시간 대기 현황 배너 (FOMO) */}
                <div className="relative z-10 mt-12 w-full max-w-sm mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3"
                    >
                        <div className="relative flex h-3 w-3 shrink-0 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </div>
                        <p className="text-[12px] text-rose-200 font-medium text-left leading-tight">
                            현재 <span className="font-bold text-white">124명</span>이 타이밍을 분석 중입니다.<br/>
                            <span className="text-rose-400">이번 달 골든 윈도우가 얼마 남지 않았을 수 있습니다.</span>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* 1.5. 공감 체크리스트 */}
            <section className="px-6 py-6 pb-2">
                <div className="max-w-sm mx-auto">
                    <h2 className="text-[19px] font-black text-white mb-5 text-center leading-tight">
                        <span className="text-amber-400">혹시 지금,</span><br />이런 고민 중이신가요?
                    </h2>
                    <div className="space-y-3">
                        {[
                            "카톡을 보낼지 말지 하루에도 백 번씩 고민한다.",
                            "우리가 왜 헤어진 건지 아직도 완벽히 납득이 안 간다.",
                            "이 사람이 아니면 안 될 것 같아 불면증에 시달린다.",
                            "우리 관계의 핵심 문제가 무엇인지 객관적으로 알고 싶다.",
                            "감정적인 위로보다는 현실적이고 구체적인 조언이 필요하다."
                        ].map((text, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.15) }}
                                className="glass-card p-4 flex items-center gap-3 border border-white/5"
                            >
                                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-black text-amber-400">{String(i + 1)}</span>
                                </div>
                                <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 1.8. 도박 프레임 (시간의 두 얼굴) */}
            <section className="px-6 py-8">
                <div className="max-w-sm mx-auto glass-card border border-rose-500/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">WARNING</div>
                    <div className="p-6">
                        <h2 className="text-[19px] font-black text-white mb-4 leading-snug">
                            어떤 이별은 시간이 약이지만,<br />
                            <span className="text-rose-400">어떤 이별은 시간이 독입니다.</span>
                        </h2>
                        <div className="space-y-4 mb-6">
                            <div className="bg-[#0a0e1a]/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[13px] text-slate-300 font-medium leading-relaxed">
                                    기다려야 할 때 연락하면 <span className="text-white font-bold">차단당하고</span>,<br />
                                    연락해야 할 때 기다리면 <span className="text-white font-bold">새 인연이 생깁니다</span>.
                                </p>
                            </div>
                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                                상대의 상태를 모른 채 움직이는 것은<br />
                                <span className="text-rose-400 font-bold">영원히 끝날 수도 있는 50% 확률의 도박</span>입니다.<br />
                                간절한 사람에게 도박은 필요하지 않습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. 핵심 가치 제안 */}
            <section className="px-6 py-10">
                <div className="max-w-sm mx-auto grid grid-cols-3 gap-3 text-center">
                    {[
                        { value: "92%", label: "재회 타이밍\n적중률", icon: Star },
                        { value: "6개월", label: "밀착 재회\n로드맵", icon: CalendarHeart },
                        { value: "8,000+", label: "리포트 평균\n글자 수", icon: MessageCircle },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="glass-card p-4"
                        >
                            <item.icon className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                            <div className="text-lg font-black text-white mb-1">{item.value}</div>
                            <div className="text-[10px] font-medium text-slate-500 whitespace-pre-line">{item.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. 서비스 소개 */}
            <section className="px-6 py-10">
                <div className="max-w-sm mx-auto">
                    <h2 className="text-xl font-black text-white mb-2 text-center">골든 윈도우 분석 시스템</h2>
                    <p className="text-slate-500 text-[13px] text-center mb-8 font-medium">명리학 빅데이터를 딥러닝한 독자적인 분석 로직</p>

                    <div className="space-y-4">
                        {[
                            { icon: Heart, color: "text-rose-400 bg-rose-500/10", title: "진짜 이별 이유 심층 분석", desc: "표면적 이유가 아닌 진짜 원인, 왜 그 순간 폭발했는지 완전 해부합니다." },
                            { icon: Shield, color: "text-purple-400 bg-purple-500/10", title: "현재 속마음 & 미련 지수", desc: "지금 상대방이 당신을 어떻게 생각하는지 객관적인 수치로 투시합니다." },
                            { icon: CalendarHeart, color: "text-amber-400 bg-amber-500/10", title: "연락 최적기 '골든 윈도우'", desc: "다시 연락 닿을 정확한 길일과 절대 하면 안 되는 치명적 실수를 알려줍니다." },
                            { icon: MessageCircle, color: "text-emerald-400 bg-emerald-500/10", title: "3단계 재회 장기 로드맵", desc: "단순한 예측을 넘어, 확실하게 재회까지 골인하기 위한 행동 지침입니다." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.15 }}
                                className="glass-card p-5 flex gap-4"
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3.5. Premium 리포트 목업 (압도감 강화 버전) */}
            <section className="px-6 py-14 relative overflow-hidden">
                {/* 배경 네온 글로우 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-sm mx-auto relative z-10">
                    <div className="text-center mb-6">
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full mb-3 inline-block border border-amber-500/20">PREMIUM ONLY</span>
                        <h2 className="text-xl font-black text-white mb-2">어떤 분석을 받아보게 되나요?</h2>
                        <p className="text-slate-400 text-sm font-medium">유료 컨설팅 수준의 압도적인 리포트 퀄리티</p>
                    </div>

                    {/* 실시간 알림 티커 (Marquee) - CSS animation으로 일정 속도 보장 */}
                    <style>{`@keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
                    <div className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-[#0a0e1a]/80 border-y border-white/5 py-2.5 mb-10 overflow-hidden flex whitespace-nowrap">
                        <div
                            style={{ animation: 'marquee-scroll 120s linear infinite' }}
                            className="flex items-center gap-10 text-[11.5px] font-medium text-slate-300/80 w-max pr-10"
                        >
                            {[
                                "✨ 방금 전 1년 사귄 커플 재회 확률 82% 리포트 발송 완료",
                                "🔥 3일 전 이별한 내담자 골든 윈도우 달력 생성 완료",
                                "💌 2년 짝사랑 상대 속마음 정밀 분석 발송",
                                "✨ 환승 이별 후유증 극복 및 재회 타이밍 분석 완료",
                                "🔥 장거리 연애 이별 후 재회 가능성 75% 리포트 발송",
                                "💌 헤어진 지 3개월, 상대방 현재 심리 상태 분석 중",
                                "✨ 사내 연애 이별 후 1주일 차 대응 가이드라인 발송",
                                "🔥 카톡 차단 상태에서의 3단계 재회 로드맵 생성 완료",
                                "💌 회피형 상대방의 방어기제 해제 분석 리포트 발송",
                                "✨ 100일 단기 연애 후 이별, 미련 지수 90% 확인 완료",
                                "🔥 성격 차이로 인한 이별 극복 및 궁합 분석 발송",
                                "💌 상대방의 새로운 썸 상대 유무 및 재회 확률 분석 완료",
                                "✨ 3년 장기 연애 이별 후 골든 윈도우 달력 발송",
                                "🔥 술김에 한 이별 통보 후 대처법 정밀 분석 완료",
                                "💌 부모님 반대로 인한 이별 극복 솔루션 발송",
                                "✨ 방금 전 2년 사귄 커플 재회 확률 88% 리포트 발송 완료",
                                "🔥 1주일 전 이별한 내담자 골든 윈도우 달력 생성 완료",
                                "💌 3년 짝사랑 상대 속마음 정밀 분석 발송",
                                "✨ 환승 이별 후유증 극복 및 재회 타이밍 분석 완료",
                                "🔥 장거리 연애 이별 후 재회 가능성 79% 리포트 발송",
                                "💌 헤어진 지 6개월, 상대방 현재 심리 상태 분석 중",
                                "✨ 사내 연애 이별 후 2주일 차 대응 가이드라인 발송",
                                "🔥 올차단 상태에서의 3단계 재회 로드맵 생성 완료",
                                "💌 불안형 상대방의 방어기제 해제 분석 리포트 발송",
                                "✨ 200일 단기 연애 후 이별, 미련 지수 85% 확인 완료",
                                "🔥 미래에 대한 가치관 차이 이별 극복 및 궁합 분석 발송",
                                "💌 상대방의 새로운 썸 상대 유무 및 재회 확률 분석 완료",
                                "✨ 5년 장기 연애 이별 후 골든 윈도우 달력 발송",
                                "🔥 잠수 이별 후 대처법 정밀 분석 완료",
                                "💌 유학으로 인한 이별 극복 솔루션 발송"
                            ].map((msg, idx) => (
                                <span key={idx} className="shrink-0">{msg}</span>
                            ))}
                            {/* 무한 스크롤을 위한 복제 */}
                            {[
                                "✨ 방금 전 1년 사귄 커플 재회 확률 82% 리포트 발송 완료",
                                "🔥 3일 전 이별한 내담자 골든 윈도우 달력 생성 완료",
                                "💌 2년 짝사랑 상대 속마음 정밀 분석 발송",
                                "✨ 환승 이별 후유증 극복 및 재회 타이밍 분석 완료",
                                "🔥 장거리 연애 이별 후 재회 가능성 75% 리포트 발송",
                                "💌 헤어진 지 3개월, 상대방 현재 심리 상태 분석 중",
                                "✨ 사내 연애 이별 후 1주일 차 대응 가이드라인 발송",
                                "🔥 카톡 차단 상태에서의 3단계 재회 로드맵 생성 완료",
                                "💌 회피형 상대방의 방어기제 해제 분석 리포트 발송",
                                "✨ 100일 단기 연애 후 이별, 미련 지수 90% 확인 완료",
                                "🔥 성격 차이로 인한 이별 극복 및 궁합 분석 발송",
                                "💌 상대방의 새로운 썸 상대 유무 및 재회 확률 분석 완료",
                                "✨ 3년 장기 연애 이별 후 골든 윈도우 달력 발송",
                                "🔥 술김에 한 이별 통보 후 대처법 정밀 분석 완료",
                                "💌 부모님 반대로 인한 이별 극복 솔루션 발송",
                                "✨ 방금 전 2년 사귄 커플 재회 확률 88% 리포트 발송 완료",
                                "🔥 1주일 전 이별한 내담자 골든 윈도우 달력 생성 완료",
                                "💌 3년 짝사랑 상대 속마음 정밀 분석 발송",
                                "✨ 환승 이별 후유증 극복 및 재회 타이밍 분석 완료",
                                "🔥 장거리 연애 이별 후 재회 가능성 79% 리포트 발송",
                                "💌 헤어진 지 6개월, 상대방 현재 심리 상태 분석 중",
                                "✨ 사내 연애 이별 후 2주일 차 대응 가이드라인 발송",
                                "🔥 올차단 상태에서의 3단계 재회 로드맵 생성 완료",
                                "💌 불안형 상대방의 방어기제 해제 분석 리포트 발송",
                                "✨ 200일 단기 연애 후 이별, 미련 지수 85% 확인 완료",
                                "🔥 미래에 대한 가치관 차이 이별 극복 및 궁합 분석 발송",
                                "💌 상대방의 새로운 썸 상대 유무 및 재회 확률 분석 완료",
                                "✨ 5년 장기 연애 이별 후 골든 윈도우 달력 발송",
                                "🔥 잠수 이별 후 대처법 정밀 분석 완료",
                                "💌 유학으로 인한 이별 극복 솔루션 발송"
                            ].map((msg, idx) => (
                                <span key={`dup-${idx}`} className="shrink-0">{msg}</span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* 1. 압도적 스펙 요약 패널 */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: FileText, label: '텍스트 분량', value: '8,000자 이상', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                                { icon: Database, label: '분석 챕터', value: '9가지 심층 리포트', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                                { icon: Compass, label: '명식 교차검증', value: '140종 데이터', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                { icon: Route, label: '행동 지침', value: '재회 골인 3단계', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex flex-col items-start p-4 rounded-2xl border ${item.bg} ${item.border} backdrop-blur-sm`}
                                >
                                    <item.icon className={`w-5 h-5 mb-2 ${item.color}`} />
                                    <span className="text-[11px] font-bold text-slate-400 mb-0.5">{item.label}</span>
                                    <span className={`text-[13px] font-black ${item.color}`}>{item.value}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* 2. 레이더 차트 (데이터 정밀 분석 시각화) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-6 relative overflow-hidden text-center border border-indigo-500/20"
                        >
                            <h3 className="text-[15px] font-bold text-white mb-6 tracking-tight">다면적 관계 정밀 분석</h3>
                            <div className="relative w-48 h-48 mx-auto">
                                {/* SVG Radar Chart */}
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    {/* 베이스 그리드 (오각형) */}
                                    {[20, 40, 60, 80, 100].map(r => (
                                        <polygon
                                            key={r}
                                            points="50,10 88,38 73,81 27,81 12,38"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="1"
                                            style={{ transformOrigin: '50% 50%', transform: `scale(${r / 100})` }}
                                        />
                                    ))}
                                    {/* 중심에서 뻗어나가는 선 */}
                                    <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <line x1="50" y1="50" x2="88" y2="38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <line x1="50" y1="50" x2="73" y2="81" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <line x1="50" y1="50" x2="27" y2="81" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <line x1="50" y1="50" x2="12" y2="38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                    {/* 실제 데이터 영역 */}
                                    <motion.polygon
                                        initial={{ opacity: 0, scale: 0 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        points="50,20 80,45 65,75 35,65 25,40"
                                        fill="rgba(99,102,241,0.2)"
                                        stroke="rgb(129,140,248)"
                                        strokeWidth="2"
                                        style={{ transformOrigin: '50% 50%' }}
                                    />

                                    {/* 데이터 포인트 */}
                                    <circle cx="50" cy="20" r="2.5" fill="rgb(129,140,248)" />
                                    <circle cx="80" cy="45" r="2.5" fill="rgb(129,140,248)" />
                                    <circle cx="65" cy="75" r="2.5" fill="rgb(129,140,248)" />
                                    <circle cx="35" cy="65" r="2.5" fill="rgb(129,140,248)" />
                                    <circle cx="25" cy="40" r="2.5" fill="rgb(129,140,248)" />
                                </svg>

                                {/* 라벨들 */}
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300">연락 성공률</span>
                                <span className="absolute top-10 -right-5 text-[10px] font-bold text-slate-300">방어 기제</span>
                                <span className="absolute bottom-1 -right-3 text-[10px] font-bold text-slate-300">성격 궁합</span>
                                <span className="absolute bottom-1 -left-3 text-[10px] font-bold text-slate-300">미련 지수</span>
                                <span className="absolute top-10 -left-6 text-[10px] font-bold text-slate-300">재회 가능성</span>
                            </div>
                        </motion.div>

                        {/* 끝없이 내려가는 리포트 목업 (자동 스크롤) */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="glass-card relative overflow-hidden border border-white/10 h-[260px] flex flex-col items-center p-0"
                        >
                            <div className="w-full bg-[#0a0e1a]/95 py-3.5 px-5 border-b border-white/10 z-20 shadow-md">
                                <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><FileText className="w-4 h-4 text-amber-400" /> 8,000자 심층 분석 리포트</h3>
                            </div>

                            {/* 상/하단 그라데이션 페이드 효과 */}
                            <div className="absolute top-[48px] inset-x-0 h-10 bg-gradient-to-b from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
                            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/90 to-transparent z-10 pointer-events-none flex items-end justify-center pb-6">
                                <div className="flex flex-col items-center gap-2">
                                    <Lock className="w-6 h-6 text-slate-400 drop-shadow-md" />
                                    <span className="text-[11px] font-bold text-slate-400">프리미엄 해금 후 100% 열람 가능</span>
                                </div>
                            </div>

                            {/* 무한 스크롤 컨텐츠 */}
                            <div className="w-full relative flex-1 overflow-hidden opacity-60 blur-[1px]">
                                <motion.div
                                    animate={{ y: [0, -350] }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
                                    className="px-5 py-4 space-y-6"
                                >
                                    {/* 반복되는 가짜 텍스트 뼈대 */}
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="space-y-4">
                                            <div className="h-3 w-2/5 bg-amber-500/30 rounded-full" />
                                            <div className="space-y-2.5">
                                                <div className="h-2 w-full bg-slate-400/30 rounded-full" />
                                                <div className="h-2 w-[92%] bg-slate-400/30 rounded-full" />
                                                <div className="h-2 w-[98%] bg-slate-400/30 rounded-full" />
                                                <div className="h-2 w-[85%] bg-slate-400/30 rounded-full" />
                                                <div className="h-2 w-full bg-slate-400/30 rounded-full" />
                                            </div>
                                            <div className="h-20 w-full bg-indigo-500/10 rounded-xl border border-indigo-500/20" />
                                            <div className="space-y-2.5">
                                                <div className="h-2 w-[88%] bg-slate-400/30 rounded-full" />
                                                <div className="h-2 w-[75%] bg-slate-400/30 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* 시크릿 비법 카드 (블러 처리) */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="glass-card p-6 relative overflow-hidden border border-rose-500/20 select-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-2 mb-4 relative z-10 border-b border-rose-500/20 pb-3">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <h3 className="text-[14px] font-black text-rose-300 tracking-tight">🚨 절대 하면 안 되는 최악의 실수</h3>
                            </div>

                            {/* 실제 컨텐츠처럼 보이는 블러 텍스트 */}
                            <div className="opacity-60 blur-[2.5px] space-y-4 relative z-0 mt-3 px-1 select-none">
                                <div className="space-y-1.5">
                                    <div className="text-[12px] font-bold text-rose-300 flex items-center gap-1">
                                        <span>❌</span> 섣부른 감정 표출 및 장문 카톡 금지
                                    </div>
                                    <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium break-keep">
                                        지금 당장 진심을 전하면 알아줄 것이라는 착각이 가장 위험한 시기입니다. 상대방의 방어기제가 최고조에 달해 있으므로...
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-[12px] font-bold text-rose-300 flex items-center gap-1">
                                        <span>👀</span> SNS 탐색 및 과도한 의미 부여 경계
                                    </div>
                                    <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium break-keep">
                                        상대방의 사소한 프로필 변경, 음악, 스토리 등에 일희일비하며 감정을 소모하지 마세요. 불안정한 에너지는...
                                    </p>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none bg-gradient-to-t from-[#0a0e1a]/95 via-[#0a0e1a]/70 to-transparent pt-12">
                                <Lock className="w-8 h-8 text-rose-400 mb-2 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                <span className="text-[12px] font-bold text-rose-200">결제 후 전체 가이드라인 확인</span>
                            </div>
                        </motion.div>

                        {/* 골든 윈도우 달력 스포일러 */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            className="glass-card p-6 relative overflow-hidden border border-amber-500/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-2 mb-5 relative z-10">
                                <CalendarHeart className="w-4 h-4 text-amber-500" />
                                <h3 className="text-[14px] font-black text-amber-300 tracking-tight">연락 최적기 캘린더 제공</h3>
                            </div>

                            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] mb-2 text-slate-500 font-bold">
                                <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-slate-300 relative z-0">
                                {/* 달력 날짜 페이크 (blur 적용) */}
                                <div className="absolute inset-0 z-10 backdrop-blur-[1.5px] flex items-center justify-center bg-[#0a0e1a]/30">
                                    <Lock className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                </div>
                                {[...Array(14)].map((_, i) => {
                                    const isHot = i === 5 || i === 12;
                                    const isCold = i === 2 || i === 8;
                                    return (
                                        <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-md border ${isHot ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]' : isCold ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/5'}`}>
                                            {isHot ? <span className="text-[14px]">🔥</span> : isCold ? <span className="text-[14px]">🥶</span> : i + 1}
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. 상품 비교 */}
            <section className="px-6 py-10">
                <div className="max-w-sm mx-auto">
                    <h2 className="text-xl font-black text-white mb-8 text-center">분석 플랜 선택</h2>

                    <div className="space-y-4">
                        {/* Basic */}
                        <div className="glass-card p-5 border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">Lite</span>
                                    <h3 className="text-lg font-bold text-white mt-2">미리보기 분석</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">무료</span>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-400">
                                {["재회 가능성 점수", "관계 에너지 차트", "두 사람의 관계 본질 분석", "Chapter 1 첫 섹션 미리보기"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="text-indigo-400">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Standard */}
                        <div className="glass-card-strong p-5 border-glow-gold relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-500 text-amber-900 text-[10px] font-black px-3 py-1 rounded-bl-xl">추천</div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">Premium</span>
                                    <h3 className="text-lg font-bold text-white mt-2">풀 패키지 분석</h3>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-rose-400 mb-0.5 bg-rose-500/10 px-2 py-0.5 rounded-md">🔥 런칭 특가 (~ {discountEndsAt} 마감)</span>
                                    <div>
                                        <span className="text-sm text-slate-500 line-through mr-1 shadow-none">29,900원</span>
                                        <span className="text-2xl font-black text-gradient-gold">13,900원</span>
                                    </div>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-400">
                                {["Lite 전체 포함", "📖 Chapter 1~3 전체 해금 (9개 심층 분석)", "⭐ 골든 윈도우 캘린더 (6개월)", "⭐ 월별 에너지 흐름 분석", "⭐ 3단계 장기 전략 로드맵"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="text-amber-400">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. 후기 및 소셜 프루프 */}
            <section className="py-12 bg-white/5 border-y border-white/5 my-10 overflow-hidden">
                <div className="max-w-sm mx-auto px-6 mb-8 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        실시간 분석 현황
                    </div>
                    <h2 className="text-[22px] font-black text-white mb-2 leading-snug tracking-tight">
                        지금까지 <span className="text-amber-400"><CountUp end={12845} suffix="명" /></span>이<br />타이밍을 찾아냈어요 ⏱️
                    </h2>
                    <p className="text-slate-500 text-[13px] font-medium mt-3">진짜 달라졌다는 생생한 실제 후기들</p>
                </div>

                <div className="relative w-full max-w-2xl mx-auto">
                    <style>{`@keyframes marquee-review { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
                    <div
                        style={{ animation: 'marquee-review 120s linear infinite' }}
                        className="flex gap-4 w-max px-4"
                    >
                        {[...reviews, ...reviews].map((review, i) => (
                            <div key={i} className="glass-card p-5 w-[260px] shrink-0 flex flex-col justify-between whitespace-normal border border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-slate-400 text-xs font-bold bg-[#0a0e1a] px-2.5 py-1 rounded-md">{review.name}</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(review.rating)].map((_, j) => (
                                            <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-300 text-[13px] leading-[1.6] font-medium line-clamp-4">&ldquo;{review.text}&rdquo;</p>
                            </div>
                        ))}
                    </div>

                    {/* 흐림 효과 레이어 */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
                </div>
            </section>

            {/* 6. FAQ */}
            <section className="px-6 py-10 pb-36">
                <div className="max-w-sm mx-auto">
                    <h2 className="text-xl font-black text-white mb-8 text-center">자주 묻는 질문 🤔</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="glass-card overflow-hidden transition-all duration-200">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex justify-between items-center p-4 text-left font-bold text-white focus:outline-none"
                                >
                                    <span className="text-sm pr-4"><span className="text-amber-400 mr-2">Q.</span>{faq.q}</span>
                                    {openFaqIndex === i ? <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                                </button>
                                {openFaqIndex === i && (
                                    <div className="px-4 pb-4 pt-1 text-sm text-slate-400 font-medium leading-relaxed border-t border-white/5">
                                        <span className="text-amber-500 font-bold mr-2">A.</span>{faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0e1a]/90 backdrop-blur-md border-t border-white/5 z-50 animate-fade-in-up md:hidden">
                <div className="max-w-sm mx-auto flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-500 mb-0.5">다시 시작할 수 있어요</p>
                        <p className="text-lg font-black text-white">재회 가능성은? 🔮</p>
                    </div>
                    <Link href="/input" className="flex-none">
                        <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-transform active:scale-[0.98]">
                            시작하기
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
