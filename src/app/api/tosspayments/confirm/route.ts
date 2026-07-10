import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentKey, orderId, amount, payload } = body;

        let data: any = { method: "CARD", status: "DONE" };
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            console.log("=================================================");
            console.log("[DEV MODE] Toss Payments 승인 우회 (가짜 결제 승인 완료)");
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
                body: JSON.stringify({
                    paymentKey,
                    orderId,
                    amount,
                }),
            });

            data = await response.json();

            if (!response.ok) {
                return NextResponse.json({ success: false, message: data.message || "결제 승인 실패", code: data.code }, { status: response.status });
            }
        }

        // 결제 성공 시점에 바로 작업을 생성하고 백그라운드 이벤트 발송 (결제 우회 원천 차단)
        if (payload) {
            const { phoneNumber, userId, rawData, packageId, customerEmail } = payload;
            const enhancedRawData = { ...rawData, packageId: packageId || 'premium', paymentKey, customerEmail };

            const { data: job, error } = await supabaseAdmin
                .from("premium_analysis_jobs")
                .insert({
                    phone_number: phoneNumber || null,
                    user_id: userId || null,
                    status: "pending",
                    raw_data: enhancedRawData
                })
                .select()
                .single();

            if (error || !job) {
                console.error("Supabase 작업 생성 실패:", error);
                // DB 생성 자체가 실패한 치명적 상황. 수동 환불 필요.
                return NextResponse.json({ success: false, message: "시스템 오류로 분석을 시작하지 못했습니다. 카카오톡 채널로 문의해 주시면 즉시 환불 처리해 드리겠습니다." }, { status: 500 });
            }

            await inngest.send({
                name: "analysis.premium.requested",
                data: {
                    jobId: job.id,
                    phone_number: phoneNumber || undefined,
                    customerEmail: customerEmail || undefined,
                    user_id: userId || undefined,
                    raw_data: enhancedRawData,
                    paymentKey
                }
            });

            return NextResponse.json({ success: true, data, jobId: job.id });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Toss Payments confirm error:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
