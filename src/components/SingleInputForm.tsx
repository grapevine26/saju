"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SingleInputForm() {
    const router = useRouter();

    // Store values
    const {
        name, setName,
        gender, setGender,
        calendarType, setCalendarType,
        birthYear, birthMonth, birthDay, setBirthDate,
        birthTime, isTimeUnknown, setBirthTime,
        saveProfile
    } = useSajuStore();

    const validateForm = (): string | null => {
        if (name.trim().length < 1) return "이름을 한 글자 이상 입력해주세요.";
        if (!gender) return "성별을 선택해주세요.";
        if (!birthYear || !birthMonth || !birthDay) return "생년월일을 모두 입력해주세요.";
        if (!isTimeUnknown && !birthTime) return "태어난 시간을 선택하거나 '시간 모름'에 체크해주세요.";
        return null;
    };

    const handleNext = () => {
        const errorMessage = validateForm();
        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        saveProfile(); // 명부에 자동 저장
        router.push("/result");
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

                {/* 4. Birth Time */}
                <section className="space-y-4">
                    <label className="block text-lg font-bold text-slate-900">태어난 시간</label>
                    <div className="space-y-4">
                        <div className="relative">
                            <select
                                disabled={isTimeUnknown}
                                value={birthTime}
                                onChange={(e) => setBirthTime(e.target.value, false)}
                                className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-lg appearance-none text-slate-900 font-medium disabled:opacity-50 disabled:bg-slate-100 pr-12"
                            >
                                <option value="" disabled className="text-slate-400">시간 선택 (예: 자시 23:30~01:29)</option>
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
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                <ChevronDown className="w-6 h-6" />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
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
