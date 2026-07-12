import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";
import { NAMING_PRICE, NAMING_PRICE_EVALUATION } from "@/features/naming/constants";
import { isFreePassKey, isFreePassSession } from "@/lib/freePass";

// ─────────────────────────────────────────────
// 작명 프리미엄 결제 승인 API
// 기존 토스페이먼츠 MID/시크릿 키를 그대로 재사용하되,
// 엔드포인트와 Inngest 이벤트를 분리해 사주(재회) 플로우와 격리한다.
// 결제 금액·orderId를 서버에서 검증하고, paymentKey 기준으로 멱등 처리한다.
// ─────────────────────────────────────────────

const expectedPriceFor = (payload: any) =>
    payload?.namingInput?.serviceType === 'evaluation' ? NAMING_PRICE_EVALUATION : NAMING_PRICE;

async function findExistingJob(paymentKey: string) {
    if (!paymentKey) return null;
    const { data } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id")
        .filter("raw_data->>paymentKey", "eq", paymentKey)
        .maybeSingle();
    return data?.id ?? null;
}

async function createJobAndDispatch(payload: any, paymentKey: string) {
    const { userId, customerEmail, namingInput } = payload;
    const rawData = { service: 'naming', namingInput, paymentKey, customerEmail };

    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .insert({
            // phone_number NOT NULL 제약 대응 — 작명은 전화번호를 받지 않음
            phone_number: "naming",
            user_id: userId || null,
            status: "pending",
            raw_data: rawData,
        })
        .select()
        .single();

    if (error || !job) {
        console.error("[작명] Supabase 작업 생성 실패:", error);
        return null;
    }

    await inngest.send({
        name: "naming.premium.requested",
        data: { jobId: job.id, customerEmail: customerEmail || undefined, raw_data: rawData, paymentKey },
    });

    return job.id;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentKey, orderId, amount, payload } = body;

        // 1) 금액·주문 검증 — 서버 정가와 일치해야 하며 작명 주문(orderId 'naming_')이어야 한다.
        if (payload) {
            const expectedPrice = expectedPriceFor(payload);
            if (Number(amount) !== expectedPrice) {
                return NextResponse.json({ success: false, message: '결제 금액이 올바르지 않습니다.' }, { status: 400 });
            }
            if (orderId && !String(orderId).startsWith('naming_')) {
                console.error('[작명] orderId 형식 불일치:', orderId);
                return NextResponse.json({ success: false, message: '주문 정보가 올바르지 않습니다.' }, { status: 400 });
            }
        }

        const isDev = process.env.NODE_ENV === 'development';

        // 관리자 프리패스 — free_pass_ 키는 세션 이메일이 허용 목록일 때만 승인 우회
        const freePass = isFreePassKey(paymentKey);
        if (freePass && !(await isFreePassSession())) {
            return NextResponse.json({ success: false, message: '결제 정보가 올바르지 않습니다.' }, { status: 403 });
        }
        const bypassToss = isDev || freePass;

        // 2) 멱등 — 동일 결제로 이미 만든 잡이 있으면 반환
        if (payload && paymentKey && !bypassToss) {
            const existingId = await findExistingJob(paymentKey);
            if (existingId) {
                return NextResponse.json({ success: true, data: { status: 'DONE' }, jobId: existingId });
            }
        }

        let data: any = { method: "CARD", status: "DONE" };

        if (bypassToss) {
            console.log(`[${isDev ? 'DEV MODE' : 'FREE PASS'}] [작명] Toss 승인 우회:`, orderId, amount);
        } else {
            const secretKey = process.env.TOSS_SECRET_KEY;
            if (!secretKey) {
                console.error("TOSS_SECRET_KEY is not set.");
                return NextResponse.json({ success: false, message: '서버 설정 오류' }, { status: 500 });
            }
            const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

            const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
                method: "POST",
                headers: { Authorization: `Basic ${encryptedSecretKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paymentKey, orderId, amount }),
            });

            data = await response.json();

            if (!response.ok) {
                // 이미 승인된 결제 — "돈은 나갔는데 잡이 없는" 상황 복구
                if (data.code === 'ALREADY_PROCESSED_PAYMENT' && payload && paymentKey) {
                    const existingId = await findExistingJob(paymentKey);
                    if (existingId) {
                        return NextResponse.json({ success: true, data: { status: 'DONE' }, jobId: existingId });
                    }
                    const verifyRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
                        headers: { Authorization: `Basic ${encryptedSecretKey}` },
                    });
                    const pay = await verifyRes.json();
                    const valid = verifyRes.ok && pay.status === 'DONE' && pay.totalAmount === expectedPriceFor(payload);
                    if (valid) {
                        const jobId = await createJobAndDispatch(payload, paymentKey);
                        if (jobId) return NextResponse.json({ success: true, data: pay, jobId });
                    }
                    console.error('[작명] ALREADY_PROCESSED 복구 실패:', pay?.code || pay?.status);
                }
                return NextResponse.json({ success: false, message: data.message || "결제 승인 실패", code: data.code }, { status: response.status });
            }
        }

        // 3) 결제 성공 즉시 작업 생성 + 백그라운드 이벤트 발송
        if (payload) {
            const jobId = await createJobAndDispatch(payload, paymentKey);
            if (!jobId) {
                return NextResponse.json({ success: false, message: "시스템 오류로 작명을 시작하지 못했습니다. 카카오톡 채널로 문의해 주시면 즉시 환불 처리해 드리겠습니다." }, { status: 500 });
            }
            return NextResponse.json({ success: true, data, jobId });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[작명] 결제 승인 에러:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
