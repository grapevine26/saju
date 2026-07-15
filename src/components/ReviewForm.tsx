'use client';

// ─────────────────────────────────────────────
// 결과 페이지 후기 폼 (재회사주 · 타로 공용)
// 별점(필수) + 한줄 후기(선택) + 마케팅 활용 동의(선택)
// 제출 즉시 20% 할인 코드 발급 — 재회사주·타로 어디서나 사용 가능
// ─────────────────────────────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Copy, Check, Ticket } from 'lucide-react';

interface Props {
    jobId: string;
    service: 'saju' | 'tarot';
}

/* 서비스별 톤 — 재회사주는 로즈/앰버, 타로는 라벤더 */
const THEMES = {
    saju: {
        cardBg: 'linear-gradient(150deg, rgba(216,72,94,0.08) 0%, rgba(10,9,12,0.9) 60%)',
        border: '1px solid rgba(240,106,126,0.25)',
        accent: '#F06A7E',
        accentSoft: 'rgba(216,72,94,0.12)',
        text1: 'rgba(255,255,255,0.92)',
        text2: 'rgba(255,255,255,0.65)',
        text3: 'rgba(255,255,255,0.42)',
        inputBg: 'rgba(255,255,255,0.05)',
        inputBorder: '1px solid rgba(255,255,255,0.12)',
        btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)',
        codeBg: 'rgba(216,72,94,0.10)',
    },
    tarot: {
        cardBg: 'linear-gradient(150deg, rgba(167,139,250,0.10) 0%, rgba(21,13,48,0.55) 60%)',
        border: '1px solid rgba(167,139,250,0.28)',
        accent: '#A78BFA',
        accentSoft: 'rgba(167,139,250,0.12)',
        text1: 'var(--tarot-text-1, rgba(255,255,255,0.92))',
        text2: 'var(--tarot-text-2, rgba(255,255,255,0.65))',
        text3: 'var(--tarot-text-3, rgba(255,255,255,0.42))',
        inputBg: 'rgba(21,13,48,0.45)',
        inputBorder: '1px solid rgba(167,139,250,0.22)',
        btnBg: 'linear-gradient(135deg, #8B5CF6 0%, #6B3FA8 100%)',
        codeBg: 'rgba(167,139,250,0.10)',
    },
} as const;

const RATING_LABELS = ['', '아쉬워요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'];

export default function ReviewForm({ jobId, service }: Props) {
    const t = THEMES[service];
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [issued, setIssued] = useState<{ code: string | null; percent: number; expiresAt: string | null } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async () => {
        if (!rating || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, service, rating, comment, marketingConsent: consent }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || '제출에 실패했습니다.');
            setIssued({ code: data.code, percent: data.percent, expiresAt: data.expiresAt });
        } catch (e: any) {
            setError(e.message || '잠시 후 다시 시도해 주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!issued?.code) return;
        try {
            await navigator.clipboard.writeText(issued.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* 클립보드 미지원 환경 — 코드가 화면에 보이므로 무시 */ }
    };

    const expiryText = issued?.expiresAt
        ? new Date(issued.expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
                marginTop: 28, borderRadius: 18, padding: '24px 22px',
                background: t.cardBg, border: t.border, position: 'relative', overflow: 'hidden',
            }}
        >
            {issued ? (
                    /* ── 제출 완료: 할인 코드 표시 ── */
                    <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                        <Ticket size={28} style={{ color: t.accent, margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 15.5, fontWeight: 700, color: t.text1, marginBottom: 6 }}>
                            소중한 후기 감사합니다 💌
                        </p>
                        {issued.code ? (
                            <>
                                <p style={{ fontSize: 12.5, color: t.text2, lineHeight: 1.7, marginBottom: 16 }}>
                                    감사의 마음을 담아 <strong style={{ color: t.accent }}>{issued.percent}% 할인 코드</strong>를 드려요.<br />
                                    재회사주·타로 어디서나 다음 결제에 쓸 수 있어요.
                                </p>
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                                        background: t.codeBg, border: t.border,
                                        fontFamily: 'monospace', fontSize: 17, fontWeight: 700,
                                        letterSpacing: '0.06em', color: t.text1,
                                    }}
                                >
                                    {issued.code}
                                    {copied ? <Check size={15} style={{ color: t.accent }} /> : <Copy size={15} style={{ color: t.text3 }} />}
                                </button>
                                <p style={{ fontSize: 11, color: t.text3, marginTop: 10 }}>
                                    {copied ? '복사되었어요!' : '탭하면 복사돼요'}{expiryText ? ` · ${expiryText}까지 사용 가능` : ''}
                                </p>
                            </>
                        ) : (
                            <p style={{ fontSize: 12.5, color: t.text2, lineHeight: 1.7 }}>
                                이미 후기를 남겨주셨어요. 발급된 코드는 사용되었거나 만료되었습니다.
                            </p>
                        )}
                    </motion.div>
                ) : (
                    /* ── 후기 입력 폼 ── */
                    <div key="form">
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: t.accent, marginBottom: 8 }}>
                            REVIEW · 30초면 충분해요
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: t.text1, lineHeight: 1.5, marginBottom: 4 }}>
                            이번 결과, 어떠셨어요?
                        </p>
                        <p style={{ fontSize: 12, color: t.text2, lineHeight: 1.6, marginBottom: 16 }}>
                            별점만 남겨도 <strong style={{ color: t.accent }}>20% 할인 코드</strong>를 바로 드려요.
                        </p>

                        {/* 별점 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                            {[1, 2, 3, 4, 5].map((n) => {
                                const active = n <= (hoverRating || rating);
                                return (
                                    <button
                                        key={n}
                                        onClick={() => setRating(n)}
                                        onMouseEnter={() => setHoverRating(n)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', lineHeight: 0 }}
                                        aria-label={`${n}점`}
                                    >
                                        <Star
                                            size={28}
                                            fill={active ? t.accent : 'transparent'}
                                            style={{ color: active ? t.accent : t.text3, transition: 'color .15s, fill .15s' }}
                                        />
                                    </button>
                                );
                            })}
                            {rating > 0 && (
                                <span style={{ fontSize: 12.5, color: t.text2, marginLeft: 6 }}>{RATING_LABELS[rating]}</span>
                            )}
                        </div>

                        {/* 한줄 후기 */}
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="어떤 부분이 와닿았나요? (선택)"
                            maxLength={500}
                            rows={2}
                            style={{
                                width: '100%', resize: 'none', borderRadius: 12, padding: '12px 14px',
                                background: t.inputBg, border: t.inputBorder, color: t.text1,
                                fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none',
                                marginBottom: 12,
                            }}
                        />

                        {/* 마케팅 활용 동의 */}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                style={{ marginTop: 2, accentColor: t.accent }}
                            />
                            <span style={{ fontSize: 11.5, color: t.text3, lineHeight: 1.6 }}>
                                이 후기를 서비스 소개(홈페이지·SNS)에 익명으로 소개해도 좋아요 (선택)
                            </span>
                        </label>

                        {error && (
                            <p style={{ fontSize: 12, color: '#F06A7E', marginBottom: 10 }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!rating || submitting}
                            style={{
                                display: 'block', width: '100%', padding: '14px 20px', borderRadius: 13,
                                border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                                cursor: rating && !submitting ? 'pointer' : 'default',
                                background: rating ? t.btnBg : t.inputBg,
                                color: rating ? '#FFF' : t.text3,
                                opacity: submitting ? 0.7 : 1, transition: 'opacity .2s',
                            }}
                        >
                            {submitting ? '제출 중...' : rating ? '후기 남기고 20% 코드 받기' : '별점을 눌러 주세요'}
                        </button>
                    </div>
                )}
        </motion.div>
    );
}
