import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import { verifyAdmin } from "@/lib/adminAuth";

// 설정 조회
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  try {
    if (key) {
      const { data } = await supabaseAdmin
        .from("admin_settings")
        .select("value")
        .eq("key", key)
        .single();
      return NextResponse.json({ success: true, value: data?.value || null });
    }

    const { data } = await supabaseAdmin
      .from("admin_settings")
      .select("*");
    return NextResponse.json({ success: true, settings: data || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "조회 실패" }, { status: 500 });
  }
}

// 설정 저장
export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();
    const { error } = await supabaseAdmin
      .from("admin_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "저장 실패" }, { status: 500 });
  }
}
