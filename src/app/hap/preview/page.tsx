"use client";

/**
 * 운명의 합 — 무료 미리보기 + 결제
 * AI 호출 없이 결정론 계산(끌림·갈등·보완, 합충)만 무료로 보여주고,
 * 4파트 AI 리포트는 결제 후 생성한다 (미리보기 원가 0원).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Share2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useSajuStore } from "@/store/useSajuStore";
import CompatibilityChart from "@/components/CompatibilityChart";
import OhhaengCompareChart from "@/components/hap/OhhaengCompareChart";
import UpgradeModal from "@/components/UpgradeModal";
import HapPaymentModal from "@/components/hap/HapPaymentModal";
import { checkFreePass, makeFreePassKey } from "@/utils/freePassClient";
import { trackFunnelEvent } from "@/utils/utm";
import { upsertFreeHapHistory, getHapHistoryEntry } from "@/features/hap/history";

// 두 분의 사주를 맞춰보는 동안 순서대로 보여줄 문구 — AI가 빨리 응답해도
// 최소 이 정도는 "분석 중"처럼 느껴지게 붙잡아 둔다 (MIN_LOADING_MS와 짝).
const LOADING_STEPS = [
    '두 분의 만세력을 계산하고 있어요',
    '타고난 기운의 합을 맞춰보고 있어요',
    '역술가가 첫인상을 정리하고 있어요',
    '궁합 리포트를 준비하고 있어요',
];
const MIN_LOADING_MS = 10000;

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

const SCORE_LABELS: { key: string; label: string }[] = [
    { key: 'romance', label: '연애궁합' },
    { key: 'marriage', label: '결혼궁합' },
    { key: 'wealth', label: '재물궁합' },
    { key: 'personality', label: '성격궁합' },
    { key: 'family', label: '가정궁합' },
    { key: 'communication', label: '소통궁합' },
];

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
    const [aiPreview, setAiPreview] = useState<{ coreLine: string | null; essence: string } | null>(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
    const [paying, setPaying] = useState(false);
    const [minDelayDone, setMinDelayDone] = useState(false);
    const [loadingStepIdx, setLoadingStepIdx] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const started = useRef(false);
    const hasResumedPayment = useRef(false);
    // 무료 미리보기도 보관함에 즉시 기록 — 결제하면 같은 항목이 premium으로 승격된다
    const freeRecordId = useRef(`free_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

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

                // 보관함에 즉시 기록 (Free) — 서버 잡이 없으니 다시 볼 수 있게 전부 인라인으로 담는다
                upsertFreeHapHistory(freeRecordId.current, {
                    myName: store.name || '', partnerName: store.partnerName || '',
                    totalScore: data.data.hapScores?.total ?? null, totalGrade: data.data.totalGrade ?? null,
                    resultData: {
                        ...data.data,
                        rawInputs: { my: buildPerson(false), partner: buildPerson(true) },
                    },
                });
            } catch {
                toast.error('계산에 실패했어요. 입력 정보를 확인해 주세요.');
                router.replace('/hap/input');
            } finally {
                setLoading(false);
            }
        })();

        // AI 진단 — 결정론 미리보기와 독립. 실패해도 무료 미리보기 자체는
        // 정상 동작해야 하므로 에러 시 그냥 섹션을 숨긴다 (토스트 없음).
        (async () => {
            try {
                const res = await fetch('/api/hap/preview-ai', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ my: buildPerson(false), partner: buildPerson(true) }),
                });
                const data = await res.json();
                if (data.success) {
                    setAiPreview(data.data);
                    // 보관함 기록에 진단 문구도 병합 — 다시 볼 때 그대로 보이도록
                    const existing = getHapHistoryEntry(freeRecordId.current);
                    upsertFreeHapHistory(freeRecordId.current, {
                        resultData: { ...(existing?.resultData || {}), aiPreview: data.data },
                    });
                }
            } catch { /* 조용히 무시 — 무료 미리보기의 핵심 경로가 아니다 */ } finally {
                setAiLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // AI가 빨리 응답해도 "성의 없이 즉답"처럼 보이지 않도록 로딩 화면을 최소 시간 붙잡아 둔다.
    useEffect(() => {
        const t = setTimeout(() => setMinDelayDone(true), MIN_LOADING_MS);
        const stepTimer = setInterval(() => {
            setLoadingStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
        }, MIN_LOADING_MS / LOADING_STEPS.length);
        return () => { clearTimeout(t); clearInterval(stepTimer); };
    }, []);

    // 결제 1단계(이메일 입력) 후 로그인을 선택해 OAuth로 나갔다가 돌아온 경우,
    // 저장해 둔 결제 정보로 결제창을 자동으로 다시 연다 (재회사주와 동일한 패턴).
    useEffect(() => {
        if (!preview || hasResumedPayment.current) return;
        const pendingRaw = localStorage.getItem('pendingOAuthPayment');
        if (!pendingRaw) return;

        try {
            const pending = JSON.parse(pendingRaw);
            if (Date.now() - pending.timestamp > 10 * 60 * 1000) {
                localStorage.removeItem('pendingOAuthPayment');
                return;
            }
            (async () => {
                if (hasResumedPayment.current) return;
                hasResumedPayment.current = true;
                const { createClient } = await import("@/utils/supabase/client");
                const { data: { user } } = await createClient().auth.getUser();
                if (!user) { hasResumedPayment.current = false; return; }
                localStorage.removeItem('pendingOAuthPayment');
                setEmail(pending.email);
                toast.success('로그인 완료! 결제창을 열고 있습니다...', { duration: 2000, id: 'hap-oauth-resume' });
                setTimeout(() => proceedToPay({ type: 'member', value: user.id }, pending.email, discount), 800);
            })();
        } catch {
            localStorage.removeItem('pendingOAuthPayment');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preview]);

    // 인스타 스토리용 공유 카드 (1080×1920) — 캔버스로 그려서 공유/저장
    const handleShare = async () => {
        if (!preview) return;
        try {
            const W = 1080, H = 1920;
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d')!;

            // 배경 + 은은한 골드 비네트
            ctx.fillStyle = '#0A090C';
            ctx.fillRect(0, 0, W, H);
            const vg = ctx.createRadialGradient(W / 2, H * 0.38, 80, W / 2, H * 0.38, W * 0.9);
            vg.addColorStop(0, 'rgba(201,161,92,0.13)');
            vg.addColorStop(1, 'rgba(201,161,92,0)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);

            const serif = "'Noto Serif KR', serif";
            const sans = "Pretendard, sans-serif";
            ctx.textAlign = 'center';

            // 상단 브랜드
            ctx.fillStyle = '#9C9199';
            ctx.font = `600 34px ${sans}`;
            ctx.fillText('운 명 의  합', W / 2, 250);

            // 인장 2개
            const sealSize = 190;
            const drawSeal = (x: number, rot: number, color: string, hanja: string) => {
                ctx.save();
                ctx.translate(x, 480);
                ctx.rotate((rot * Math.PI) / 180);
                ctx.strokeStyle = color;
                ctx.lineWidth = 9;
                ctx.strokeRect(-sealSize / 2, -sealSize / 2, sealSize, sealSize);
                ctx.fillStyle = color;
                ctx.font = `900 110px ${serif}`;
                ctx.textBaseline = 'middle';
                ctx.fillText(hanja, 0, 10);
                ctx.restore();
            };
            drawSeal(W / 2 - 170, -4, '#B8B4BE', preview.mySeal || '');
            drawSeal(W / 2 + 170, 4, '#D9B872', preview.partnerSeal || '');
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#9C9199';
            ctx.font = `500 44px ${sans}`;
            ctx.fillText('✕', W / 2, 495);

            // 이름
            ctx.fillStyle = '#F0EAEB';
            ctx.font = `700 62px ${serif}`;
            ctx.fillText(`${store.name || '나'} ✕ ${store.partnerName || '그 사람'}`, W / 2, 720);

            // 종합 점수
            ctx.fillStyle = '#E8CF9C';
            ctx.font = `900 300px ${serif}`;
            ctx.fillText(String(preview.hapScores?.total ?? ''), W / 2, 1080);
            ctx.font = `700 64px ${serif}`;
            ctx.fillText(`종합 궁합 ${preview.totalGrade}등급`, W / 2, 1190);

            // 별점
            const stars = preview.totalStars ?? 0;
            let starText = '';
            for (let i = 1; i <= 5; i++) starText += i <= Math.floor(stars) ? '★' : (i - 0.5 <= stars ? '⯨' : '☆');
            ctx.fillStyle = '#D9B872';
            ctx.font = `400 72px ${sans}`;
            ctx.fillText(starText, W / 2, 1300);

            // 유형 배지
            if (preview.relationType) {
                ctx.fillStyle = '#F0EAEB';
                ctx.font = `700 52px ${sans}`;
                ctx.fillText(`「 ${preview.relationType.badge} 」`, W / 2, 1440);
                ctx.fillStyle = '#9C9199';
                ctx.font = `400 38px ${sans}`;
                ctx.fillText(preview.relationType.desc, W / 2, 1510);
            }

            // 워터마크
            ctx.fillStyle = '#8A8290';
            ctx.font = `500 36px ${sans}`;
            ctx.fillText('dasisaju.com/hap', W / 2, 1750);

            const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
            const file = new File([blob], 'hap-compatibility.png', { type: 'image/png' });
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file] });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'hap-compatibility.png';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('궁합 카드를 저장했어요');
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') toast.error('공유 카드 생성에 실패했어요');
        }
    };

    // 결제 1단계(HapPaymentModal, 이메일·할인코드) → 2단계(UpgradeModal, 로그인/비회원)를
    // 거쳐 최종 확정된 identifier로 실제 결제를 연다 (재회사주 startPremiumAnalysis와 동일 구조).
    const proceedToPay = async (identifier: { type: 'guest' | 'member'; value: string }, finalEmail: string, finalDiscount: { code: string; percent: number } | null) => {
        if (!finalEmail.includes('@') || paying) return;
        setShowUpgradeModal(false);
        setPaying(true);
        const price = finalDiscount ? Math.round(HAP_PRICE * (100 - finalDiscount.percent) / 100) : HAP_PRICE;
        try {
            const orderId = `hap${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
            localStorage.setItem('pendingHapPayment', JSON.stringify({
                orderId, amount: price, customerEmail: finalEmail,
                discountCode: finalDiscount?.code || null,
                identifier,
                myRawInput: buildPerson(false), partnerRawInput: buildPerson(true),
                // 보관함 카드 표시용 — 결제 확정 후 같은 항목을 premium으로 승격한다
                myName: store.name || '', partnerName: store.partnerName || '',
                totalScore: preview.hapScores?.total ?? null, totalGrade: preview.totalGrade ?? null,
                freeRecordId: freeRecordId.current,
            }));

            const goSuccess = (paymentKey: string) => {
                window.location.href = `/hap/payment/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${price}`;
            };

            if (process.env.NODE_ENV === 'development') { goSuccess(`dev_payment_key_${Date.now()}`); return; }
            if (await checkFreePass()) { goSuccess(makeFreePassKey()); return; }
            // 100% 할인 쿠폰 — 결제할 금액이 없으므로 토스 없이 성공 플로우로 직행
            if (finalDiscount && price === 0) { goSuccess(`coupon_free_${Date.now()}`); return; }

            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!clientKey) { toast.error('결제 설정 오류입니다. 잠시 후 다시 시도해 주세요.'); setPaying(false); return; }
            const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);
            const payment = tossPayments.payment({ customerKey: identifier.value || ANONYMOUS });
            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: price },
                orderId,
                orderName: '운명의 합 궁합 리포트',
                customerName: store.name || '익명',
                customerEmail: finalEmail,
                successUrl: `${window.location.origin}/hap/payment/success`,
                failUrl: `${window.location.origin}/hap?payfail=1`,
            });
        } catch (err) {
            console.error(err);
            setPaying(false);
        }
    };

    // HapPaymentModal(이메일·할인코드) 제출 → 로그인 여부 확인 →
    // 로그인 상태면 바로 결제, 아니면 UpgradeModal(로그인/비회원)로 이어준다.
    const handlePaymentModalNext = async (finalEmail: string, finalDiscount: { code: string; percent: number } | null) => {
        setEmail(finalEmail);
        setDiscount(finalDiscount);
        setShowPaymentModal(false);
        const { createClient } = await import("@/utils/supabase/client");
        const { data: { user } } = await createClient().auth.getUser();
        if (user) {
            proceedToPay({ type: 'member', value: user.id }, finalEmail, finalDiscount);
        } else {
            setShowUpgradeModal(true);
        }
    };

    if (loading || !preview || !minDelayDone) {
        return (
            <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Pretendard, -apple-system, sans-serif', padding: 24 }}>
                <style>{`@keyframes hap-preview-seal-pulse { 0%,100%{ transform:rotate(-4deg) scale(1);} 50%{ transform:rotate(-4deg) scale(1.06);} }`}</style>
                <div style={{ width: 60, height: 60, border: `2.5px solid ${C.accentBright}`, color: C.accentBright, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 25, fontWeight: 900, marginBottom: 22, animation: 'hap-preview-seal-pulse 2.4s ease-in-out infinite', boxShadow: '0 0 24px rgba(217,184,114,0.28)' }}>合</div>
                <h2 style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>두 분의 궁합을 읽고 있어요</h2>
                <p style={{ fontSize: 13, color: C.sub, transition: 'opacity 0.3s' }}>{LOADING_STEPS[loadingStepIdx]}</p>
            </div>
        );
    }

    const comp = preview.compatibility;

    return (
        <div style={{ background: 'transparent', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', paddingBottom: 60 }}>
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

                {/* 종합 점수 헤드라인 — 6항목 평균(유료 리포트와 같은 앵커 계산) */}
                {preview.hapScores && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '26px 20px 22px', textAlign: 'center', marginBottom: 14 }}>
                        {preview.relationType && (
                            <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 99, padding: '5px 14px', marginBottom: 14 }}>
                                {preview.relationType.badge}
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                            <span style={{ fontFamily: C.serif, fontSize: 56, fontWeight: 900, color: C.accentBright, lineHeight: 1 }}>{preview.hapScores.total}</span>
                            <span style={{ fontSize: 15, color: C.sub }}>점</span>
                            <span style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 700, color: C.ink, marginLeft: 10 }}>{preview.totalGrade}</span>
                            <span style={{ fontSize: 12, color: C.muted }}>등급</span>
                        </div>
                        <p style={{ fontSize: 17, color: C.her, letterSpacing: 3, margin: '10px 0 0' }} aria-label={`별점 5점 만점에 ${preview.totalStars}점`}>
                            {Array.from({ length: 5 }).map((_, i) => {
                                const filled = i + 1 <= Math.floor(preview.totalStars);
                                const half = !filled && i + 0.5 <= preview.totalStars;
                                return <span key={i} style={{ opacity: filled ? 1 : half ? 0.55 : 0.18 }}>★</span>;
                            })}
                        </p>
                        {preview.relationType && (
                            <p style={{ fontSize: 12.5, color: C.sub, margin: '12px 0 0' }}>{preview.relationType.desc}</p>
                        )}

                        {/* 6항목 점수 티저 — 숫자는 무료, 이유는 리포트 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20 }}>
                            {SCORE_LABELS.map(({ key, label }) => (
                                <div key={key} style={{ background: 'rgba(240,234,235,0.03)', border: `1px solid ${C.lineSoft}`, borderRadius: 12, padding: '12px 4px 10px' }}>
                                    <p style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{preview.hapScores[key]}</p>
                                    <p style={{ fontSize: 10.5, color: C.muted, margin: '3px 0 0' }}>{label}</p>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 11, color: C.muted, margin: '12px 0 0' }}>각 점수가 왜 나왔는지, 실제 어떤 장면으로 나타나는지는 리포트에서 풀어드려요</p>
                    </motion.div>
                )}

                {/* AI 진단 — 역술가가 두 분의 사주를 보고 첫눈에 짚어주는 한마디 (짧고 강하게) */}
                {(aiLoading || aiPreview?.essence) && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                        style={{ marginBottom: 14, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: 20 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 12px' }}>
                            <Sparkles size={13} color={C.accentBright} /> 역술가의 첫 진단
                        </h3>
                        {aiLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 0.85, 0.6].map((w, i) => (
                                    <div key={i} style={{ height: 13, width: `${w * 100}%`, borderRadius: 6, background: 'rgba(240,234,235,0.06)' }} />
                                ))}
                            </div>
                        ) : (
                            <>
                                {aiPreview?.coreLine && (
                                    <p style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 700, color: C.accentBright, margin: '0 0 10px' }}>
                                        「 {aiPreview.coreLine} 」
                                    </p>
                                )}
                                <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>{aiPreview?.essence}</p>
                            </>
                        )}
                    </motion.div>
                )}

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

                {/* 오행 분포 비교 — 두 사람이 서로 무엇을 채워주는지 */}
                {preview.myOhhaeng && preview.partnerOhhaeng && (
                    <div style={{ marginTop: 24 }}>
                        <OhhaengCompareChart
                            myName={store.name || '나'} partnerName={store.partnerName || '그 사람'}
                            myOhhaeng={preview.myOhhaeng} partnerOhhaeng={preview.partnerOhhaeng}
                            ohhaengAnalysis={preview.ohhaengAnalysis}
                        />
                    </div>
                )}

                {/* 공유 카드 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ marginTop: 14 }}>
                    <button onClick={handleShare}
                        style={{ width: '100%', background: 'transparent', border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: '13px 0', color: C.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Share2 size={15} /> 궁합 점수 카드 공유하기
                    </button>
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

                    <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 14 }}>결과를 언제든 다시 볼 수 있는 링크를 이메일로 보내드려요</p>

                    <button
                        onClick={() => setShowPaymentModal(true)} disabled={paying}
                        style={{ width: '100%', background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '16px 0', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 30px rgba(140,106,50,0.28)', opacity: paying ? 0.6 : 1 }}
                    >
                        {paying ? '결제 준비 중…' : '전체 리포트 보기'}
                    </button>
                    <p style={{ fontSize: 10.5, color: C.muted, textAlign: 'center', marginTop: 9, marginBottom: 0 }}>결제 즉시 분석이 시작되고, 완성까지 약 1~2분 걸려요</p>
                </motion.div>
            </div>

            {showPaymentModal && (
                <HapPaymentModal
                    price={HAP_PRICE}
                    onClose={() => setShowPaymentModal(false)}
                    onNext={handlePaymentModalNext}
                />
            )}

            {showUpgradeModal && (
                <div style={{ ['--btn-bg' as any]: C.btnBg, ['--btn-ink' as any]: C.btnInk, ['--btn-shadow' as any]: '0 6px 30px rgba(140,106,50,0.28)' }}>
                    <UpgradeModal
                        onClose={() => setShowUpgradeModal(false)}
                        onStartGuest={() => proceedToPay({ type: 'guest', value: 'anonymous' }, email, discount)}
                        onStartMember={(userId) => proceedToPay({ type: 'member', value: userId }, email, discount)}
                        pendingPaymentInfo={{ packageId: 'compatibility', email }}
                    />
                </div>
            )}
        </div>
    );
}
