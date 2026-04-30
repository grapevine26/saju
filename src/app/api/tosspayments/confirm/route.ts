import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentKey, orderId, amount } = body;

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

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ success: false, message: data.message || "결제 승인 실패", code: data.code }, { status: response.status });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Toss Payments confirm error:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
