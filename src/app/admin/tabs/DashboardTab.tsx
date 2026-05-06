"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, Loader2, CheckCircle2, AlertTriangle, RotateCcw,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";

interface Job {
  id: string; status: string; phone: string | null; userId: string | null;
  packageId: string; myName: string; partnerName: string; createdAt: string;
}
interface Stats {
  totalJobs: number; todayJobs: number;
  statusCounts: { pending: number; processing: number; completed: number; failed: number };
  packageCounts: { premium: number; signature: number };
  liteCounts: { total: number; today: number };
  userCounts: { member: number; guest: number };
  revenue: { total: number; today: number; week: number; month: number };
}
interface Props { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response> }

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-400", processing: "bg-blue-400 animate-pulse",
    completed: "bg-emerald-400", failed: "bg-rose-400",
  };
  return <span className={`w-2 h-2 rounded-full inline-block ${colors[status] || colors.pending}`} />;
};

const PkgLabel = ({ id }: { id: string }) => (
  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
    id === "signature" ? "text-rose-400 bg-rose-500/10" : "text-amber-400 bg-amber-500/10"
  }`}>{id === "signature" ? "Signature" : "Premium"}</span>
);

const fmt = (n: number) => n.toLocaleString();

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "방금";
  if (diff < 60) return `${diff}분`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
};

export function DashboardTab({ fetchWithAuth }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [sRes, jRes] = await Promise.all([
        fetchWithAuth("/api/admin/stats"),
        fetchWithAuth(`/api/admin/jobs?page=${page}&limit=20${filter ? `&status=${filter}` : ""}`),
      ]);
      const sData = await sRes.json();
      const jData = await jRes.json();
      if (sData.success) setStats(sData.stats);
      if (jData.success) { setJobs(jData.jobs); setTotal(jData.total); setTotalPages(jData.totalPages); }
    } catch { /* handled by fetchWithAuth */ }
  }, [fetchWithAuth, page, filter]);

  useEffect(() => { load(); }, [load]);

  const retry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const res = await fetchWithAuth("/api/admin/jobs/retry", { method: "POST", body: JSON.stringify({ jobId }) });
      const d = await res.json();
      if (d.success) load();
    } catch { /* */ }
    setRetrying(null);
  };

  return (
    <div className="space-y-4">
      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "오늘 매출", value: `${fmt(stats.revenue.today)}원`, sub: `누적 ${fmt(stats.revenue.total)}원`, color: "text-emerald-400" },
            { label: "결제 전환율", value: `${(stats.totalJobs + stats.liteCounts.total) > 0 ? ((stats.totalJobs / (stats.totalJobs + stats.liteCounts.total)) * 100).toFixed(1) : 0}%`, sub: `무료 ${stats.liteCounts.total}건 · 유료 ${stats.totalJobs}건`, color: "text-indigo-400" },
            { label: "무료 분석 (Lite)", value: `${fmt(stats.liteCounts.today)}건`, sub: `누적 ${fmt(stats.liteCounts.total)}건`, color: "text-slate-300" },
            { label: "유료 결제 유형", value: `${fmt(stats.totalJobs)}건`, sub: `회원 ${stats.userCounts.member}건 · 비회원 ${stats.userCounts.guest}건`, color: "text-indigo-400" },
            { label: "Premium", value: `${fmt(stats.packageCounts.premium)}건`, sub: "재회사주", color: "text-amber-400" },
            { label: "Signature", value: `${fmt(stats.packageCounts.signature)}건`, sub: "재회사주+궁합", color: "text-rose-400" },
            { label: "오류 (실패)", value: `${fmt(stats.statusCounts.failed)}건`, sub: "수동 재시도 필요", color: "text-rose-500" },
            { label: "진행 현황", value: `${fmt(stats.statusCounts.processing)}건`, sub: `대기 ${stats.statusCounts.pending}건`, color: "text-blue-400" },
          ].map(c => (
            <div key={c.label} className="bg-[#111627] rounded-lg border border-white/[0.04] p-3">
              <p className="text-[11px] text-slate-500 mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-[#111627] rounded-lg border border-white/[0.04] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">작업 목록 <span className="text-slate-600">({total})</span></span>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-slate-600" />
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
              className="bg-transparent border border-white/[0.06] text-[11px] text-slate-400 rounded px-2 py-1 outline-none">
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="processing">분석중</option>
              <option value="completed">완료</option>
              <option value="failed">실패</option>
            </select>
          </div>
        </div>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[11px] text-slate-600 border-b border-white/[0.03]">
                {["상태","패키지","분석 대상","연락처","시간","ID",""].map(h => (
                  <th key={h} className="text-left font-medium px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-2.5"><StatusDot status={j.status} /> <span className="ml-1.5 text-slate-400">{
                    { pending: "대기", processing: "분석중", completed: "완료", failed: "실패" }[j.status]
                  }</span></td>
                  <td className="px-4 py-2.5"><PkgLabel id={j.packageId} /></td>
                  <td className="px-4 py-2.5 text-slate-300">{j.myName} <span className="text-slate-700">×</span> {j.partnerName}</td>
                  <td className="px-4 py-2.5 text-slate-500 font-mono">{j.phone || j.userId || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{timeAgo(j.createdAt)}</td>
                  <td className="px-4 py-2.5 text-slate-700 font-mono">{j.id.slice(0, 8)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {(j.status === "failed" || j.status === "pending") && (
                      <button onClick={() => retry(j.id)} disabled={retrying === j.id}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-medium disabled:opacity-40 flex items-center gap-1 ml-auto">
                        {retrying === j.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}재시도
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">데이터 없음</td></tr>}
            </tbody>
          </table>
        </div>

        {/* 모바일 */}
        <div className="md:hidden divide-y divide-white/[0.02]">
          {jobs.map(j => (
            <div key={j.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={j.status} />
                <div>
                  <p className="text-xs text-slate-300">{j.myName} × {j.partnerName}</p>
                  <p className="text-[10px] text-slate-600">{timeAgo(j.createdAt)} · <PkgLabel id={j.packageId} /></p>
                </div>
              </div>
              {(j.status === "failed" || j.status === "pending") && (
                <button onClick={() => retry(j.id)} className="text-[10px] text-rose-400"><RotateCcw className="w-3 h-3" /></button>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-2 border-t border-white/[0.03] flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
