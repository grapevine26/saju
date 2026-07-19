// ─────────────────────────────────────────────
// 후기 제출 API
// 완료된 유료 잡(재회사주/타로)에 한해 잡당 1건 저장하고
// 보상으로 20% 할인 코드를 발급한다.
// 이미 후기가 있으면 기존 발급 코드를 반환 (중복 제출/새로고침 멱등).
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCode, REVIEW_DISCOUNT_PERCENT, DISCOUNT_VALID_DAYS } from '@/lib/discount';

const JOB_TABLES: Record<string, { table: string; doneStatus: string[] }> = {
    saju: { table: 'premium_analysis_jobs', doneStatus: ['completed'] },
    tarot: { table: 'tarot_reading_jobs', doneStatus: ['done'] },
};

/** 후기 존재 여부 조회 — 보관함 재열람 시 이미 후기를 쓴 잡에는 폼을 숨기기 위함 */
export async function GET(req: Request) {
    const jobId = new URL(req.url).searchParams.get('jobId');
    if (!jobId) {
        return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
    }
    const { data: existing } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();
    return NextResponse.json({ success: true, reviewed: !!existing });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, service, rating, comment, marketingConsent } = body;

        const target = JOB_TABLES[service];
        if (!target || !jobId) {
            return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
        }
        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ success: false, error: '별점을 선택해 주세요.' }, { status: 400 });
        }

        // 1) 완료된 유료 잡인지 검증 — 아무 UUID로나 코드 발급받는 것을 차단
        const { data: job } = await supabaseAdmin
            .from(target.table)
            .select('id, status')
            .eq('id', jobId)
            .maybeSingle();
        if (!job || !target.doneStatus.includes(job.status)) {
            return NextResponse.json({ success: false, error: '후기를 남길 수 있는 결과가 없습니다.' }, { status: 404 });
        }

        // 2) 이미 후기가 있으면 기존 코드 반환 (멱등)
        const { data: existing } = await supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('job_id', jobId)
            .maybeSingle();
        if (existing) {
            const { data: prevCode } = await supabaseAdmin
                .from('discount_codes')
                .select('code, percent, expires_at, used_at')
                .eq('review_id', existing.id)
                .maybeSingle();
            return NextResponse.json({
                success: true,
                alreadyReviewed: true,
                code: prevCode && !prevCode.used_at ? prevCode.code : null,
                percent: prevCode?.percent ?? REVIEW_DISCOUNT_PERCENT,
                expiresAt: prevCode?.expires_at ?? null,
            });
        }

        // 3) 후기 저장
        const { data: review, error: reviewError } = await supabaseAdmin
            .from('reviews')
            .insert({
                job_id: jobId,
                service,
                rating: ratingNum,
                comment: typeof comment === 'string' ? comment.trim().slice(0, 500) || null : null,
                marketing_consent: marketingConsent === true,
            })
            .select('id')
            .single();
        if (reviewError || !review) {
            // UNIQUE 충돌(동시 제출) — 멱등 경로로 재안내
            console.error('[reviews] insert 실패:', reviewError);
            return NextResponse.json({ success: false, error: '잠시 후 다시 시도해 주세요.' }, { status: 500 });
        }

        // 4) 할인 코드 발급 (코드 충돌 시 재시도)
        const expiresAt = new Date(Date.now() + DISCOUNT_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();
        let code: string | null = null;
        for (let attempt = 0; attempt < 3 && !code; attempt++) {
            const candidate = generateCode();
            const { error } = await supabaseAdmin
                .from('discount_codes')
                .insert({ code: candidate, percent: REVIEW_DISCOUNT_PERCENT, review_id: review.id, expires_at: expiresAt });
            if (!error) code = candidate;
        }
        if (!code) {
            console.error('[reviews] 코드 발급 실패 (3회 충돌)');
            return NextResponse.json({ success: false, error: '코드 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            code,
            percent: REVIEW_DISCOUNT_PERCENT,
            expiresAt,
        });
    } catch (err) {
        console.error('[reviews] error:', err);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
