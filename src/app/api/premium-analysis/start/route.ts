import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const { phoneNumber, rawData } = await request.json();

    if (!phoneNumber || !rawData) {
      return NextResponse.json({ success: false, error: "전화번호 또는 분석 데이터가 누락되었습니다." }, { status: 400 });
    }

    // 1. Supabase에 대기 상태(pending)로 작업 생성
    const { data: job, error } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .insert({
        phone_number: phoneNumber,
        status: "pending",
        raw_data: rawData
      })
      .select()
      .single();

    if (error || !job) {
      console.error("Supabase 작업 생성 실패:", error);
      return NextResponse.json({ success: false, error: "작업을 생성하지 못했습니다." }, { status: 500 });
    }

    // 2. Inngest 이벤트 전송 (백그라운드 처리 시작)
    await inngest.send({
      name: "analysis.premium.requested",
      data: {
        jobId: job.id,
        phone_number: phoneNumber,
        raw_data: rawData
      }
    });

    // 3. 클라이언트에 1초 만에 응답
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "분석 요청이 접수되었습니다. 완료 시 문자로 알려드립니다."
    });

  } catch (error) {
    console.error("Premium Analysis Start API 에러:", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
