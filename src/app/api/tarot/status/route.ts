import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ success: false, error: 'jobId 누락' }, { status: 400 });

    const { data: job, error } = await supabaseAdmin
        .from('tarot_reading_jobs')
        .select('status, ai_result')
        .eq('id', jobId)
        .single();

    if (error || !job) return NextResponse.json({ success: false, error: '결과를 찾을 수 없습니다.' }, { status: 404 });

    return NextResponse.json({
        success: true,
        status: job.status,
        ...(job.status === 'done' && job.ai_result ? { aiResult: job.ai_result } : {}),
    });
}
