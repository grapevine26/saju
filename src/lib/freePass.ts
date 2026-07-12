// ─────────────────────────────────────────────
// 관리자 프리패스 (결제 없이 전 서비스 이용)
// 서버 전용 — 허용 이메일 목록은 클라이언트 번들에 노출되지 않는다.
// 검증은 반드시 Supabase 세션 쿠키 기준으로 수행하며,
// 클라이언트가 보낸 이메일/유저ID는 신뢰하지 않는다.
// ─────────────────────────────────────────────

import { createClient } from '@/utils/supabase/server';

/** 결제 없이 이용 가능한 관리자 계정 (소문자) */
const FREE_PASS_EMAILS = new Set(
    [
        'yifi1004@gmail.com',
        // 필요 시 환경변수로 추가: FREE_PASS_EMAILS=a@b.com,c@d.com
        ...(process.env.FREE_PASS_EMAILS?.split(',') ?? []),
    ].map((e) => e.trim().toLowerCase()).filter(Boolean),
);

/** 프리패스 전용 paymentKey 프리픽스 (클라이언트가 생성) */
export const FREE_PASS_KEY_PREFIX = 'free_pass_';

export function isFreePassKey(paymentKey?: string | null): boolean {
    return typeof paymentKey === 'string' && paymentKey.startsWith(FREE_PASS_KEY_PREFIX);
}

/**
 * 현재 요청의 로그인 세션이 프리패스 대상인지 확인.
 * 쿠키 기반 세션에서 이메일을 직접 읽으므로 위조 불가.
 */
export async function isFreePassSession(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email?.toLowerCase();
        return !!email && FREE_PASS_EMAILS.has(email);
    } catch {
        return false;
    }
}
