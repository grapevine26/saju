import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentId } = body;

        const secretKey = process.env.PORTONE_API_SECRET;

        if (!secretKey) {
            console.error("PORTONE_API_SECRET is not set.");
            return NextResponse.json({ success: false, message: '서버 설정 오류' }, { status: 500 });
        }

        // PortOne V2 단건 결제 단건 조회 API
        const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
            method: 'GET',
            headers: {
                Authorization: `PortOne ${secretKey}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ success: false, message: data.message || "결제 내역 조회 실패", code: data.type }, { status: response.status });
        }

        // status === 'PAID' 인지 확인
        if (data.status !== 'PAID') {
            return NextResponse.json({ success: false, message: '결제가 완료되지 않았습니다.', code: 'PAYMENT_NOT_PAID' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('PortOne confirm error:', error);
        return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
