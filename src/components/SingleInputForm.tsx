"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ZHI_TIME_RANGES } from "@/constants/sajuTime";
import { useState } from "react";
import LocationSearch from "./LocationSearch";

export default function SingleInputForm() {
    const router = useRouter();
    const [showTimeTooltip, setShowTimeTooltip] = useState(false);

    // Store values
    const {
        name, setName,
        gender, setGender,
        calendarType, setCalendarType,
        birthYear, birthMonth, birthDay, setBirthDate,
        birthCity, birthTimezone, birthLongitude, birthHour, birthMinute, isTimeUnknown, setBirthLocationTime,
        saveProfile
    } = useSajuStore();

    const validateForm = (): string | null => {
        if (name.trim().length < 1) return "이름을 한 글자 이상 입력해주세요.";
        if (!gender) return "성별을 선택해주세요.";
        if (!birthYear || !birthMonth || !birthDay) return "생년월일을 모두 입력해주세요.";
        if (!isTimeUnknown && (!birthHour || !birthMinute)) return "정확한 태어난 시와 분을 입력하거나 '모름'을 체크해주세요.";
        return null;
    };

    const handleNext = () => {
        const errorMessage = validateForm();
        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        const newProfileId = saveProfile(); // 명부에 자동 저장 후 ID 리턴받음
        if (newProfileId) {
            router.push(`/profiles/${newProfileId}`);
        } else {
            router.push("/result"); // 만약 에러로 id가 없다면 기존 폴백
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-24 relative bg-slate-50">
            <header className="flex items-center p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
                <Link href="/" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-2">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className="font-semibold text-slate-800 text-lg">사주 정보 입력</span>
            </header>

            <main className="flex-1 p-6 space-y-10 w-full relative">

                {/* 1. Name */}
                <section className="space-y-4">
                    <label className="block text-lg font-bold text-slate-900">이름</label>
                    <input
                        type="text"
                        placeholder="홍길동"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xl text-slate-900 border-b-2 border-slate-300 focus:border-purple-600 py-3 bg-transparent outline-none transition-colors placeholder:text-slate-400 font-medium"
                    />
                </section>

                {/* 2. Gender */}
                <section className="space-y-4">
                    <label className="block text-lg font-bold text-slate-900">성별</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setGender('male')}
                            className={`flex-1 py-4 rounded-xl border-2 transition-all font-semibold ${gender === 'male'
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            남자
                        </button>
                        <button
                            onClick={() => setGender('female')}
                            className={`flex-1 py-4 rounded-xl border-2 transition-all font-semibold ${gender === 'female'
                                ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            여자
                        </button>
                    </div>
                </section>

                {/* 3. Birthdate */}
                <section className="space-y-4">
                    <label className="block text-lg font-bold text-slate-900">생년월일</label>

                    <div className="flex bg-slate-200 p-1 rounded-xl mb-4 w-fit">
                        <button
                            onClick={() => setCalendarType('solar')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${calendarType === 'solar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            양력
                        </button>
                        <button
                            onClick={() => setCalendarType('lunar')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${calendarType === 'lunar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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
                            className="w-1/2 p-4 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-medium"
                        />
                        <input
                            type="number"
                            placeholder="MM"
                            value={birthMonth}
                            onChange={(e) => setBirthDate(birthYear, e.target.value.slice(0, 2), birthDay)}
                            className="w-1/4 p-4 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-medium"
                        />
                        <input
                            type="number"
                            placeholder="DD"
                            value={birthDay}
                            onChange={(e) => setBirthDate(birthYear, birthMonth, e.target.value.slice(0, 2))}
                            className="w-1/4 p-4 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-medium"
                        />
                    </div>
                </section>

                {/* 4. Birth Time & Location */}
                <section className="space-y-4 relative">
                    <div className="flex items-center justify-between">
                        <label className="block text-lg font-bold text-slate-900">태어난 시간과 지역</label>

                        {/* 플로팅 툴팁 버튼 영역 */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTimeTooltip(!showTimeTooltip)}
                                className="text-[13px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
                            >
                                <span className="text-sm">💡</span> 12지시 시간표
                            </button>

                            {/* 플로팅 툴팁 본문 */}
                            {showTimeTooltip && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 p-4 pt-3 origin-top-right animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-800 text-sm">🕰️ 12지시 시기표</span>
                                        <button onClick={() => setShowTimeTooltip(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-1">&times;</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar text-sm">
                                        {ZHI_TIME_RANGES.map((t, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-slate-600 border-b border-slate-50 pb-1">
                                                <span className="font-bold">{t.label}</span>
                                                <span className="text-xs font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.period}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 bg-purple-50 p-2.5 rounded-xl border border-purple-100/50">
                                        <p className="text-[11px] text-purple-700 font-semibold text-center break-keep leading-relaxed m-0">
                                            위 표를 참고하여 해당하는 범위를<br />아래 시/분 칸에 적어주세요.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* 지역 선택 */}
                        <div className="relative z-30">
                            <LocationSearch
                                disabled={isTimeUnknown}
                                value={birthCity === 'seoul' ? '서울 (대한민국)' : birthCity}
                                onSelect={(cityName, tz, lon) => {
                                    setBirthLocationTime(cityName, birthHour, birthMinute, isTimeUnknown, tz, lon);
                                }}
                            />
                        </div>

                        {/* 시 / 분 입력 막대 복구본 */}
                        <div className="flex gap-3">
                            <div className="relative w-1/2">
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    placeholder="시 (0~23)"
                                    disabled={isTimeUnknown}
                                    value={birthHour}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (parseInt(val) > 23) val = "23";
                                        if (parseInt(val) < 0) val = "0";
                                        setBirthLocationTime(birthCity, val, birthMinute, isTimeUnknown);
                                    }}
                                    className="w-full p-4 text-center rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-bold disabled:opacity-50 disabled:bg-slate-100"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">시</span>
                            </div>
                            <div className="relative w-1/2">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    placeholder="분 (0~59)"
                                    disabled={isTimeUnknown}
                                    value={birthMinute}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (parseInt(val) > 59) val = "59";
                                        if (parseInt(val) < 0) val = "0";
                                        setBirthLocationTime(birthCity, birthHour, val, isTimeUnknown);
                                    }}
                                    className="w-full p-4 text-center rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-bold disabled:opacity-50 disabled:bg-slate-100"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">분</span>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={isTimeUnknown}
                                onChange={(e) => {
                                    setBirthLocationTime(birthCity, '', '', e.target.checked);
                                }}
                                className="w-5 h-5 accent-purple-600 rounded"
                            />
                            <span className="text-slate-700 font-medium">태어난 시간을 모릅니다 (*시주 산출 불가)</span>
                        </label>
                    </div>
                </section>

            </main>

            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white/90 backdrop-blur pb-6 border-t border-slate-100">
                <button
                    onClick={handleNext}
                    className="w-full bg-slate-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98] hover:bg-slate-800"
                >
                    사주 풀이 보러가기
                    <ChevronRight className="w-5 h-5 opacity-80" />
                </button>
            </div>
        </div>
    );
}
