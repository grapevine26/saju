"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, AlertTriangle, Users, Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response> }

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");

const SERVICE_META = {
  reunion: { label: "재회 사주", color: "#f0607e" },
  tarot: { label: "타로", color: "#b07bb4" },
  compatibility: { label: "궁합", color: "#F5C842" },
} as const;

export function OverviewTab({ fetchWithAuth }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/admin/stats");
      const data = await res.json();
      if (data.success) setStats(data.stats);
      else setError(data.error || "통계를 불러오지 못했습니다.");
    } catch {
      setError("통계를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-slate-600" /></div>;
  if (error) return (
    <div className="text-center py-24">
      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
      <p className="text-sm text-slate-400 mb-4">{error}</p>
      <button onClick={load} className="text-xs text-indigo-400 hover:underline">다시 시도</button>
    </div>
  );
  if (!stats) return null;

  const { revenue, revenueByService, ordersByService, paidCount, status, free, dailyRevenue } = stats;
  const services = ["reunion", "tarot", "compatibility"] as const;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 상단 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="오늘 매출" value={won(revenue.today)} sub={`결제 ${paidCount.today}건`} accent />
        <Kpi label="이번 주" value={won(revenue.week)} />
        <Kpi label="이번 달" value={won(revenue.month)} />
        <Kpi label="누적 매출" value={won(revenue.total)} sub={`총 ${paidCount.total}건`} />
      </div>

      {/* 처리 상태 알림 */}
      {(status.failed > 0 || status.pending > 0 || status.processing > 0) && (
        <div className="flex flex-wrap gap-2">
          {status.failed > 0 && (
            <Badge tone="rose" icon={AlertTriangle}>실패 {status.failed}건 — 확인 필요</Badge>
          )}
          {status.processing > 0 && <Badge tone="amber">생성 중 {status.processing}건</Badge>}
          {status.pending > 0 && <Badge tone="slate">대기 {status.pending}건</Badge>}
        </div>
      )}

      {/* 서비스별 매출 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {services.map((s) => (
          <div key={s} className="rounded-xl border border-white/[0.06] bg-[#12172480] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: SERVICE_META[s].color }} />
              <span className="text-sm font-semibold text-white">{SERVICE_META[s].label}</span>
            </div>
            <p className="text-xl font-bold text-white">{won(revenueByService[s])}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              결제 {ordersByService[s]}건
            </p>
          </div>
        ))}
      </div>

      {/* 14일 매출 차트 (서비스 스택) */}
      <div className="rounded-xl border border-white/[0.06] bg-[#12172480] p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">최근 14일 매출</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dailyRevenue} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 10000 ? `${v / 10000}만` : v} width={36} />
            <Tooltip
              cursor={{ fill: "#ffffff08" }}
              contentStyle={{ background: "#0b0f19", border: "1px solid #ffffff14", borderRadius: 8, fontSize: 12 }}
              formatter={((v: any, name: any) => [won(Number(v)), SERVICE_META[name as keyof typeof SERVICE_META]?.label || name]) as any}
            />
            <Legend formatter={(v) => <span className="text-[11px] text-slate-400">{SERVICE_META[v as keyof typeof SERVICE_META]?.label || v}</span>} />
            {services.map((s) => (
              <Bar key={s} dataKey={s} stackId="rev" fill={SERVICE_META[s].color} radius={s === "compatibility" ? [3, 3, 0, 0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 무료 사용 / 전환 퍼널 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#12172480] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">무료 체험 → 결제 전환</h3>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[11px] text-slate-500">누적 무료 이용</p>
              <p className="text-lg font-bold text-white">{(free.total + free.tarot).toLocaleString()}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">사주/작명 {free.total.toLocaleString()} · 타로 {free.tarot.toLocaleString()}</p>
            </div>
            <div className="text-slate-600 text-lg pb-1">→</div>
            <div>
              <p className="text-[11px] text-slate-500">누적 결제</p>
              <p className="text-lg font-bold text-emerald-400">{paidCount.total.toLocaleString()}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] text-slate-500">전환율</p>
              <p className="text-lg font-bold text-white">
                {free.total + free.tarot > 0 ? ((paidCount.total / (free.total + free.tarot)) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#12172480] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">오늘</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[11px] text-slate-500">무료 이용</p><p className="text-lg font-bold text-white">{free.today}</p></div>
            <div><p className="text-[11px] text-slate-500">결제</p><p className="text-lg font-bold text-emerald-400">{paidCount.today}</p></div>
          </div>
        </div>
      </div>

      {/* UTM 유입 퍼널 (최근 30일) */}
      <div className="rounded-xl border border-white/[0.06] bg-[#12172480] p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">유입 채널 퍼널 (최근 30일)</h3>
        </div>
        <p className="text-[11px] text-slate-600 mb-3">
          UTM 링크 방문 → 무료 분석 → 결제. 무료/결제 행에는 UTM 없는 직접 유입도 포함됩니다.
        </p>
        {(!stats.utmFunnel || stats.utmFunnel.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            아직 기록된 유입이 없습니다. 인스타 프로필 링크에 UTM을 붙이면 여기에 집계됩니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-3 font-medium">소스</th>
                  <th className="text-left py-2 pr-3 font-medium">캠페인</th>
                  <th className="text-right py-2 pr-3 font-medium">방문</th>
                  <th className="text-right py-2 pr-3 font-medium">무료 분석</th>
                  <th className="text-right py-2 pr-3 font-medium">결제</th>
                  <th className="text-right py-2 font-medium">매출(정가)</th>
                </tr>
              </thead>
              <tbody>
                {stats.utmFunnel.map((row: any) => (
                  <tr key={`${row.source}|${row.campaign}`} className="border-b border-white/[0.04] text-slate-300">
                    <td className="py-2 pr-3 font-medium text-white">{row.source}</td>
                    <td className="py-2 pr-3 text-slate-400">{row.campaign}</td>
                    <td className="py-2 pr-3 text-right">{row.visits.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right">{row.free.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right text-emerald-400 font-semibold">{row.paid.toLocaleString()}</td>
                    <td className="py-2 text-right">{won(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-[#12172480]"}`}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${accent ? "text-emerald-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ children, tone, icon: Icon }: { children: React.ReactNode; tone: "rose" | "amber" | "slate"; icon?: any }) {
  const tones = {
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    slate: "border-white/10 bg-white/[0.04] text-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${tones[tone]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}{children}
    </span>
  );
}
