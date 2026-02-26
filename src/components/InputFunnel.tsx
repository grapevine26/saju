"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, ChevronRight } from "lucide-react";

const steps = ["name", "gender", "birthdate", "birthtime"];

export default function InputFunnel() {
    const router = useRouter();
    const [stepIndex, setStepIndex] = useState(0);

    const currentStep = steps[stepIndex];

    // Store values
    const {
        name, setName,
        gender, setGender,
        calendarType, setCalendarType,
        birthYear, birthMonth, birthDay, setBirthDate,
        birthTime, isTimeUnknown, setBirthTime
    } = useSajuStore();

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex((prev) => prev + 1);
        } else {
            // 마지막 단계에서 결과/로딩 페이지로 이동
            router.push("/loading");
        }
    };

    const handlePrev = () => {
        if (stepIndex > 0) {
            setStepIndex((prev) => prev - 1);
        } else {
            router.push("/");
        }
    };

    // 애니메이션 Variants
    const variants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 },
    };

    const isNextDisabled = () => {
        if (currentStep === "name" && name.trim().length < 2) return true;
        if (currentStep === "gender" && !gender) return true;
        if (currentStep === "birthdate" && (!birthYear || !birthMonth || !birthDay)) return true;
        if (currentStep === "birthtime" && !isTimeUnknown && !birthTime) return true;
        return false;
    };

    return (
        <div className="flex flex-col min-h-screen pb-24 pt-4 px-6 relative">
            <header className="flex items-center justify-between mb-8 z-10 w-full bg-white/80 backdrop-blur-md pb-4 sticky top-0">
                <button onClick={handlePrev} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-1.5">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx <= stepIndex ? "w-6 bg-slate-800" : "w-1.5 bg-slate-200"}`}
                        />
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-visible relative items-center flex justify-center w-full">
                <div className="w-full absolute inset-x-0 top-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full"
                        >
                            {/* === Step 1: Name === */}
                            {currentStep === "name" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">이름이 무엇인가요?</h2>
                                        <p className="text-slate-500">정확한 사주 풀이를 위해 필요해요.</p>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="홍길동"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full text-2xl border-b-2 border-slate-200 focus:border-purple-600 py-3 outline-none transition-colors placeholder:text-slate-300 font-medium"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* === Step 2: Gender === */}
                            {currentStep === "gender" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">성별을 알려주세요.</h2>
                                        <p className="text-slate-500">사주는 성별에 따라 대운의 흐름이 달라집니다.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setGender('male')}
                                            className={`flex-1 py-5 rounded-2xl border-2 transition-all font-semibold text-lg ${gender === 'male'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            남자
                                        </button>
                                        <button
                                            onClick={() => setGender('female')}
                                            className={`flex-1 py-5 rounded-2xl border-2 transition-all font-semibold text-lg ${gender === 'female'
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            여자
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* === Step 3: Birthdate === */}
                            {currentStep === "birthdate" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">언제 태어나셨나요?</h2>
                                    </div>

                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                                        <button
                                            onClick={() => setCalendarType('solar')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${calendarType === 'solar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                                        >
                                            양력
                                        </button>
                                        <button
                                            onClick={() => setCalendarType('lunar')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${calendarType === 'lunar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                                        >
                                            음력
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            placeholder="YYYY"
                                            value={birthYear}
                                            onChange={(e) => setBirthDate(e.target.value.slice(0, 4), birthMonth, birthDay)}
                                            className="w-1/2 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="MM"
                                            value={birthMonth}
                                            onChange={(e) => setBirthDate(birthYear, e.target.value.slice(0, 2), birthDay)}
                                            className="w-1/4 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="DD"
                                            value={birthDay}
                                            onChange={(e) => setBirthDate(birthYear, birthMonth, e.target.value.slice(0, 2))}
                                            className="w-1/4 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* === Step 4: Birth Time === */}
                            {currentStep === "birthtime" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">태어난 시간은요?</h2>
                                        <p className="text-slate-500">시간을 알면 100% 더 정확한 풀이가 가능해요.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <select
                                            disabled={isTimeUnknown}
                                            value={birthTime}
                                            onChange={(e) => setBirthTime(e.target.value, false)}
                                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500 text-lg appearance-none disabled:opacity-50 disabled:bg-slate-100"
                                        >
                                            <option value="" disabled>시간 선택 (예: 자시 23:30~01:29)</option>
                                            <option value="자시">자시 (23:30 ~ 01:29)</option>
                                            <option value="축시">축시 (01:30 ~ 03:29)</option>
                                            <option value="인시">인시 (03:30 ~ 05:29)</option>
                                            <option value="묘시">묘시 (05:30 ~ 07:29)</option>
                                            <option value="진시">진시 (07:30 ~ 09:29)</option>
                                            <option value="사시">사시 (09:30 ~ 11:29)</option>
                                            <option value="오시">오시 (11:30 ~ 13:29)</option>
                                            <option value="미시">미시 (13:30 ~ 15:29)</option>
                                            <option value="신시">신시 (15:30 ~ 17:29)</option>
                                            <option value="유시">유시 (17:30 ~ 19:29)</option>
                                            <option value="술시">술시 (19:30 ~ 21:29)</option>
                                            <option value="해시">해시 (21:30 ~ 23:29)</option>
                                        </select>

                                        <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isTimeUnknown}
                                                onChange={(e) => {
                                                    setBirthTime('', e.target.checked);
                                                }}
                                                className="w-5 h-5 accent-purple-600 rounded"
                                            />
                                            <span className="text-slate-700 font-medium">태어난 시간을 모릅니다</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white/90 backdrop-blur pb-6 border-t border-slate-100">
                <button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-30 disabled:translate-y-0 active:scale-[0.98]"
                >
                    {stepIndex === steps.length - 1 ? '사주결과 확인하기' : '다음'}
                    {stepIndex !== steps.length - 1 && <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>
            </div>
        </div>
    );
}
