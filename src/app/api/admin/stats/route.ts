import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import { verifyAdmin } from "@/lib/adminAuth";

// 통계 데이터 조회
export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 전체 작업 통계
    const { count: totalJobs } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true });

    // 오늘 생성된 작업
    const { count: todayJobs } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    // 상태별 카운트
    const { count: pendingCount } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: processingCount } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing");

    const { count: completedCount } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: failedCount } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // 패키지별 & 회원/비회원별 카운트 (전체 조회 후 집계)
    const { data: allJobs } = await supabaseAdmin
      .from("premium_analysis_jobs")
      .select("raw_data, created_at, user_id");

    let premiumCount = 0;
    let signatureCount = 0;
    let todayPremium = 0;
    let todaySignature = 0;
    
    let memberCount = 0;
    let guestCount = 0;

    (allJobs || []).forEach((job: any) => {
      // 패키지 집계
      const pkgId = job.raw_data?.packageId || "premium";
      if (pkgId === "signature") {
        signatureCount++;
        if (job.created_at >= todayStart) todaySignature++;
      } else {
        premiumCount++;
        if (job.created_at >= todayStart) todayPremium++;
      }

      // 회원/비회원 집계
      if (job.user_id) memberCount++;
      else guestCount++;
    });

    // 매출 계산 (premium: 13,900원, signature: 19,900원 기준)
    const totalRevenue = premiumCount * 13900 + signatureCount * 19900;
    const todayRevenue = todayPremium * 13900 + todaySignature * 19900;

    let weekPremium = 0;
    let weekSignature = 0;
    (allJobs || []).forEach((job: any) => {
      if (job.created_at >= weekStart) {
        const pkgId = job.raw_data?.packageId || "premium";
        if (pkgId === "signature") weekSignature++;
        else weekPremium++;
      }
    });
    const weekRevenue = weekPremium * 13900 + weekSignature * 19900;

    let monthPremium = 0;
    let monthSignature = 0;
    (allJobs || []).forEach((job: any) => {
      if (job.created_at >= monthStart) {
        const pkgId = job.raw_data?.packageId || "premium";
        if (pkgId === "signature") monthSignature++;
        else monthPremium++;
      }
    });
    const monthRevenue = monthPremium * 13900 + monthSignature * 19900;

    // 최근 14일 일별 매출 통계 (차트용)
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      // 한국 시간 기준으로 처리
      const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
      return kst.toISOString().split("T")[0]; // "YYYY-MM-DD"
    });

    const dailyRevenueMap: Record<string, { premiumRevenue: number, signatureRevenue: number, premiumCount: number, signatureCount: number }> = {};
    last14Days.forEach(date => {
      dailyRevenueMap[date] = { premiumRevenue: 0, signatureRevenue: 0, premiumCount: 0, signatureCount: 0 };
    });

    (allJobs || []).forEach((job: any) => {
      // UTC to KST
      const jobDateObj = new Date(new Date(job.created_at).getTime() + (9 * 60 * 60 * 1000));
      const jobDate = jobDateObj.toISOString().split("T")[0];
      
      if (dailyRevenueMap[jobDate]) {
        const pkgId = job.raw_data?.packageId || "premium";
        if (pkgId === "signature") {
          dailyRevenueMap[jobDate].signatureRevenue += 19900;
          dailyRevenueMap[jobDate].signatureCount += 1;
        } else {
          dailyRevenueMap[jobDate].premiumRevenue += 13900;
          dailyRevenueMap[jobDate].premiumCount += 1;
        }
      }
    });

    const dailyRevenue = last14Days.map(date => {
      const data = dailyRevenueMap[date];
      return {
        fullDate: date,
        date: date.substring(5), // "MM-DD"
        premiumRevenue: data.premiumRevenue,
        signatureRevenue: data.signatureRevenue,
        totalRevenue: data.premiumRevenue + data.signatureRevenue,
        premiumCount: data.premiumCount,
        signatureCount: data.signatureCount,
        totalCount: data.premiumCount + data.signatureCount
      };
    });

    // 라이트(무료) 분석 카운트 (api_usage_logs 활용)
    const { count: liteTotal } = await supabaseAdmin
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "lite_analysis");

    const { count: liteToday } = await supabaseAdmin
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "lite_analysis")
      .gte("created_at", todayStart);

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs: totalJobs || 0,
        todayJobs: todayJobs || 0,
        statusCounts: {
          pending: pendingCount || 0,
          processing: processingCount || 0,
          completed: completedCount || 0,
          failed: failedCount || 0,
        },
        packageCounts: {
          premium: premiumCount,
          signature: signatureCount,
        },
        userCounts: {
          member: memberCount,
          guest: guestCount,
        },
        liteCounts: {
          total: liteTotal || 0,
          today: liteToday || 0,
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          dailyRevenue // 14일치 차트 데이터 추가
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
