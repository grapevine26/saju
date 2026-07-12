import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/adminAuth";
import {
  classifyPremiumJob,
  classifyTarotJob,
  countsAsRevenue,
  AdminOrder,
  ServiceKey,
} from "@/lib/adminOrders";

export const dynamic = "force-dynamic";

const KST_OFFSET = 9 * 60 * 60 * 1000;
const kstDate = (iso: string) => new Date(new Date(iso).getTime() + KST_OFFSET).toISOString().split("T")[0];

// 통계 데이터 조회 (3개 서비스 통합)
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  try {
    // 두 테이블에서 집계에 필요한 최소 컬럼만 전량 조회 (개인정보 원문 제외)
    const [{ data: premiumRows, error: e1 }, { data: tarotRows, error: e2 }] = await Promise.all([
      supabaseAdmin.from("premium_analysis_jobs").select("id, status, created_at, raw_data, user_id"),
      supabaseAdmin.from("tarot_reading_jobs").select("id, status, created_at, raw_data, user_id"),
    ]);
    if (e1 || e2) throw e1 || e2;

    const orders: AdminOrder[] = [
      ...(premiumRows || []).map(classifyPremiumJob),
      ...(tarotRows || []).map(classifyTarotJob),
    ];

    // 기간 경계 (KST 기준 문자열 비교)
    const now = new Date(Date.now() + KST_OFFSET);
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6);
    const weekStr = weekAgo.toISOString().split("T")[0];
    const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const blankService = () => ({ reunion: 0, tarot: 0, naming: 0 } as Record<ServiceKey, number>);

    const revenue = { total: 0, today: 0, week: 0, month: 0 };
    const revenueByService = blankService();
    const ordersByService = blankService();
    const paidCount = { total: 0, today: 0 };
    const status = { pending: 0, processing: 0, completed: 0, failed: 0 };
    const freeIssueCount = { naming: 0 };

    for (const o of orders) {
      status[o.status]++;
      ordersByService[o.service]++;
      if (o.isFree) { freeIssueCount.naming++; continue; }

      const d = kstDate(o.createdAt);
      if (countsAsRevenue(o)) {
        revenue.total += o.price;
        revenueByService[o.service] += o.price;
        paidCount.total++;
        if (d === todayStr) { revenue.today += o.price; paidCount.today++; }
        if (d >= weekStr) revenue.week += o.price;
        if (d.startsWith(monthStr)) revenue.month += o.price;
      }
    }

    // 최근 14일 · 서비스별 일 매출 (스택 차트용)
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });
    const dayMap: Record<string, Record<ServiceKey, number>> = {};
    last14.forEach((d) => { dayMap[d] = blankService(); });
    for (const o of orders) {
      if (!countsAsRevenue(o)) continue;
      const d = kstDate(o.createdAt);
      if (dayMap[d]) dayMap[d][o.service] += o.price;
    }
    const dailyRevenue = last14.map((date) => ({
      date: date.substring(5),
      fullDate: date,
      reunion: dayMap[date].reunion,
      tarot: dayMap[date].tarot,
      naming: dayMap[date].naming,
      total: dayMap[date].reunion + dayMap[date].tarot + dayMap[date].naming,
    }));

    // 무료 사용량 (전환 퍼널 파악용)
    const freeActions = ["lite_analysis", "saju_analysis", "naming_report_free", "naming_lite"];
    const [freeTotalRes, freeTodayRes, tarotUsageRes] = await Promise.all([
      supabaseAdmin.from("api_usage_logs").select("*", { count: "exact", head: true }).in("action", freeActions),
      supabaseAdmin
        .from("api_usage_logs").select("*", { count: "exact", head: true })
        .in("action", freeActions)
        .gte("created_at", new Date(`${todayStr}T00:00:00+09:00`).toISOString()),
      supabaseAdmin.from("anon_tarot_usage").select("count"),
    ]);
    const freeTotal = freeTotalRes.count || 0;
    const freeToday = freeTodayRes.count || 0;
    const tarotFreeSum = (tarotUsageRes.data || []).reduce((a: number, r: any) => a + (r.count || 0), 0);

    // UTM 유입 퍼널 (최근 30일) — 소스·캠페인별 방문/무료/결제 집계
    // 테이블이 아직 없으면(마이그레이션 전) 빈 배열로 무시
    let utmFunnel: Array<{ source: string; campaign: string; visits: number; free: number; paid: number; revenue: number }> = [];
    try {
      const monthAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: events } = await supabaseAdmin
        .from("funnel_events")
        .select("event, utm_source, utm_campaign, amount")
        .gte("created_at", monthAgoIso);
      const byKey: Record<string, { source: string; campaign: string; visits: number; free: number; paid: number; revenue: number }> = {};
      for (const ev of events || []) {
        const source = ev.utm_source || "(직접 유입)";
        const campaign = ev.utm_campaign || "-";
        const key = `${source}|${campaign}`;
        if (!byKey[key]) byKey[key] = { source, campaign, visits: 0, free: 0, paid: 0, revenue: 0 };
        if (ev.event === "visit") byKey[key].visits++;
        else if (ev.event === "free") byKey[key].free++;
        else if (ev.event === "paid") { byKey[key].paid++; byKey[key].revenue += ev.amount || 0; }
      }
      utmFunnel = Object.values(byKey).sort((a, b) => b.paid - a.paid || b.free - a.free || b.visits - a.visits);
    } catch { /* funnel_events 미생성 시 무시 */ }

    return NextResponse.json({
      success: true,
      stats: {
        revenue,
        revenueByService,
        ordersByService,
        paidCount,
        status,
        freeIssueCount,
        dailyRevenue,
        free: {
          total: freeTotal,
          today: freeToday,
          tarot: tarotFreeSum,
        },
        needsAttention: status.failed + status.pending + status.processing,
        utmFunnel,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
