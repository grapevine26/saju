import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const { phoneNumber, userId, rawData, packageId } = await request.json();

    if ((!phoneNumber && !userId) || !rawData) {
      return NextResponse.json({ success: false, error: "연락처 또는 계정 정보, 분석 데이터가 누락되었습니다." }, { status: 400 });
    }

    const enhancedRawData = { ...rawData, packageId: packageId || 'basic' };


    // 1. Supabase에 대기 상태(pending)로 작업 생성
    const { data: job, error } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .insert({
        phone_number: phoneNumber || null,
        user_id: userId || null,
        status: "pending",
        raw_data: enhancedRawData
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
        phone_number: phoneNumber || undefined,
        user_id: userId || undefined,
        raw_data: enhancedRawData
      }

    });

    // 3. 클라이언트에 1초 만에 응답
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: userId 
        ? "분석이 시작되었습니다. 3분 후 기록에서 확인하세요!"
        : "분석 요청이 접수되었습니다. 완료 시 문자로 알려드립니다."
    });


  } catch (error) {
    console.error("Premium Analysis Start API 에러:", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
