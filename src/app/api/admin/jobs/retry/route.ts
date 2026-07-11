import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";
import { verifyAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// 실패/멈춘 작업 재실행 — 서비스별로 올바른 Inngest 이벤트를 발송한다.
// (예전엔 무조건 재회 이벤트를 쏴서 작명·타로 재시도가 엉뚱한 함수를 실행했음)
export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  try {
    const { jobId, source } = await req.json();
    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId가 누락되었습니다." }, { status: 400 });
    }

    // source(premium|tarot)가 오면 해당 테이블만, 없으면 두 테이블에서 탐색
    if (source === "tarot" || source === undefined) {
      const { data: tarot } = await supabaseAdmin
        .from("tarot_reading_jobs").select("*").eq("id", jobId).maybeSingle();
      if (tarot) {
        await supabaseAdmin.from("tarot_reading_jobs").update({ status: "pending" }).eq("id", jobId);
        await inngest.send({
          name: "tarot.reading.requested",
          data: {
            jobId: tarot.id,
            input: tarot.raw_data?.input,
            rounds: tarot.raw_data?.rounds,
            freeResult: tarot.raw_data?.freeResult,
            paymentKey: tarot.raw_data?.paymentKey || tarot.payment_key,
            customerEmail: tarot.raw_data?.customerEmail,
          },
        });
        return NextResponse.json({ success: true, message: "타로 작업을 재실행했습니다." });
      }
      if (source === "tarot") {
        return NextResponse.json({ success: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const { data: job } = await supabaseAdmin
      .from("premium_analysis_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job) {
      return NextResponse.json({ success: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    await supabaseAdmin.from("premium_analysis_jobs").update({ status: "pending" }).eq("id", jobId);

    const isNaming = job.raw_data?.service === "naming";
    await inngest.send({
      name: isNaming ? "naming.premium.requested" : "analysis.premium.requested",
      data: {
        jobId: job.id,
        phone_number: job.phone_number || undefined,
        user_id: job.user_id || undefined,
        customerEmail: job.raw_data?.customerEmail || undefined,
        raw_data: job.raw_data,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${isNaming ? "작명" : "재회"} 작업을 재실행했습니다.`,
    });
  } catch (error) {
    console.error("[admin/jobs/retry] 실패:", error);
    return NextResponse.json({ success: false, error: "재실행 중 오류가 발생했습니다." }, { status: 500 });
  }
}
