'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAMING_PENDING_KEY } from '@/features/naming/constants';
import { saveNamingHistory } from '@/features/naming/history';
import { getUtm, getVisitorId } from '@/utils/utm';

// ─────────────────────────────────────────────
// 작명 결제 성공 → 승인 → 리포트 생성 대기 페이지
// 승인 직후 Inngest가 백그라운드에서 리포트를 생성하므로
// job-status를 폴링하다가 완료되면 결과 페이지로 이동한다.
// ─────────────────────────────────────────────

const WAITING_MESSAGES = [
    '결제가 확인되었습니다. 이름 후보를 최종 선별하고 있어요...',
    '수리 사격 길흉을 교차 검증하는 중...',
    '인명용 한자 풀이와 AI 해설을 작성하는 중...',
    '리포트 레이아웃을 정돈하는 중... 거의 다 됐어요!',
];

function NamingPaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('결제를 확인하고 있습니다...');
    const [error, setError] = useState<string | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');

        if (!paymentKey || !orderId || !amount) {
            setError('결제 정보가 올바르지 않습니다.');
            return;
        }

        let pending: { namingInput: any; customerEmail: string; orderId: string } | null = null;
        try {
            const raw = sessionStorage.getItem(NAMING_PENDING_KEY);
            if (raw) pending = JSON.parse(raw);
        } catch { /* 아래에서 처리 */ }

        if (!pending || pending.orderId !== orderId) {
            setError('결제 세션 정보를 찾을 수 없습니다. 결제가 완료되었다면 이메일로 리포트 링크가 발송되니 잠시만 기다려 주세요.');
            return;
        }

        const run = async () => {
            try {
                // 1. 결제 승인 + 작업 생성
                const confirmRes = await fetch('/api/naming/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount: Number(amount),
                        payload: {
                            customerEmail: pending!.customerEmail,
                            namingInput: pending!.namingInput,
                            // 유입 추적 (없으면 null — 결제 처리와 무관)
                            utm: getUtm(), visitorId: getVisitorId(),
                        },
                    }),
                });
                const confirmJson = await confirmRes.json();

                if (!confirmJson.success || !confirmJson.jobId) {
                    throw new Error(confirmJson.message || '결제 승인에 실패했습니다.');
                }

                sessionStorage.removeItem(NAMING_PENDING_KEY);
                const jobId = confirmJson.jobId;

                // 결제 승인 직후 히스토리에 즉시 저장 — 생성 대기 중 탭을 닫거나 새로고침해도
                // jobId 접근 경로를 잃지 않도록 보장 (완료 폴링까지 기다리지 않음)
                if (pending?.namingInput) {
                    saveNamingHistory({
                        jobId,
                        serviceType: pending.namingInput.serviceType,
                        surname: pending.namingInput.surname,
                        currentName: pending.namingInput.currentName,
                        createdAt: Date.now(),
                    });
                }

                // 2. 리포트 생성 폴링 (3초 간격, 최대 5분)
                let messageIdx = 0;
                const messageTimer = setInterval(() => {
                    messageIdx = (messageIdx + 1) % WAITING_MESSAGES.length;
                    setMessage(WAITING_MESSAGES[messageIdx]);
                }, 4000);
                setMessage(WAITING_MESSAGES[0]);

                const deadline = Date.now() + 5 * 60 * 1000;
                const poll = async (): Promise<void> => {
                    if (Date.now() > deadline) {
                        clearInterval(messageTimer);
                        setError('리포트 생성이 평소보다 오래 걸리고 있어요. 완성되면 입력하신 이메일로 링크를 보내드립니다.');
                        return;
                    }
                    try {
                        const statusRes = await fetch(`/api/job-status?jobId=${jobId}`);
                        const statusJson = await statusRes.json();

                        if (statusJson.status === 'completed') {
                            clearInterval(messageTimer);
                            if (pending?.namingInput) {
                                saveNamingHistory({
                                    jobId,
                                    serviceType: pending.namingInput.serviceType,
                                    surname: pending.namingInput.surname,
                                    currentName: pending.namingInput.currentName,
                                    createdAt: Date.now(),
                                });
                            }
                            router.replace(`/yunmyeong/result/${jobId}`);
                            return;
                        }
                        if (statusJson.status === 'failed') {
                            clearInterval(messageTimer);
                            setError('리포트 생성에 실패하여 결제 금액이 자동 환불되었습니다. 잠시 후 다시 시도해 주세요.');
                            return;
                        }
                    } catch (e) {
                        console.error('상태 조회 실패(재시도 예정):', e);
                    }
                    setTimeout(poll, 3000);
                };
                poll();

            } catch (e: any) {
                console.error('결제 승인 처리 실패:', e);
                setError(e.message || '결제 처리 중 오류가 발생했습니다.');
            }
        };

        run();
    }, [searchParams, router]);

    return (
        <main className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
                {error ? (
                    <>
                        <span className="text-4xl">😥</span>
                        <h1 className="font-serif text-lg font-bold mt-4 mb-3">안내드립니다</h1>
                        <p className="text-sm text-slate-400 leading-relaxed mb-8">{error}</p>
                        <button
                            onClick={() => router.push('/yunmyeong')}
                            className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-300"
                        >
                            처음으로 돌아가기
                        </button>
                    </>
                ) : (
                    <>
                        <motion.div
                            className="mx-auto w-14 h-14 rounded-full border-2 border-amber-400/30 border-t-amber-400"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                        <h1 className="font-serif text-lg font-bold mt-8 mb-3">
                            프리미엄 작명 리포트를
                            <br />정성껏 짓고 있습니다
                        </h1>
                        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
                        <p className="mt-8 text-[11px] text-slate-600">
                            이 화면을 닫아도 완성되면 이메일로 링크가 발송됩니다.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}

export default function NamingPaymentSuccessPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-[#0a0e1a]" />}>
            <NamingPaymentSuccessContent />
        </Suspense>
    );
}
