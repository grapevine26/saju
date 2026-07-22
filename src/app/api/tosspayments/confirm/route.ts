import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { isFreePassKey, isFreePassSession } from "@/lib/freePass";
import { recordPaidEvent } from "@/lib/funnel";
import { safeSend, markDispatchFailed } from "@/lib/jobDispatch";
import { findValidCode, consumeCode, applyDiscount } from "@/lib/discount";

// 서버측 가격표 — 클라이언트가 보낸 금액을 절대 신뢰하지 않는다.
const SAJU_PRICES: Record<string, number> = { premium: 19900, signature: 34900, compatibility: 19900 };

// 결제 건으로 이미 생성된 잡을 조회 (멱등 처리용). paymentKey는 raw_data에 저장됨.
async function findExistingJob(paymentKey: string) {
    if (!paymentKey) return null;
    const { data } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id")
        .filter("raw_data->>paymentKey", "eq", paymentKey)
        .maybeSingle();
    return data?.id ?? null;
}

// 잡 생성 + 백그라운드 분석 이벤트 발송 (한 곳에서만)
async function createJobAndDispatch(payload: any, paymentKey: string) {
    const { phoneNumber, userId, rawData, packageId, customerEmail } = payload;
    const enhancedRawData = { ...rawData, packageId: packageId || 'premium', paymentKey, customerEmail };

    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .insert({
            phone_number: phoneNumber || null,
            user_id: userId || null,
            status: "pending",
            raw_data: enhancedRawData,
        })
        .select()
        .single();

    if (error || !job) {
        console.error("Supabase 작업 생성 실패:", error);
        return null;
    }

    // 발송 실패해도 잡은 살아있으므로 jobId를 반환한다 — 결제는 이미 승인된 상태.
    // 실패 플래그를 남기면 결과 대기 화면의 상태 폴링이 자동 재발송한다.
    const sent = await safeSend({
        name: "analysis.premium.requested",
        data: {
            jobId: job.id,
            phone_number: phoneNumber || undefined,
            customerEmail: customerEmail || undefined,
            user_id: userId || undefined,
            raw_data: enhancedRawData,
            paymentKey,
        },
    });
    if (!sent) {
        await markDispatchFailed("premium_analysis_jobs", job.id, enhancedRawData);
    }

    return job.id;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentKey, orderId, amount, payload } = body;

        const isDev = process.env.NODE_ENV === 'development';

        // 관리자 프리패스 — free_pass_ 키는 세션 이메일이 허용 목록일 때만 승인 우회.
        // 목록 외 사용자가 키만 위조해 보내면 즉시 차단.
        const freePass = isFreePassKey(paymentKey);
        if (freePass && !(await isFreePassSession())) {
            return NextResponse.json({ success: false, message: '결제 정보가 올바르지 않습니다.' }, { status: 403 });
        }

        // 1) 서버 가격 검증 — 상품 결제 건(payload 존재)은 금액이 상품 가격과 정확히 일치해야 한다.
        //    타 서비스(3,900원 타로 등) 결제로 프리미엄 잡을 만드는 교차 우회를 원천 차단.
        //    후기 보상 할인 코드가 있으면 서버가 직접 코드를 검증해 할인가를 기대 금액으로 삼는다.
        let expectedAmount = 0;
        const discountCode: string | null = typeof payload?.discountCode === 'string' && payload.discountCode.trim()
            ? payload.discountCode.trim().toUpperCase() : null;
        if (payload) {
            const pkg = payload.packageId === 'signature' ? 'signature'
                : payload.packageId === 'compatibility' ? 'compatibility' : 'premium';
            expectedAmount = SAJU_PRICES[pkg];
            if (discountCode) {
                const valid = await findValidCode(discountCode);
                if (!valid) {
                    return NextResponse.json(
                        { success: false, message: '할인 코드가 만료되었거나 이미 사용되었습니다. 코드를 지우고 다시 결제해 주세요.' },
                        { status: 400 },
                    );
                }
                expectedAmount = applyDiscount(expectedAmount, valid.percent);
            }
            if (Number(amount) !== expectedAmount) {
                console.error('[confirm] 금액 불일치:', { amount, expected: expectedAmount, pkg, orderId });
                return NextResponse.json(
                    { success: false, message: '결제 금액이 상품 가격과 일치하지 않습니다.' },
                    { status: 400 },
                );
            }
        }

        // 100% 쿠폰 — 서버가 직접 검증한 코드로 계산한 기대 금액이 0원이면 수납할 돈이
        // 없으므로 토스 승인 없이 통과시킨다. 코드가 무효면 위 findValidCode에서 이미
        // 걸러졌고, 금액도 위에서 0원 일치를 확인했으므로 위조 여지가 없다.
        const zeroWonCoupon = !!payload && !!discountCode && expectedAmount === 0;
        const bypassToss = isDev || freePass || zeroWonCoupon;

        // 2) 멱등 — 동일 결제로 이미 만든 잡이 있으면 그대로 반환 (새로고침/중복요청/StrictMode)
        if (payload && paymentKey && !bypassToss) {
            const existingId = await findExistingJob(paymentKey);
            if (existingId) {
                return NextResponse.json({ success: true, data: { status: 'DONE' }, jobId: existingId });
            }
        }

        let data: any = { method: "CARD", status: "DONE" };

        if (bypassToss) {
            console.log(`[${isDev ? 'DEV MODE' : zeroWonCoupon ? '0원 쿠폰' : 'FREE PASS'}] Toss Payments 승인 우회:`, orderId, amount);
        } else {
            const secretKey = process.env.TOSS_SECRET_KEY;
            if (!secretKey) {
                console.error("TOSS_SECRET_KEY is not set.");
                return NextResponse.json({ success: false, message: '서버 설정 오류' }, { status: 500 });
            }
            const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

            const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
                method: "POST",
                headers: {
                    Authorization: `Basic ${encryptedSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentKey, orderId, amount }),
            });

            data = await response.json();

            if (!response.ok) {
                // 이미 승인된 결제 — "돈은 나갔는데 잡이 없는" 상황 복구.
                // GET으로 실제 결제를 다시 검증한 뒤 멱등하게 잡을 생성한다.
                if (data.code === 'ALREADY_PROCESSED_PAYMENT' && payload && paymentKey) {
                    const existingId = await findExistingJob(paymentKey);
                    if (existingId) {
                        return NextResponse.json({ success: true, data: { status: 'DONE' }, jobId: existingId });
                    }
                    const verifyRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
                        headers: { Authorization: `Basic ${encryptedSecretKey}` },
                    });
                    const pay = await verifyRes.json();
                    const valid = verifyRes.ok && pay.status === 'DONE' && pay.totalAmount === expectedAmount;
                    if (valid) {
                        const jobId = await createJobAndDispatch(payload, paymentKey);
                        if (jobId) {
                            if (discountCode) await consumeCode(discountCode, orderId);
                            await recordPaidEvent({ service: payload.packageId === 'compatibility' ? 'hap' : 'saju', jobId, amount: expectedAmount, utm: payload.utm, visitorId: payload.visitorId });
                            return NextResponse.json({ success: true, data: pay, jobId });
                        }
                    }
                    console.error('[confirm] ALREADY_PROCESSED 복구 실패:', pay?.code || pay?.status);
                }
                return NextResponse.json({ success: false, message: data.message || "결제 승인 실패", code: data.code }, { status: response.status });
            }
        }

        // 3) 결제 성공 시점에 바로 잡 생성 + 백그라운드 분석 시작
        if (payload) {
            const jobId = await createJobAndDispatch(payload, paymentKey);
            if (!jobId) {
                return NextResponse.json({ success: false, message: "시스템 오류로 분석을 시작하지 못했습니다. 카카오톡 채널로 문의해 주시면 즉시 환불 처리해 드리겠습니다." }, { status: 500 });
            }
            if (discountCode) await consumeCode(discountCode, orderId);
            await recordPaidEvent({ service: payload.packageId === 'compatibility' ? 'hap' : 'saju', jobId, amount: expectedAmount, utm: payload.utm, visitorId: payload.visitorId });
            return NextResponse.json({ success: true, data, jobId });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Toss Payments confirm error:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
