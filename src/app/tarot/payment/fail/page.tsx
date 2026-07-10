"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function TarotPaymentFailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get("message") || "결제가 취소되었거나 오류가 발생했습니다.";

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20,
        }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 320 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--tarot-text-1)', marginBottom: 8 }}>
                    결제가 완료되지 않았습니다
                </p>
                <p style={{ fontSize: 13, color: 'var(--tarot-text-3)', marginBottom: 24, lineHeight: 1.7 }}>
                    {message}
                </p>
                <button
                    onClick={() => router.back()}
                    style={{
                        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                        background: 'var(--tarot-btn-bg)', color: '#fff',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: 'var(--tarot-btn-shadow)',
                    }}>
                    다시 시도하기
                </button>
            </motion.div>
        </div>
    );
}

export default function TarotPaymentFailPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--tarot-bg)' }} />}>
            <TarotPaymentFailContent />
        </Suspense>
    );
}
