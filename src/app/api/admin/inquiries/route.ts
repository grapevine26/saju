import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import { verifyAdmin } from "@/lib/adminAuth";

// 문의 목록 조회
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    let query = supabaseAdmin
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, inquiries: data || [] });
  } catch (error) {
    // DB 오류를 빈 목록(success)으로 위장하지 않는다 — 관리자가 장애를 인지할 수 있도록 실패로 반환
    console.error("[admin/inquiries] 조회 실패:", error);
    return NextResponse.json({ success: false, error: "문의 목록을 불러오지 못했습니다.", inquiries: [] }, { status: 500 });
  }
}

// 문의 상태 업데이트
export async function PATCH(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    const { error } = await supabaseAdmin
      .from("contact_inquiries")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "업데이트 실패" }, { status: 500 });
  }
}
