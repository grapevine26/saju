"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get("message") || "결제를 취소했거나 오류가 발생했습니다.";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0e1a] text-white">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full mx-auto flex items-center justify-center text-4xl">
                    !
                </div>
                <h2 className="text-xl font-bold text-rose-400">결제 실패</h2>
                <p className="text-slate-400">{message}</p>
                <button 
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a]"></div>}>
            <FailContent />
        </Suspense>
    );
}
