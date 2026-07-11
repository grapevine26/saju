'use client';

import { useState } from 'react';
import { MdPricing, mdWon } from '@/features/naming/yunmyeong';

// ─────────────────────────────────────────────
// 윤명 — 결제 바텀시트
// NAMING_PAYMENT_ENABLED=true일 때만 노출된다.
// '결제하기'는 토스페이먼츠 결제창(onPay)으로 연결하며,
// 카카오페이·토스페이·카드 선택은 토스 결제창 안에서 이뤄진다.
// ─────────────────────────────────────────────

interface Props {
    pricing: MdPricing;
    /** 실제 결제 요청 (토스 SDK 호출). 완성 리포트 링크를 보낼 이메일을 함께 전달 */
    onPay: (email: string) => Promise<void>;
    onClose: () => void;
}

export default function MdPaymentSheet({ pricing, onPay, onClose }: Props) {
    const [busy, setBusy] = useState(false);
    const [email, setEmail] = useState('');
    const emailValid = /.+@.+\..+/.test(email.trim());

    const pay = async () => {
        if (!emailValid) return;
        setBusy(true);
        try {
            await onPay(email.trim());
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
                        <div style={{ margin: '16px 0 6px' }}>
                            <label style={{ fontSize: 12, color: 'var(--md-text-2)', display: 'block', marginBottom: 6 }}>결과 링크를 받을 이메일</label>
                            <input
                                type="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: 10,
                                    border: '1px solid var(--md-line-strong)', background: 'var(--md-bg-2, rgba(255,255,255,0.04))',
                                    color: 'var(--md-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--md-text-3)', lineHeight: 1.6, margin: '8px 0 16px' }}>
                            리포트가 완성되면 이 이메일로 결과 링크를 보내드립니다. 결제수단(카카오페이·토스페이·카드)은 다음 화면에서 선택하세요.
                        </p>
                        <button className="md-btn" onClick={pay} disabled={!emailValid} style={!emailValid ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                            {mdWon(pricing.price)} 결제하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
