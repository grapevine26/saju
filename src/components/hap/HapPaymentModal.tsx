"use client";

/**
 * 운명의 합 — 결제 1단계 모달 (이메일·할인코드 수집).
 * 재회사주 PaymentModal과 동일한 역할 — 여기서 이메일을 받은 뒤
 * 로그인 여부에 따라 UpgradeModal(로그인/비회원)로 이어진다.
 */
import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

const C = {
    bg: '#0A090C',
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    cardBorder: 'rgba(240,234,235,0.13)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
    btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif",
};

interface Props {
    price: number;
    onClose: () => void;
    onNext: (email: string, discount: { code: string; percent: number } | null) => void;
}

export default function HapPaymentModal({ price, onClose, onNext }: Props) {
    const [email, setEmail] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
    const [codeChecking, setCodeChecking] = useState(false);
    const [codeError, setCodeError] = useState('');

    const finalPrice = discount ? Math.round(price * (100 - discount.percent) / 100) : price;

    const handleApplyCode = async () => {
        const code = codeInput.trim();
        if (!code) return;
        setCodeChecking(true); setCodeError('');
        try {
            const res = await fetch('/api/discount/validate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (data.valid) setDiscount({ code, percent: data.percent });
            else setCodeError(data.error || '유효하지 않은 코드입니다.');
        } catch {
            setCodeError('확인에 실패했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setCodeChecking(false);
        }
    };

    const handleSubmit = () => {
        if (!email.includes('@')) return;
        onNext(email, discount);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
            <motion.div
                initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{ background: C.bg, width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', border: `1px solid ${C.cardBorder}`, borderBottom: 'none', padding: '24px 20px calc(24px + env(safe-area-inset-bottom))', position: 'relative' }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: C.sub, cursor: 'pointer', display: 'flex', padding: 4 }}>
                    <X size={20} />
                </button>

                <h3 style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>4파트 전체 리포트</h3>
                <p style={{ fontSize: 12.5, color: C.sub, margin: '0 0 20px' }}>결과를 언제든 다시 볼 수 있는 링크를 이메일로 보내드려요</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, padding: '14px 16px', background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 13 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>결제 금액</span>
                    <span>
                        {discount && <span style={{ fontSize: 12.5, color: C.muted, textDecoration: 'line-through', marginRight: 8 }}>{price.toLocaleString()}원</span>}
                        <span style={{ fontFamily: C.serif, fontSize: 20, fontWeight: 700, color: C.accentBright }}>{finalPrice.toLocaleString()}원</span>
                    </span>
                </div>

                <input
                    type="email" placeholder="이메일 주소" value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(240,234,235,0.05)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: '13px 14px', color: C.ink, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }}
                />

                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <input
                        type="text" placeholder="할인 코드 (선택)" value={codeInput}
                        disabled={!!discount}
                        onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); if (discount) setDiscount(null); }}
                        style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', background: 'rgba(240,234,235,0.05)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: '13px 14px', color: C.ink, fontSize: 14, fontFamily: 'inherit', outline: 'none', opacity: discount ? 0.6 : 1 }}
                    />
                    <button
                        onClick={discount ? () => { setDiscount(null); setCodeInput(''); } : handleApplyCode}
                        disabled={!discount && (!codeInput.trim() || codeChecking)}
                        style={{ padding: '0 18px', borderRadius: 12, border: `1px solid ${C.accentBorder}`, background: discount ? 'transparent' : C.accentSoft, color: C.accentBright, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        {discount ? '해제' : '적용'}
                    </button>
                </div>
                {codeError && <p style={{ fontSize: 11.5, color: '#f87171', margin: '4px 0 0' }}>{codeError}</p>}
                {discount && <p style={{ fontSize: 11.5, color: C.accentBright, margin: '4px 0 0' }}>✓ {discount.percent}% 할인이 적용되었어요</p>}

                <button
                    onClick={handleSubmit} disabled={!email.includes('@')}
                    style={{ width: '100%', marginTop: 16, background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '16px 0', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 30px rgba(140,106,50,0.28)', opacity: email.includes('@') ? 1 : 0.5 }}
                >
                    다음
                </button>
            </motion.div>
        </div>
    );
}
