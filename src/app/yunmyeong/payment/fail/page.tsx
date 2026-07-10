'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─────────────────────────────────────────────
// 작명 결제 실패 페이지
// ─────────────────────────────────────────────

function NamingPaymentFailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get('message') || '결제가 완료되지 않았습니다.';

    return (
        <main className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
                <span className="text-4xl">💳</span>
                <h1 className="font-serif text-lg font-bold mt-4 mb-3">결제가 취소되었습니다</h1>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">{message}</p>
                <button
                    onClick={() => router.back()}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-sm font-bold text-[#0a0e1a] mb-3"
                >
                    진단 결과로 돌아가기
                </button>
                <button
                    onClick={() => router.push('/yunmyeong')}
                    className="w-full rounded-xl border border-white/15 py-3.5 text-sm font-semibold text-slate-300"
                >
                    처음으로
                </button>
            </div>
        </main>
    );
}

export default function NamingPaymentFailPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-[#0a0e1a]" />}>
            <NamingPaymentFailContent />
        </Suspense>
    );
}
