"use client";

/**
 * 운명의 합 — 무료 미리보기 + 결제
 * AI 호출 없이 결정론 계산(끌림·갈등·보완, 합충)만 무료로 보여주고,
 * 4파트 AI 리포트는 결제 후 생성한다 (미리보기 원가 0원).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useSajuStore } from "@/store/useSajuStore";
import CompatibilityChart from "@/components/CompatibilityChart";
import { checkFreePass, makeFreePassKey } from "@/utils/freePassClient";
import { trackFunnelEvent } from "@/utils/utm";

// 운명의 합 — '인장과 금박' 팔레트 (다시,우리·오드타로와 겹치지 않는 색군)
const C = {
    bg: '#0A090C',
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE',
    her: '#D9B872',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
    btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif",
    r: 16,
};

const HAP_PRICE = 19900;

const LOCKED_PARTS = [
    { num: 'PART 1', title: '첫 만남의 설계도', items: '궁합 총점 6항목 · 서로 끌리는 이유 · 사랑의 온도 차이 · 전생 인연' },
    { num: 'PART 2', title: '연애의 실전', items: '싸움 원인 3가지 · 권태기 · 이별 위험 신호 · 스킨십 리듬' },
    { num: 'PART 3', title: '함께 만드는 생활', items: '재물운 구조 · 사업 궁합 · 자녀운 · 노년의 풍경' },
    { num: 'FINAL', title: '최종 판정', items: '결혼 적기 · 피해야 할 행동 · 궁합 등급표 · 역술가 최종 총평' },
];

export default function HapPreviewPage() {
    const router = useRouter();
    const store = useSajuStore();
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
    const [codeChecking, setCodeChecking] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [paying, setPaying] = useState(false);
    const started = useRef(false);

    const payPrice = discount ? Math.round(HAP_PRICE * (100 - discount.percent) / 100) : HAP_PRICE;

    const buildPerson = (isPartner: boolean) => {
        const s = store as any;
        const p = (k: string) => s[isPartner ? `partner${k.charAt(0).toUpperCase()}${k.slice(1)}` : k];
        return {
            name: p('name'), gender: p('gender'), calendarType: p('calendarType'),
            birthYear: p('birthYear'), birthMonth: p('birthMonth'), birthDay: p('birthDay'),
            birthCity: p('birthCity'), birthHour: p('birthHour'), birthMinute: p('birthMinute'),
            isTimeUnknown: isPartner ? s.partnerIsTimeUnknown : s.isTimeUnknown,
            birthTimezone: p('birthTimezone'), birthLongitude: p('birthLongitude'),
        };
    };

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (!store.birthYear || !store.partnerBirthYear) {
            router.replace('/hap/input');
            return;
        }
        trackFunnelEvent('free', 'hap');

        (async () => {
            try {
                const res = await fetch('/api/hap/preview', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ my: buildPerson(false), partner: buildPerson(true) }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setPreview(data.data);
            } catch {
                toast.error('계산에 실패했어요. 입력 정보를 확인해 주세요.');
                router.replace('/hap/input');
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handlePay = async () => {
        if (!email.includes('@')) { toast.error('결과 링크를 받을 이메일을 입력해 주세요.'); return; }
        if (paying) return;
        setPaying(true);
        try {
            const orderId = `hap${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
            localStorage.setItem('pendingHapPayment', JSON.stringify({
                orderId, amount: payPrice, customerEmail: email,
                discountCode: discount?.code || null,
                myRawInput: buildPerson(false), partnerRawInput: buildPerson(true),
                relationshipStatus: store.relationshipStatus || undefined,
            }));

            const goSuccess = (paymentKey: string) => {
                window.location.href = `/hap/payment/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${payPrice}`;
            };

            if (process.env.NODE_ENV === 'development') { goSuccess(`dev_payment_key_${Date.now()}`); return; }
            if (await checkFreePass()) { goSuccess(makeFreePassKey()); return; }
            // 100% 할인 쿠폰 — 결제할 금액이 없으므로 토스 없이 성공 플로우로 직행
            if (discount && payPrice === 0) { goSuccess(`coupon_free_${Date.now()}`); return; }

            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!clientKey) { toast.error('결제 설정 오류입니다. 잠시 후 다시 시도해 주세요.'); setPaying(false); return; }
            const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);
            const payment = tossPayments.payment({ customerKey: ANONYMOUS });
            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: payPrice },
                orderId,
                orderName: '운명의 합 궁합 리포트',
                customerName: store.name || '익명',
                customerEmail: email,
                successUrl: `${window.location.origin}/hap/payment/success`,
                failUrl: `${window.location.origin}/hap?payfail=1`,
            });
        } catch (err) {
            console.error(err);
            setPaying(false);
        }
    };

    if (loading || !preview) {
        return (
            <div style={{ background: C.bg, minHeight: '100dvh', color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Pretendard, sans-serif' }}>
                <p style={{ color: C.sub, fontSize: 14 }}>두 분의 사주를 맞춰보는 중…</p>
            </div>
        );
    }

    const comp = preview.compatibility;

    return (
        <div style={{ background: C.bg, minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', paddingBottom: 60 }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

                {/* 헤더 */}
                <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                    <button onClick={() => router.push('/hap/input')} style={{ background: 'none', border: 'none', padding: 4, color: C.sub, cursor: 'pointer', display: 'flex' }}>
                        <ArrowLeft size={22} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>무료 궁합 미리보기</span>
                </header>

                {/* 인장 히어로 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '22px 0 26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, border: `2.5px solid ${C.him}`, color: C.him, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 23, fontWeight: 900, transform: 'rotate(-4deg)', margin: '0 auto 8px' }}>{preview.mySeal}</div>
                            <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{store.name || '나'}</p>
                        </div>
                        <span style={{ fontSize: 15, color: C.sub, marginBottom: 22 }}>✕</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, border: `2.5px solid ${C.her}`, color: C.her, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 23, fontWeight: 900, transform: 'rotate(4deg)', margin: '0 auto 8px' }}>{preview.partnerSeal}</div>
                            <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{store.partnerName || '그 사람'}</p>
                        </div>
                    </div>
                    <h1 style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 700, margin: 0 }}>{store.name || '나'} ✕ {store.partnerName || '그 사람'}</h1>
                    <p style={{ fontSize: 12.5, color: C.muted, marginTop: 8 }}>타고난 두 기운이 만나면 이런 관계가 됩니다</p>
                </motion.div>

                {/* 무료: 결정론 궁합 차트 — 공용 컴포넌트가 읽는 --accent-* 변수를
                    이 블록 안에서만 금박 톤으로 덮어써서, 전역 로즈 테마(다른 페이지)는
                    그대로 두고 이 화면만 운명의 합 색으로 보이게 한다 */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{
                        ['--accent-gold' as any]: '#D9B872',
                        ['--accent-soft' as any]: 'rgba(201,161,92,0.10)',
                        ['--accent-border' as any]: 'rgba(201,161,92,0.32)',
                    }}
                >
                    <CompatibilityChart
                        attractionScore={comp.attractionScore}
                        conflictScore={comp.conflictScore}
                        complementScore={comp.complementScore}
                        hapList={comp.hapList}
                        chungList={comp.chungList}
                        hyeongList={comp.hyeongList}
                        haeList={comp.haeList}
                        dayMasterRelation={comp.dayMasterRelation}
                        spouseHouseRelation={comp.spouseHouseRelation}
                    />
                </motion.div>

                {/* 잠긴 4파트 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 30 }}>
                    <h2 style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>PREMIUM 궁합 리포트</h2>
                    <p style={{ fontSize: 12.5, color: C.sub, marginBottom: 14, lineHeight: 1.7 }}>
                        위 수치가 <strong style={{ color: C.accentBright }}>왜</strong> 나왔는지, 그래서 두 사람이 실제 연애·결혼·생활에서 어떤 장면을 만나는지 — 4개 파트로 전부 풀어드립니다.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {LOCKED_PARTS.map((p) => (
                            <div key={p.num} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                <Lock size={16} style={{ color: C.muted, flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: C.accentBright, margin: '0 0 3px' }}>{p.num} · {p.title}</p>
                                    <p style={{ fontSize: 11.5, color: C.muted, margin: 0, lineHeight: 1.6 }}>{p.items}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 결제 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ marginTop: 26, background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: 20 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>4파트 전체 리포트</span>
                        <span>
                            {discount && <span style={{ fontSize: 13, color: C.muted, textDecoration: 'line-through', marginRight: 8 }}>{HAP_PRICE.toLocaleString()}원</span>}
                            <span style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 700, color: C.accentBright }}>{payPrice.toLocaleString()}원</span>
                        </span>
                    </div>

                    <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>결과를 언제든 다시 볼 수 있는 링크를 이메일로 보내드려요</p>
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
                        onClick={handlePay} disabled={paying}
                        style={{ width: '100%', marginTop: 14, background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '16px 0', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 30px rgba(140,106,50,0.28)', opacity: paying ? 0.6 : 1 }}
                    >
                        {paying ? '결제 준비 중…' : payPrice === 0 ? '무료로 리포트 받기' : '전체 리포트 보기'}
                    </button>
                    <p style={{ fontSize: 10.5, color: C.muted, textAlign: 'center', marginTop: 9, marginBottom: 0 }}>결제 즉시 분석이 시작되고, 완성까지 약 1~2분 걸려요</p>
                </motion.div>
            </div>
        </div>
    );
}
