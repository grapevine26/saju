import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { redispatchIfNeeded } from "@/lib/jobDispatch";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ success: false, error: "jobId가 누락되었습니다." }, { status: 400 });
    }

    try {
        const { data: job, error } = await supabaseAdmin
            .from("premium_analysis_jobs")
            .select("id, status, ai_result, raw_data, phone_number, user_id")
            .eq("id", jobId)
            .single();

        if (error || !job) {
            return NextResponse.json({ success: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
        }

        // 결제 승인 시 이벤트 발송이 유실된 잡(dispatch_failed)은 폴링 시점에 자동 재발송
        await redispatchIfNeeded("premium_analysis_jobs", job);

        // 완료된 작업이면 ai_result도 함께 반환
        return NextResponse.json({
            success: true,
            status: job.status,
            ...(job.status === 'completed' && job.ai_result ? { aiResult: job.ai_result } : {})
        });
    } catch (error) {
        console.error("Job Status API 에러:", error);
        return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
