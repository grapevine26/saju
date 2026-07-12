import { NextResponse } from 'next/server';
import { isFreePassSession } from '@/lib/freePass';

// 클라이언트 UX 분기용 — 결제창을 띄울지 프리패스로 건너뛸지 결정.
// 실제 결제 우회 승인 여부는 각 confirm/start 엔드포인트가 세션으로 재검증한다.
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ freePass: await isFreePassSession() });
}
