import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

export const dynamic = "force-dynamic";

import { verifyAdmin } from "@/lib/adminAuth";

// 실패한 작업 재실행
export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId가 누락되었습니다." }, { status: 400 });
    }

    // 작업 정보 조회
    const { data: job, error } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ success: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    // 상태를 pending으로 리셋
    await supabaseAdmin
      .from("premium_analysis_jobs")
      .update({ status: "pending" })
      .eq("id", jobId);

    // Inngest 이벤트 재전송
    await inngest.send({
      name: "analysis.premium.requested",
      data: {
        jobId: job.id,
        phone_number: job.phone_number || undefined,
        user_id: job.user_id || undefined,
        raw_data: job.raw_data,
      },
    });

    return NextResponse.json({ success: true, message: "작업이 재실행되었습니다." });
  } catch (error) {
    return NextResponse.json({ success: false, error: "재실행 중 오류가 발생했습니다." }, { status: 500 });
  }
}
