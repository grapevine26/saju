"use client";

/**
 * DualInputForm — 2인(나 + 상대방) 정보 입력 폼
 * 스텝 전환 방식: Step 1(나) → Step 2(상대방) → Step 3(이별 컨텍스트) → 분석 시작
 */
import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, ChevronRight, Heart, User, MessageSquare, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef } from "react";
import LocationSearch from "./LocationSearch";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function DualInputForm() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // 자동 포커스 체인용 ref
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const minuteRef = useRef<HTMLInputElement>(null);

    // 나의 정보
    const {
        name, setName,
        gender, setGender,
        calendarType, setCalendarType,
        birthYear, birthMonth, birthDay, setBirthDate,
        birthCity, birthHour, birthMinute, isTimeUnknown, setBirthLocationTime,
    } = useSajuStore();

    // 상대방 정보
    const {
        partnerName, setPartnerName,
        partnerGender, setPartnerGender,
        partnerCalendarType, setPartnerCalendarType,
        partnerBirthYear, partnerBirthMonth, partnerBirthDay, setPartnerBirthDate,
        partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, setPartnerBirthLocationTime,
        currentTier, setCurrentTier,
    } = useSajuStore();

    // 이별 컨텍스트
    const { metDate, setMetDate, breakupDate, setBreakupDate, breakupReason, setBreakupReason } = useSajuStore();

    const validateStep1 = (): string | null => {
        if (name.trim().length < 1) return "이름을 입력해주세요.";
        if (!gender) return "성별을 선택해주세요.";
        if (!birthYear || !birthMonth || !birthDay) return "생년월일을 모두 입력해주세요.";
        if (!isTimeUnknown && (!birthHour || !birthMinute)) return "태어난 시와 분을 입력하거나 '모름'을 체크해주세요.";
        return null;
    };

    const validateStep2 = (): string | null => {
        if (partnerName.trim().length < 1) return "상대방 이름을 입력해주세요.";
        if (!partnerGender) return "상대방 성별을 선택해주세요.";
        if (!partnerBirthYear || !partnerBirthMonth || !partnerBirthDay) return "상대방 생년월일을 모두 입력해주세요.";
        return null;
    };

    const handleNextStep1 = () => {
        const error = validateStep1();
        if (error) { toast.error(error); return; }
        setStep(2);
    };

    const handleNextStep2 = () => {
        const error = validateStep2();
        if (error) { toast.error(error); return; }
        setStep(3);
    };

    const handleSubmit = () => {
        // 이별 날짜/이유는 선택 사항이므로 검증 없이 분석 시작
        router.push("/analysis");
    };

    // 공통 입력 섹션 렌더러
    const renderInputSection = (isPartner: boolean) => {
        const currentName = isPartner ? partnerName : name;
        const currentGender = isPartner ? partnerGender : gender;
        const currentCalendarType = isPartner ? partnerCalendarType : calendarType;
        const currentBirthYear = isPartner ? partnerBirthYear : birthYear;
        const currentBirthMonth = isPartner ? partnerBirthMonth : birthMonth;
        const currentBirthDay = isPartner ? partnerBirthDay : birthDay;
        const currentBirthCity = isPartner ? partnerBirthCity : birthCity;
        const currentBirthHour = isPartner ? partnerBirthHour : birthHour;
        const currentBirthMinute = isPartner ? partnerBirthMinute : birthMinute;
        const currentIsTimeUnknown = isPartner ? partnerIsTimeUnknown : isTimeUnknown;

        return (
            <div className="space-y-8">
                {/* 이름 */}
                <section className="space-y-3">
                    <label className="block text-sm font-bold text-slate-300">{isPartner ? '상대방' : '나의'} 이름</label>
                    <input
                        type="text"
                        placeholder={isPartner ? "그 사람의 이름" : "홍길동"}
                        value={currentName}
                        onChange={(e) => isPartner ? setPartnerName(e.target.value) : setName(e.target.value)}
                        className="w-full text-lg text-white border-b-2 border-white/10 focus:border-amber-500 py-3 bg-transparent outline-none transition-colors placeholder:text-slate-600 font-medium"
                    />
                </section>

                {/* 성별 */}
                <section className="space-y-3">
                    <label className="block text-sm font-bold text-slate-300">성별</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                isPartner ? setPartnerGender('male') : setGender('male');
                                yearRef.current?.focus();
                            }}
                            className={`flex-1 py-3.5 rounded-xl border transition-all font-semibold text-sm ${currentGender === 'male'
                                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                                : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/8'
                                }`}
                        >
                            남자
                        </button>
                        <button
                            onClick={() => {
                                isPartner ? setPartnerGender('female') : setGender('female');
                                yearRef.current?.focus();
                            }}
                            className={`flex-1 py-3.5 rounded-xl border transition-all font-semibold text-sm ${currentGender === 'female'
                                ? 'border-pink-500/50 bg-pink-500/10 text-pink-400'
                                : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/8'
                                }`}
                        >
                            여자
                        </button>
                    </div>
                </section>

                {/* 생년월일 */}
                <section className="space-y-3">
                    <label className="block text-sm font-bold text-slate-300">생년월일</label>
                    <div className="flex bg-white/5 p-1 rounded-xl mb-3 w-fit border border-white/5">
                        <button
                            onClick={() => isPartner ? setPartnerCalendarType('solar') : setCalendarType('solar')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${currentCalendarType === 'solar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >양력</button>
                        <button
                            onClick={() => isPartner ? setPartnerCalendarType('lunar') : setCalendarType('lunar')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${currentCalendarType === 'lunar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >음력</button>
                    </div>

                    <div className="flex gap-2">
                        <input
                            ref={yearRef}
                            type="number" placeholder="YYYY"
                            value={currentBirthYear}
                            onChange={(e) => {
                                const v = e.target.value.slice(0, 4);
                                isPartner ? setPartnerBirthDate(v, currentBirthMonth, currentBirthDay) : setBirthDate(v, birthMonth, birthDay);
                                if (v.length === 4) monthRef.current?.focus();
                            }}
                            className="w-1/2 p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm"
                        />
                        <input
                            ref={monthRef}
                            type="number" placeholder="MM"
                            value={currentBirthMonth}
                            onChange={(e) => {
                                const v = e.target.value.slice(0, 2);
                                isPartner ? setPartnerBirthDate(currentBirthYear, v, currentBirthDay) : setBirthDate(birthYear, v, birthDay);
                                if (v.length === 2) dayRef.current?.focus();
                            }}
                            className="w-1/4 p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm"
                        />
                        <input
                            ref={dayRef}
                            type="number" placeholder="DD"
                            value={currentBirthDay}
                            onChange={(e) => {
                                const v = e.target.value.slice(0, 2);
                                isPartner ? setPartnerBirthDate(currentBirthYear, currentBirthMonth, v) : setBirthDate(birthYear, birthMonth, v);
                                if (v.length === 2) {
                                    // 일 입력 완료 → 지역 검색 input으로 포커스
                                    const locationInput = document.querySelector<HTMLInputElement>(`[data-location-input="${isPartner ? 'partner' : 'my'}"]`);
                                    locationInput?.focus();
                                }
                            }}
                            className="w-1/4 p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm"
                        />
                    </div>
                </section>

                {/* 시간/지역 (상대방은 선택사항) */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-300">
                            태어난 시간/지역
                            {isPartner && <span className="text-xs font-normal text-slate-600 ml-2">(선택)</span>}
                        </label>
                    </div>

                    <div className="space-y-3">
                        {/* 지역 */}
                        <div className="relative z-30">
                            <LocationSearch
                                disabled={currentIsTimeUnknown}
                                value={currentBirthCity}
                                dataLocationInput={isPartner ? 'partner' : 'my'}
                                onSelect={(cityName, tz, lon) => {
                                    if (isPartner) {
                                        setPartnerBirthLocationTime(cityName, currentBirthHour, currentBirthMinute, currentIsTimeUnknown, tz, lon);
                                    } else {
                                        setBirthLocationTime(cityName, birthHour, birthMinute, isTimeUnknown, tz, lon);
                                    }
                                    // 지역 선택 완료 → 시 입력으로 포커스
                                    setTimeout(() => hourRef.current?.focus(), 100);
                                }}
                            />
                        </div>

                        {/* 시/분 */}
                        <div className="flex gap-2">
                            <div className="relative w-1/2">
                                <input
                                    ref={hourRef}
                                    type="number" min="0" max="23" placeholder="시 (0~23)"
                                    disabled={currentIsTimeUnknown}
                                    value={currentBirthHour}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (parseInt(val) > 23) val = "23";
                                        if (parseInt(val) < 0) val = "0";
                                        if (isPartner) {
                                            setPartnerBirthLocationTime(currentBirthCity, val, currentBirthMinute, currentIsTimeUnknown);
                                        } else {
                                            setBirthLocationTime(birthCity, val, birthMinute, isTimeUnknown);
                                        }

                                        // 2자리 입력되면 분 단위로 자동 포커스
                                        if (val.length === 2) minuteRef.current?.focus();
                                    }}
                                    className="w-full p-3.5 text-center rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-bold text-sm disabled:opacity-30"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-medium text-sm">시</span>
                            </div>
                            <div className="relative w-1/2">
                                <input
                                    ref={minuteRef}
                                    type="number" min="0" max="59" placeholder="분 (0~59)"
                                    disabled={currentIsTimeUnknown}
                                    value={currentBirthMinute}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (parseInt(val) > 59) val = "59";
                                        if (parseInt(val) < 0) val = "0";
                                        if (isPartner) {
                                            setPartnerBirthLocationTime(currentBirthCity, currentBirthHour, val, currentIsTimeUnknown);
                                        } else {
                                            setBirthLocationTime(birthCity, birthHour, val, isTimeUnknown);
                                        }
                                    }}
                                    className="w-full p-3.5 text-center rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-bold text-sm disabled:opacity-30"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-medium text-sm">분</span>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/8 transition-colors">
                            <input
                                type="checkbox"
                                checked={currentIsTimeUnknown}
                                onChange={(e) => {
                                    if (isPartner) {
                                        setPartnerBirthLocationTime(currentBirthCity, '', '', e.target.checked);
                                    } else {
                                        setBirthLocationTime(birthCity, '', '', e.target.checked);
                                    }
                                }}
                                className="w-4 h-4 accent-amber-500 rounded"
                            />
                            <span className="text-slate-400 font-medium text-sm">태어난 시간을 모릅니다</span>
                        </label>
                    </div>
                </section>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen pb-28 relative">
            {/* 헤더 */}
            <header className="flex items-center p-4 sticky top-0 bg-[#0a0e1a]/80 backdrop-blur-md z-40 border-b border-white/5">
                {step === 1 ? (
                    <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors mr-2">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                ) : (
                    <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors mr-2">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                <span className="font-semibold text-white text-lg">정보 입력</span>

                {/* 3단계 스텝 인디케이터 */}
                <div className="ml-auto flex items-center gap-2">
                    <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-amber-500' : 'bg-white/10'}`} />
                    <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-amber-500' : 'bg-white/10'}`} />
                    <div className={`w-8 h-1 rounded-full transition-colors ${step >= 3 ? 'bg-amber-500' : 'bg-white/10'}`} />
                </div>
            </header>

            {/* 스텝 콘텐츠 */}
            <main className="flex-1 p-6">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">나의 정보</h2>
                                    <p className="text-xs text-slate-500">정확할수록 분석이 더 정밀해져요</p>
                                </div>
                            </div>
                            {renderInputSection(false)}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">상대방 정보</h2>
                                    <p className="text-xs text-slate-500">생년월일만 알아도 충분해요</p>
                                </div>
                            </div>
                            {renderInputSection(true)}

                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">이별 이야기</h2>
                                    <p className="text-xs text-slate-500">더 정확한 분석을 위해 알려주세요 <span className="text-slate-600">(선택)</span></p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* 만난 날짜 */}
                                <section className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300">
                                        처음 사귄 날은 언제인가요?
                                        <span className="text-xs font-normal text-slate-600 ml-2">(선택)</span>
                                    </label>
                                    <p className="text-xs text-slate-600">연애가 시작된 시기의 에너지를 분석하는 데 활용돼요</p>
                                    <div className="flex gap-3">
                                        <div className="relative w-1/2">
                                            <select
                                                value={metDate ? metDate.split('-')[0] : ''}
                                                onChange={(e) => {
                                                    const m = metDate ? metDate.split('-')[1] : '01';
                                                    setMetDate(e.target.value ? `${e.target.value}-${m}` : '');
                                                }}
                                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-800">년도 선택</option>
                                                {Array.from({ length: 20 }).map((_, i) => {
                                                    const y = new Date().getFullYear() - i;
                                                    return <option key={y} value={y} className="text-slate-800">{y}년</option>;
                                                })}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="relative w-1/2">
                                            <select
                                                value={metDate ? metDate.split('-')[1] : ''}
                                                onChange={(e) => {
                                                    const y = metDate ? metDate.split('-')[0] : new Date().getFullYear().toString();
                                                    setMetDate(e.target.value ? `${y}-${e.target.value}` : '');
                                                }}
                                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-800">월 선택</option>
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const m = String(i + 1).padStart(2, '0');
                                                    return <option key={m} value={m} className="text-slate-800">{m}월</option>;
                                                })}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 이별 날짜 */}
                                <section className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300">
                                        언제 헤어졌나요?
                                        <span className="text-xs font-normal text-slate-600 ml-2">(선택)</span>
                                    </label>
                                    <p className="text-xs text-slate-600">이별 시점의 운의 흐름을 분석하는 데 활용돼요</p>
                                    <div className="flex gap-3">
                                        <div className="relative w-1/2">
                                            <select
                                                value={breakupDate ? breakupDate.split('-')[0] : ''}
                                                onChange={(e) => {
                                                    const m = breakupDate ? breakupDate.split('-')[1] : '01';
                                                    setBreakupDate(e.target.value ? `${e.target.value}-${m}` : '');
                                                }}
                                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-800">년도 선택</option>
                                                {Array.from({ length: 10 }).map((_, i) => {
                                                    const y = new Date().getFullYear() - i;
                                                    return <option key={y} value={y} className="text-slate-800">{y}년</option>;
                                                })}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="relative w-1/2">
                                            <select
                                                value={breakupDate ? breakupDate.split('-')[1] : ''}
                                                onChange={(e) => {
                                                    const y = breakupDate ? breakupDate.split('-')[0] : new Date().getFullYear().toString();
                                                    setBreakupDate(e.target.value ? `${y}-${e.target.value}` : '');
                                                }}
                                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" className="text-slate-800">월 선택</option>
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const m = String(i + 1).padStart(2, '0');
                                                    return <option key={m} value={m} className="text-slate-800">{m}월</option>;
                                                })}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 이별 이유 / 고민 */}
                                <section className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300">
                                        이별 이유 또는 현재 고민을 적어주세요
                                        <span className="text-xs font-normal text-slate-600 ml-2">(선택)</span>
                                    </label>
                                    <p className="text-xs text-slate-600">상황을 구체적으로 쓸수록 분석의 정확도가 높아져요</p>
                                    <textarea
                                        placeholder={"예) 성격 차이로 헤어졌는데 아직 미련이 있어요.\n연락을 시도해봤는데 무반응이에요.\n어떻게 접근하면 좋을까요?"}
                                        value={breakupReason}
                                        onChange={(e) => setBreakupReason(e.target.value)}
                                        rows={6}
                                        maxLength={500}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-amber-500/50 text-white font-medium text-sm resize-none placeholder:text-slate-600 placeholder:leading-relaxed leading-relaxed"
                                    />
                                    <p className="text-right text-xs text-slate-600">{breakupReason.length} / 500자</p>
                                </section>

                                {/* 안내 문구 */}
                                <div className="glass-card p-4 flex gap-3">
                                    <span className="text-lg leading-none mt-0.5">🔒</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        입력하신 내용은 분석에만 사용되며 서버에 저장되지 않습니다.
                                        건너뛰어도 사주 데이터만으로 기본 분석이 가능해요.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* 하단 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-[#0a0e1a]/90 backdrop-blur-md pb-6 border-t border-white/5 z-50">
                {step === 1 && (
                    <button
                        onClick={handleNextStep1}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        다음: 상대방 정보 입력
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
                {step === 2 && (
                    <button
                        onClick={handleNextStep2}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        다음: 이별 이야기 입력
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
                {step === 3 && (
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_32px_rgba(245,158,11,0.3)] flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        재회 가능성 분석 시작
                        <Heart className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
