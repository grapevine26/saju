import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import { verifyAdmin } from "@/lib/adminAuth";

// 분석 작업 목록 조회
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status"); // pending, processing, completed, failed
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from("premium_analysis_jobs")
      .select("id, status, phone_number, user_id, created_at, raw_data", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 전화번호 마스킹 및 필요한 정보만 추출
    const maskedJobs = (jobs || []).map((job: any) => ({
      id: job.id,
      status: job.status,
      phone: job.phone_number
        ? job.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-****-$3")
        : null,
      userId: job.user_id ? job.user_id.slice(0, 8) + "..." : null,
      packageId: job.raw_data?.packageId || "premium",
      myName: job.raw_data?.myRawInput?.name || "익명",
      partnerName: job.raw_data?.partnerRawInput?.name || "익명",
      createdAt: job.created_at,
    }));

    return NextResponse.json({
      success: true,
      jobs: maskedJobs,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}
