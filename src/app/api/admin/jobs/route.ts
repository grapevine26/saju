import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/adminAuth";
import { classifyPremiumJob, classifyTarotJob, AdminOrder } from "@/lib/adminOrders";

export const dynamic = "force-dynamic";

// 최근 주문을 두 테이블에서 이만큼씩 가져와 메모리에서 병합·필터·페이지네이션한다.
// (신규 서비스 규모에서는 충분하며, 서비스/상태/검색 필터를 테이블 경계 없이 일관 적용할 수 있다.)
const FETCH_CAP = 500;

// 통합 주문 목록 조회
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const service = searchParams.get("service"); // reunion | tarot | naming
  const status = searchParams.get("status"); // pending | processing | completed | failed
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    const [{ data: premiumRows, error: e1 }, { data: tarotRows, error: e2 }] = await Promise.all([
      supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id, status, created_at, raw_data, user_id")
        .order("created_at", { ascending: false })
        .limit(FETCH_CAP),
      supabaseAdmin
        .from("tarot_reading_jobs")
        .select("id, status, created_at, raw_data, user_id")
        .order("created_at", { ascending: false })
        .limit(FETCH_CAP),
    ]);
    if (e1 || e2) throw e1 || e2;

    let orders: AdminOrder[] = [
      ...(premiumRows || []).map(classifyPremiumJob),
      ...(tarotRows || []).map(classifyTarotJob),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    if (service) orders = orders.filter((o) => o.service === service);
    if (status) orders = orders.filter((o) => o.status === status);
    if (q) {
      orders = orders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          (o.customerEmail || "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      );
    }

    const total = orders.length;
    const start = (page - 1) * limit;
    const pageItems = orders.slice(start, start + limit).map((o) => ({
      ...o,
      // 이메일은 관리자에게만 노출되지만 마스킹해 로그/화면 노출 최소화
      customerEmail: o.customerEmail ? maskEmail(o.customerEmail) : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: pageItems,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      capped: (premiumRows?.length || 0) >= FETCH_CAP || (tarotRows?.length || 0) >= FETCH_CAP,
    });
  } catch (error: any) {
    console.error("[admin/jobs] 조회 실패:", error);
    return NextResponse.json({ success: false, error: "주문 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [id, domain] = email.split("@");
  if (!domain) return email;
  const head = id.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, id.length - 2))}@${domain}`;
}
