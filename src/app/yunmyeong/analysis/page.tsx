'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NamingInput, Ohaeng } from '@/features/naming/types';
import {
    NAMING_INPUT_KEY,
    NAMING_LITE_RESULT_KEY,
    NAMING_PENDING_KEY,
    NAMING_PAYMENT_ENABLED,
} from '@/features/naming/constants';
import { mdBalanceScore, mdDist, mdLacking, mdPricing } from '@/features/naming/yunmyeong';
import { saveNamingHistory } from '@/features/naming/history';
import MdLoadingMandala from '@/components/naming/yunmyeong/MdLoading';
import MdSajuPillars, { MdManseryeok } from '@/components/naming/yunmyeong/MdSajuPillars';
import { MdChartBars } from '@/components/naming/yunmyeong/MdCharts';
import {
    AiInsightCard,
    BalanceMeter,
    CandidateBadge,
    ConflictNote,
    DayMasterCard,
    DiagnosisCopy,
    HookHeader,
    MdTeaser,
    PriceCard,
    ReportTeaser,
} from '@/components/naming/yunmyeong/MdHook';
import MdPaymentSheet from '@/components/naming/yunmyeong/MdPaymentSheet';
import MdShell from '@/components/naming/yunmyeong/MdShell';
import { MdToast, useMdToast } from '@/components/naming/yunmyeong/MdReport';
import { checkFreePass, makeFreePassKey } from '@/utils/freePassClient';

// ─────────────────────────────────────────────
// 윤명 — 연산 로딩 연출 → 무료 진단 / 페이월 (The Hook · 클리프 레이아웃)
// hybrid 테마: 이 화면부터 obsidian("분석에 들어가는 순간 어두워지는" 연출)
// 진단(문제 제기)은 무료 · 결정론 연산, 처방(이름)은 리포트에서 공개.
// ─────────────────────────────────────────────

interface LiteResult {
    surname: { hangul: string; hanja: string; strokes: number };
    baziStr: string;
    manseryeok: MdManseryeok;
    diagnosis: {
        counts: Record<Ohaeng, number>;
        percentages: Record<Ohaeng, number>;
        missing: Ohaeng[];
        weakest: Ohaeng;
        strongest: Ohaeng;
        complement: [Ohaeng, Ohaeng];
    };
    /** flash-lite 개인화 소견 (생성 실패 시 null — 결정론 진단만 노출) */
    teaser?: MdTeaser | null;
    candidateCount: number;
}

/** 로딩 연출 길이 (초) — 핸드오프 기본값 */
const LOADING_SECONDS = 4.5;

export default function NamingAnalysisPage() {
    const router = useRouter();
    const [input, setInput] = useState<NamingInput | null>(null);
    const [result, setResult] = useState<LiteResult | null>(null);
    /** loading = 만다라 연출 중, hook = 진단/페이월 노출 */
    const [phase, setPhase] = useState<'loading' | 'hook'>('loading');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [toastMsg, toast] = useMdToast();
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let storedInput: NamingInput | null = null;
        try {
            const raw = sessionStorage.getItem(NAMING_INPUT_KEY);
            if (raw) storedInput = JSON.parse(raw);
        } catch { /* 파싱 실패 시 입력 페이지로 */ }

        if (!storedInput) {
            router.replace('/yunmyeong/input');
            return;
        }
        setInput(storedInput);

        // 뒤로가기로 재진입 시 캐시된 진단을 재사용 (무료 한도 보호 — 로딩 연출 생략)
        try {
            const cached = sessionStorage.getItem(NAMING_LITE_RESULT_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.manseryeok) {
                    setResult(parsed);
                    setPhase('hook');
                    return;
                }
            }
        } catch { /* 캐시 무시 */ }

        const analyze = async () => {
            try {
                const res = await fetch('/api/naming/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: storedInput }),
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.error || '분석에 실패했습니다.');

                sessionStorage.setItem(NAMING_LITE_RESULT_KEY, JSON.stringify(json.data));
                setResult(json.data);
            } catch (e: any) {
                console.error('무료 진단 실패:', e);
                toast(e.message || '분석 중 오류가 발생했어요. 다시 시도해 주세요.');
                setTimeout(() => router.replace('/yunmyeong/input'), 2200);
            }
        };

        analyze();
    }, [router, toast]);

    /** 무료 리포트 즉시 발급 (NAMING_PAYMENT_ENABLED=false 기간 전용) */
    const requestFreeReport = async () => {
        if (!input || issuing) return;
        setIssuing(true);
        try {
            const res = await fetch('/api/naming/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    namingInput: input,
                    // TODO(결제 재개 시): 완성 알림 메일용 이메일 수집 UI 연결
                    customerEmail: null,
                }),
            });
            const json = await res.json();
            if (!json.success || !json.jobId) {
                throw new Error(json.error || '리포트 생성 시작에 실패했습니다.');
            }
            saveNamingHistory({
                jobId: json.jobId,
                serviceType: input.serviceType,
                surname: input.surname,
                currentName: input.currentName,
                createdAt: Date.now(),
            });
            router.push(`/yunmyeong/result/${json.jobId}`);
        } catch (e: any) {
            console.error('리포트 발급 실패:', e);
            toast(e.message || '리포트 생성 중 문제가 발생했어요.');
            setIssuing(false);
        }
    };

    /** 토스 결제 요청 (기존 결제 플로우 — NAMING_PAYMENT_ENABLED=true일 때만 도달) */
    const requestTossPayment = async (customerEmail: string) => {
        if (!input || !result) return;
        const pricing = mdPricing(input.serviceType, mdLacking(result.diagnosis).el, input.currentName);
        try {
            const orderId = `naming_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

            sessionStorage.setItem(NAMING_PENDING_KEY, JSON.stringify({
                namingInput: input,
                customerEmail: customerEmail || null,
                orderId,
            }));

            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) {
                const dummyPaymentKey = `dev_payment_key_${Date.now()}`;
                window.location.href = `/yunmyeong/payment/success?paymentKey=${dummyPaymentKey}&orderId=${orderId}&amount=${pricing.price}`;
                return;
            }

            // 관리자 프리패스 — 결제창 없이 바로 성공 플로우 (서버가 세션으로 재검증)
            if (await checkFreePass()) {
                window.location.href = `/yunmyeong/payment/success?paymentKey=${makeFreePassKey()}&orderId=${orderId}&amount=${pricing.price}`;
                return;
            }

            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!clientKey) {
                toast('결제 설정 오류입니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);
            const payment = tossPayments.payment({ customerKey: ANONYMOUS });

            await payment.requestPayment({
                method: 'CARD', // 토스 결제창에서 카카오페이·토스페이·카드를 모두 선택 가능
                amount: { currency: 'KRW', value: pricing.price },
                orderId,
                orderName: pricing.headline,
                successUrl: `${window.location.origin}/yunmyeong/payment/success`,
                failUrl: `${window.location.origin}/yunmyeong/payment/fail`,
            });
        } catch (e: any) {
            if (e?.code !== 'USER_CANCEL') {
                console.error('결제 요청 실패:', e);
                toast('결제 요청 중 문제가 발생했어요. 다시 시도해 주세요.');
            }
        }
    };

    const onPay = () => {
        if (NAMING_PAYMENT_ENABLED) setSheetOpen(true);
        else requestFreeReport();
    };

    // ── 로딩 연출 (오행 만다라) ──
    if (phase === 'loading' || !result || !input) {
        return (
            <MdShell theme="obsidian">
                <MdLoadingMandala
                    seconds={LOADING_SECONDS}
                    done={!!result}
                    onDone={() => setPhase('hook')}
                />
                <MdToast msg={toastMsg} />
            </MdShell>
        );
    }

    // ── The Hook (클리프 레이아웃) ──
    const dist = mdDist(result.diagnosis);
    const lacking = mdLacking(result.diagnosis);
    const pricing = mdPricing(input.serviceType, lacking.el, input.currentName);
    const balanceScore = mdBalanceScore(result.diagnosis.percentages);
    const dayGan = result.manseryeok?.day?.gan;

    return (
        <MdShell theme="obsidian">
            <div className="md-screen">
                <HookHeader input={input} lacking={lacking} />
                <div style={{ padding: '22px 20px 36px', display: 'grid', gap: 16 }}>
                    <MdSajuPillars manseryeok={result.manseryeok} />

                    {/* 오행 분포 + 균형 점수 */}
                    <div className="md-card" style={{ padding: '20px 18px' }}>
                        <div className="md-eyebrow" style={{ marginBottom: 12 }}>선천 오행 분포</div>
                        <MdChartBars dist={dist} lacking={lacking.el} />
                        <BalanceMeter score={balanceScore} />
                    </div>

                    {/* 일간 — 타고난 그릇 */}
                    <DayMasterCard gan={dayGan} />

                    {/* 결핍 진단 (고정 카피) + 과다↔결핍 상극 구조 */}
                    <DiagnosisCopy input={input} lacking={lacking} />
                    <ConflictNote strongest={result.diagnosis.strongest} lacking={lacking.el} />

                    {/* AI 정밀 소견 (명식 글자 인용 개인화 — 실패 시 미노출) */}
                    {result.teaser ? (
                        <AiInsightCard teaser={result.teaser} currentName={input.currentName} />
                    ) : null}

                    {/* 처방 예고 → 블러 티저 → 선별 완료 배지 → 가격 카드 */}
                    {result.teaser?.solutionTeaser ? (
                        <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
                            {result.teaser.solutionTeaser}
                        </p>
                    ) : null}
                    <div style={{ marginTop: 14 }}>
                        <ReportTeaser serviceType={input.serviceType} dist={dist} lacking={lacking} />
                    </div>
                    <CandidateBadge count={result.candidateCount} serviceType={input.serviceType} />
                    <PriceCard pricing={pricing} onPay={onPay} busy={issuing} />
                </div>
            </div>

            {sheetOpen ? (
                <MdPaymentSheet
                    pricing={pricing}
                    onPay={async (email) => { await requestTossPayment(email); }}
                    onClose={() => setSheetOpen(false)}
                />
            ) : null}
            <MdToast msg={toastMsg} />
        </MdShell>
    );
}
