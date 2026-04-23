import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ success: false, error: "jobId가 누락되었습니다." }, { status: 400 });
    }

    try {
        const { data: job, error } = await supabaseAdmin
            .from("premium_analysis_jobs")
            .select("status")
            .eq("id", jobId)
            .single();

        if (error || !job) {
            return NextResponse.json({ success: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json({ success: true, status: job.status });
    } catch (error) {
        console.error("Job Status API 에러:", error);
        return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
