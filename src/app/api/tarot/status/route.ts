import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { redispatchIfNeeded } from '@/lib/jobDispatch';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ success: false, error: 'jobId 누락' }, { status: 400 });

    const { data: job, error } = await supabaseAdmin
        .from('tarot_reading_jobs')
        .select('id, status, ai_result, raw_data, payment_key')
        .eq('id', jobId)
        .single();

    if (error || !job) return NextResponse.json({ success: false, error: '결과를 찾을 수 없습니다.' }, { status: 404 });

    // 결제 승인 시 이벤트 발송이 유실된 잡(dispatch_failed)은 폴링 시점에 자동 재발송
    await redispatchIfNeeded('tarot_reading_jobs', job);

    return NextResponse.json({
        success: true,
        status: job.status,
        ...(job.status === 'done' && job.ai_result ? { aiResult: job.ai_result } : {}),
    });
}
