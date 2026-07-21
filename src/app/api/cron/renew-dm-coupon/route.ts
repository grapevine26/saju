import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SHARED_CODE = "묘연20";
const PERCENT = 20;
const VALID_DAYS = 3;
const MAX_USES_PER_DAY = 100;

/**
 * [Vercel Cron] DM 웰컴 공유 쿠폰(묘연20) 자동 갱신 — 매일 자정(KST) 실행.
 * 매일 만료를 +3일로 밀어서 누가 언제 DM을 받든 항상 "3일 남은" 쿠폰이 되게 한다
 * (DM 고지 문구 "3일 안에"가 항상 사실이 되는 구조). use_count 리셋으로 어뷰징
 * 상한은 하루 100회. 쿠폰 운영을 중단하려면 DB에서 해당 행을 삭제하면 된다 —
 * 이 크론은 기존 행을 갱신만 할 뿐 새로 만들지 않으므로 자동으로 no-op이 된다.
 */
export async function GET(req: NextRequest) {
    // CRON_SECRET이 설정돼 있으면 Vercel 크론의 Bearer 헤더를 검증한다.
    // 미설정 시에도 동작 자체는 쿠폰 기한 연장뿐이라 외부 호출로 인한 실익·피해가 없다.
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabaseAdmin
        .from("discount_codes")
        .select("code, use_count, expires_at")
        .eq("code", SHARED_CODE)
        .maybeSingle();

    if (!existing) {
        console.log(`[cron] ${SHARED_CODE} 없음 — 갱신 생략 (운영 중단 상태)`);
        return NextResponse.json({ renewed: false, reason: "code not found" });
    }

    const expiresAt = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin
        .from("discount_codes")
        .update({ percent: PERCENT, expires_at: expiresAt, max_uses: MAX_USES_PER_DAY, use_count: 0 })
        .eq("code", SHARED_CODE);

    if (error) {
        console.error(`[cron] ${SHARED_CODE} 갱신 실패:`, error.message);
        return NextResponse.json({ renewed: false, error: error.message }, { status: 500 });
    }

    // 어제 사용량은 Vercel 로그로 관찰 (리셋 전 카운트)
    console.log(`[cron] ${SHARED_CODE} 갱신 완료 — 만료 ${expiresAt}, 직전 사용 ${existing.use_count}회`);
    return NextResponse.json({ renewed: true, expiresAt, previousUseCount: existing.use_count });
}
