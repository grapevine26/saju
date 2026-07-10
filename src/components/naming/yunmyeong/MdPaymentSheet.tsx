'use client';

import { useState } from 'react';
import { MdPricing, mdWon } from '@/features/naming/yunmyeong';

// ─────────────────────────────────────────────
// 윤명 — 결제 바텀시트
// NAMING_PAYMENT_ENABLED=true일 때만 노출된다.
// '결제하기'는 기존 토스페이먼츠 플로우(onPay)로 연결한다.
// TODO(결제 재개 시): 카카오페이/토스페이 칩 → 토스 easyPay 파라미터 매핑
// ─────────────────────────────────────────────

interface Props {
    pricing: MdPricing;
    /** 실제 결제 요청 (토스 SDK 호출). resolve 전까지 busy 연출 유지 */
    onPay: (method: string) => Promise<void>;
    onClose: () => void;
}

export default function MdPaymentSheet({ pricing, onPay, onClose }: Props) {
    const [method, setMethod] = useState('kakao');
    const [busy, setBusy] = useState(false);

    const pay = async () => {
        setBusy(true);
        try {
            await onPay(method);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="md-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
            <div className="md-sheet">
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--md-line-strong)', margin: '0 auto 18px' }}></div>
                {busy ? (
                    <div style={{ textAlign: 'center', padding: '38px 0 46px' }} role="status">
                        <div className="md-serif md-breathe" style={{ fontSize: 34, marginBottom: 18 }}>印</div>
                        <p style={{ fontSize: 14.5, fontWeight: 600 }}>결제 승인 중<span className="md-dots"></span></p>
                        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--md-text-3)' }}>리포트를 봉인 해제하고 있습니다</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="md-serif" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>주문 확인</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--md-line)' }}>
                            <span style={{ fontSize: 13.5, color: 'var(--md-text-2)', lineHeight: 1.5, paddingRight: 16 }}>{pricing.headline}</span>
                            <strong className="md-serif" style={{ fontSize: 17, whiteSpace: 'nowrap' }}>{mdWon(pricing.price)}</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, margin: '16px 0 20px' }}>
                            {([['kakao', '카카오페이'], ['toss', '토스페이'], ['card', '신용카드']] as const).map(([v, label]) => (
                                <button key={v} className={'md-chip' + (method === v ? ' is-on' : '')} style={{ minHeight: 46, fontSize: 13 }} onClick={() => setMethod(v)}>{label}</button>
                            ))}
                        </div>
                        <button className="md-btn" onClick={pay}>{mdWon(pricing.price)} 결제하기</button>
                    </div>
                )}
            </div>
        </div>
    );
}
