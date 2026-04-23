"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, Clock, Trash2, ChevronRight, Sparkles, Lock, CalendarHeart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Route } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function HistoryPage() {
    const { reunionHistory: history, removeReunionResult: removeResult, updateReunionResult } = useSajuStore();
    const router = useRouter();
    const [upgradingId, setUpgradingId] = useState<string | null>(null);

    // 페이지 진입 시 premiumJobId가 있지만 아직 lite인 레코드들의 상태를 자동 동기화
    useEffect(() => {
        const pendingRecords = history.filter(r => r.premiumJobId && r.tier !== 'premium');
        if (pendingRecords.length === 0) return;

        const syncAll = async () => {
            for (const record of pendingRecords) {
                try {
                    const res = await fetch(`/api/job-status?jobId=${record.premiumJobId}`);
                    const data = await res.json();
                    if (data.success && data.status === 'completed') {
                        updateReunionResult(record.id, 'premium', data.aiResult);
                    }
                } catch (err) {
                    // 네트워크 에러는 무시 (다음에 다시 시도)
                }
            }
        };

        syncAll();
    }, []);

    // Lite → Premium 업그레이드 API 호출
    const handleUpgrade = async (record: typeof history[0]) => {
        if (!record.myRawInput || !record.partnerRawInput) {
            toast.error("초기 버전의 데이터는 상세 정보가 부족하여 업그레이드할 수 없습니다. 새로 분석을 진행해주세요.");
            return;
        }

        setUpgradingId(record.id);

        try {
            const [goldenRes, premiumRes] = await Promise.all([
                fetch("/api/golden-window", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        myDayGan: record.resultData.myManseryeok?.day?.gan,
                        myDayZhi: record.resultData.myManseryeok?.day?.zhi,
                        partnerDayGan: record.resultData.partnerManseryeok?.day?.gan,
                        partnerDayZhi: record.resultData.partnerManseryeok?.day?.zhi,
                        myName: record.myInfo.name || "익명",
                        myGender: record.myInfo.gender,
                        partnerName: record.partnerInfo.name || "그 사람",
                        partnerGender: record.partnerInfo.gender,
                        months: 6
                    }),
                }),
                fetch("/api/reunion", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        my: record.myRawInput,
                        partner: record.partnerRawInput,
                        tier: 'premium',
                    }),
                })
            ]);

            const goldenData = await goldenRes.json();
            const premiumData = await premiumRes.json();

            if (goldenData.success && premiumData.success) {
                const updatedResult = {
                    ...record.resultData,
                    details: premiumData.data.details,
                    essenceAnalysis: premiumData.data.essenceAnalysis,
                    goldenWindows: goldenData.data
                };
                updateReunionResult(record.id, 'premium', updatedResult);
                toast.success("Premium으로 업그레이드 완료! 🔮");
            } else {
                toast.error("업그레이드 처리 중 오류가 발생했습니다.");
            }
        } catch (err) {
            console.error(err);
            toast.error("네트워크 오류가 발생했습니다.");
        } finally {
            setUpgradingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] pb-24">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-[#0a0e1a]/80 backdrop-blur-md z-10 border-b border-white/5">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full transition-colors mr-1">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-white text-lg">내 재회 리포트 목록</span>
                </div>
            </header>

            <main className="p-6">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-center">
                        <Clock className="w-16 h-16 text-slate-500 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">기록이 없어요</h2>
                        <p className="text-slate-400 mb-8">아직 분석한 내역이 없습니다.<br />지금 바로 재회 가능성을 확인해보세요!</p>
                        <Link href="/input">
                            <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]">
                                다시, 우리 시작하기
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((record) => {
                            const dateObj = new Date(record.createdAt);
                            const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
                            const isLite = record.tier !== 'premium';
                            const isCurrentlyUpgrading = upgradingId === record.id;

                            return (
                                <div key={record.id} className="glass-card p-5 flex flex-col relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{record.myInfo.name} ✕ {record.partnerInfo.name}</span>
                                                    <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">{dateStr}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
                                                    <span className={`px-2 py-0.5 rounded-md ${record.tier === 'premium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                                        {record.tier === 'premium' ? 'Premium' : 'Lite'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-amber-400 mt-2">{record.resultData.reunionKeyword}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('이 기록을 삭제하시겠습니까?')) removeResult(record.id);
                                            }}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed mb-4">
                                        {record.resultData.summary}
                                    </p>


                                    <Link href={`/history/${record.id}`} className="mt-auto block">
                                        <div className="w-full py-3 bg-white/5 rounded-xl flex items-center justify-center gap-1 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors border border-white/5">
                                            자세히 보기
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* ─── 업그레이드 전용 로딩 스크린 ─── */}
                <LoadingOverlay isVisible={upgradingId !== null} />
            </main>
        </div>
    );
}
