"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, Clock, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const { history, removeResult } = useSajuStore();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-slate-50/80 backdrop-blur z-10 border-b border-slate-100">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors mr-1">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-slate-800 text-lg">내 사주 기록</span>
                </div>
            </header>

            <main className="p-6">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-center">
                        <Clock className="w-16 h-16 text-slate-300 mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">기록이 없어요</h2>
                        <p className="text-slate-500 mb-8">아직 사주팝에서 확인한 내역이 없습니다.<br />지금 바로 운세를 확인해보세요!</p>
                        <Link href="/input">
                            <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg">
                                사주팝 시작하기
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((record) => {
                            const dateObj = new Date(record.createdAt);
                            const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

                            return (
                                <div key={record.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">{record.userInfo.name}</span>
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{dateStr}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                    <span>{record.userInfo.gender === 'male' ? '남자' : '여자'}</span>
                                                    <span className="w-0.5 h-2.5 bg-slate-300"></span>
                                                    <span>{record.userInfo.calendarType === 'solar' ? '양력' : '음력'} {record.userInfo.birthDate}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-pink-500">{record.resultData.keyword}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('이 기록을 삭제하시겠습니까?')) removeResult(record.id);
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
                                        {record.resultData.summary}
                                    </p>

                                    <Link href={`/history/${record.id}`} className="mt-auto block">
                                        <div className="w-full py-3 bg-slate-50 rounded-xl flex items-center justify-center gap-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                                            자세히 보기
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
