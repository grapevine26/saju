"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, UserPlus, Trash2, Calendar, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilesPage() {
    const { profiles, removeProfile, loadProfileToInput, resetInput } = useSajuStore();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 특정 프로필 선택 시
    const handleProfileSelect = (profile: any) => {
        loadProfileToInput(profile);
        router.push('/input');
    };

    const handleAddNew = () => {
        resetInput();
        router.push('/input');
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-slate-50/80 backdrop-blur z-10 border-b border-slate-100">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors mr-1">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-slate-800 text-lg">사람들 목록</span>
                </div>
            </header>

            <main className="p-6">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">내 주소록</h1>
                        <p className="text-slate-500 text-sm mt-1">저장된 생년월일시 정보 모음</p>
                    </div>
                </div>

                {profiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-center">
                        <UserRound className="w-16 h-16 text-slate-300 mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">저장된 사람이 없어요</h2>
                        <p className="text-slate-500 mb-8 max-w-[240px]">이름과 생년월일을 한 번 입력하면 여기에 자동으로 저장됩니다.</p>
                        <button onClick={handleAddNew} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                            <UserPlus className="w-5 h-5" />
                            새로운 사람 추가
                        </button>
                    </div>
                ) : (
                    <>
                        <button onClick={handleAddNew} className="w-full mb-6 p-4 rounded-2xl border-2 border-dashed border-purple-200 text-purple-600 bg-purple-50/50 hover:bg-purple-50 flex items-center justify-center gap-2 font-bold transition-colors">
                            <UserPlus className="w-5 h-5" />
                            새로운 분이신가요?
                        </button>

                        <div className="space-y-3">
                            {profiles.map((profile) => (
                                <div key={profile.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProfileSelect(profile)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                                            {profile.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{profile.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <span>{profile.gender === 'male' ? '남자' : '여자'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{profile.calendarType === 'solar' ? '양력' : '음력'} {profile.birthYear}.{profile.birthMonth}.{profile.birthDay}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between h-full gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`${profile.name}님의 정보를 삭제하시겠습니까?`)) {
                                                    removeProfile(profile.id);
                                                }
                                            }}
                                            className="p-2 -mr-2 text-slate-300 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(profile.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
