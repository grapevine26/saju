import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";
import { NAMING_PRICE, NAMING_PRICE_EVALUATION } from "@/features/naming/constants";

// ─────────────────────────────────────────────
// 작명 프리미엄 결제 승인 API
// 기존 토스페이먼츠 MID/시크릿 키를 그대로 재사용하되,
// 엔드포인트와 Inngest 이벤트를 분리해 사주(재회) 플로우와 격리한다.
// 결제 금액은 서버 상수(NAMING_PRICE)로 검증해 변조를 차단한다.
// ─────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentKey, orderId, amount, payload } = body;

        // 금액 변조 방지 — 서비스 유형별 정가 검증 (감명 9,900원 / 작명·개명 29,000원)
        const expectedPrice = payload?.namingInput?.serviceType === 'evaluation'
            ? NAMING_PRICE_EVALUATION
            : NAMING_PRICE;
        if (amount !== expectedPrice) {
            return NextResponse.json(
                { success: false, message: '결제 금액이 올바르지 않습니다.' },
                { status: 400 }
            );
        }

        let data: any = { method: "CARD", status: "DONE" };
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            console.log("=================================================");
            console.log("[DEV MODE] [작명] Toss Payments 승인 우회 (가짜 결제 승인 완료)");
            console.log("orderId:", orderId);
            console.log("amount:", amount);
            console.log("=================================================");
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
                return NextResponse.json(
                    { success: false, message: data.message || "결제 승인 실패", code: data.code },
                    { status: response.status }
                );
            }
        }

        // 결제 성공 즉시 작업 생성 + 백그라운드 이벤트 발송 (결제 우회 원천 차단)
        if (payload) {
            const { userId, customerEmail, namingInput } = payload;
            const rawData = {
                service: 'naming',
                namingInput,
                paymentKey,
                customerEmail,
            };

            const { data: job, error } = await supabaseAdmin
                .from("premium_analysis_jobs")
                .insert({
                    // phone_number NOT NULL 제약 대응 — 작명은 전화번호를 받지 않음
                    phone_number: "naming",
                    user_id: userId || null,
                    status: "pending",
                    raw_data: rawData
                })
                .select()
                .single();

            if (error || !job) {
                console.error("[작명] Supabase 작업 생성 실패:", error);
                return NextResponse.json(
                    { success: false, message: "시스템 오류로 작명을 시작하지 못했습니다. 카카오톡 채널로 문의해 주시면 즉시 환불 처리해 드리겠습니다." },
                    { status: 500 }
                );
            }

            await inngest.send({
                name: "naming.premium.requested",
                data: {
                    jobId: job.id,
                    customerEmail: customerEmail || undefined,
                    raw_data: rawData,
                    paymentKey
                }
            });

            return NextResponse.json({ success: true, data, jobId: job.id });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[작명] 결제 승인 에러:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
