// ─────────────────────────────────────────────
// 할인 코드 검증 API (결제 페이지용)
// 유효 여부와 할인율만 반환 — 소진 처리는 결제 승인 시점에 서버가 수행.
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { findValidCode } from '@/lib/discount';

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        const found = await findValidCode(code);
        if (!found) {
            return NextResponse.json({ valid: false, error: '유효하지 않거나 이미 사용된 코드입니다.' });
        }
        return NextResponse.json({ valid: true, percent: found.percent, expiresAt: found.expires_at });
    } catch {
        return NextResponse.json({ valid: false, error: '코드 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
