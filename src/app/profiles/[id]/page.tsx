"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, Edit3, Sparkles, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { calculateBazi } from "@/utils/baziCalc";
import ManseryeokTable from "@/components/ManseryeokTable";
import OhhaengRadarChart from "@/components/OhhaengRadarChart";
import AvatarIcon from "@/components/AvatarIcon";
import { GAN_COLOR_DESC, ZHI_ANIMAL, cleanDuplicateLocation } from "@/utils/sajuMapper";

export default function ProfileDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profiles, removeProfile, loadProfileToInput } = useSajuStore();

    const [profile, setProfile] = useState<any>(null);
    const [baziData, setBaziData] = useState<any>(null);

    useEffect(() => {
        if (!params.id) return;

        const found = profiles.find(p => p.id === params.id);
        if (found) {
            setProfile(found);
            // 사주(만세력) 계산 (경도 시간 보정 적용)
            const data = calculateBazi(
                found.gender,
                found.calendarType,
                found.birthYear,
                found.birthMonth,
                found.birthDay,
                found.birthCity,
                found.birthHour,
                found.birthMinute,
                found.isTimeUnknown
            );
            setBaziData(data);
        } else {
            // 없는 프로필이면 목록으로 튕겨냄
            router.push('/profiles');
        }
    }, [params.id, profiles, router]);

    if (!profile || !baziData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">불러오는 중...</div>;

    const handleEdit = () => {
        loadProfileToInput(profile);
        router.push('/input');
    };

    const handleDelete = () => {
        if (confirm(`${profile.name}님의 정보를 정말 삭제하시겠습니까?`)) {
            removeProfile(profile.id);
            router.push('/profiles');
        }
    };

    const handleAnalyze = () => {
        // 이 사람의 정보를 스토어 인풋에 덮어씌우고 결과 페이지로 이동 (API 재요청)
        loadProfileToInput(profile);
        router.push('/result');
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-slate-50/80 backdrop-blur z-10 border-b border-slate-100">
                <div className="flex items-center">
                    <button onClick={() => router.push('/profiles')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors mr-2">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-slate-800 text-lg">명식 확인</span>
                </div>
            </header>

            <main className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                            <AvatarIcon gan={profile.dayGan} zhi={profile.dayZhi} size={64} className="shadow-sm" />
                            {profile.dayGan && profile.dayZhi && (
                                <span className="inline-block bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-200 text-center whitespace-nowrap">
                                    {profile.dayGan}{profile.dayZhi}일주<br />({GAN_COLOR_DESC[profile.dayGan]} {ZHI_ANIMAL[profile.dayZhi]})
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">{profile.name}</h1>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                    {profile.gender === 'male' ? '남자' : '여자'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-purple-400"></span>
                                    <span className="truncate">{profile.calendarType === 'solar' ? '양력' : '음력'} {profile.birthYear}.{profile.birthMonth}.{profile.birthDay}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-blue-400"></span>
                                    <span className="truncate">{profile.isTimeUnknown ? '시간 모름' : `${String(profile.birthHour || '').padStart(2, '0')}:${String(profile.birthMinute || '').padStart(2, '0')} 출생`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400"></span>
                                    <span className="truncate" title={profile.birthCity === 'seoul' ? '서울 (대한민국)' : cleanDuplicateLocation(profile.birthCity)}>
                                        {profile.birthCity === 'seoul' ? '서울 (대한민국)' : cleanDuplicateLocation(profile.birthCity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 수정 & 삭제 버튼 영역 */}
                    <div className="flex gap-1 bg-white shadow-sm border border-slate-200 rounded-xl p-1 w-full sm:w-auto shrink-0 self-start">
                        <button onClick={handleEdit} className="flex-1 sm:flex-none justify-center px-4 py-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold">
                            <Edit3 className="w-4 h-4" /> 수정
                        </button>
                        <div className="w-[1px] bg-slate-100 my-1"></div>
                        <button onClick={handleDelete} className="flex-1 sm:flex-none justify-center px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold">
                            <Trash2 className="w-4 h-4" /> 삭제
                        </button>
                    </div>
                </div>



                <h2 className="text-lg font-bold text-slate-800 mb-4 px-2 mt-8">나의 사주 팔자 (명식)</h2>
                {/* 만세력 원국 표 */}
                <ManseryeokTable
                    data={baziData.manseryeok}
                    userInfo={{
                        name: profile.name,
                        gender: profile.gender,
                        calendarType: profile.calendarType,
                        birthDate: `${profile.birthYear}년 ${profile.birthMonth}월 ${profile.birthDay}일`,
                        birthTime: profile.isTimeUnknown
                            ? "시간 모름"
                            : `${String(profile.birthHour || '').padStart(2, '0')}:${String(profile.birthMinute || '').padStart(2, '0')} ${profile.birthCity ? `(${profile.birthCity === 'seoul' ? '서울' : (cleanDuplicateLocation(profile.birthCity) || '').split(' (')[0]})` : ''}`
                    }}
                />

                <h2 className="text-lg font-bold text-slate-800 mb-4 px-2 mt-8">오행 분포</h2>
                <div className="mb-6">
                    <OhhaengRadarChart manseryeok={baziData.manseryeok as any} />
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white/90 backdrop-blur pb-6 border-t border-slate-100">
                <button
                    onClick={handleAnalyze}
                    className="w-full bg-slate-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98] hover:bg-slate-800"
                >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    정밀 사주 분석 보러가기
                </button>
            </div>
        </div>
    );
}
