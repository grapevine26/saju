"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RotateCw, Search, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  id: string;
  source: "premium" | "tarot";
  service: "reunion" | "tarot" | "compatibility";
  serviceLabel: string;
  plan: string;
  price: number;
  status: "pending" | "processing" | "completed" | "failed";
  isFree: boolean;
  paymentSource: "toss" | "dev" | "free_pass" | "zero_won_coupon";
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
}
interface Props { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response> }

const SERVICE_TABS = [
  { id: "", label: "전체" },
  { id: "reunion", label: "재회" },
  { id: "tarot", label: "타로" },
  { id: "compatibility", label: "궁합" },
];
const STATUS_TABS = [
  { id: "", label: "전체" },
  { id: "failed", label: "실패" },
  { id: "pending", label: "대기" },
  { id: "processing", label: "생성중" },
  { id: "completed", label: "완료" },
];

const SERVICE_DOT: Record<string, string> = { reunion: "#f0607e", tarot: "#b07bb4", compatibility: "#F5C842" };
const STATUS_STYLE: Record<string, string> = {
  completed: "text-emerald-400 bg-emerald-400/10",
  processing: "text-amber-400 bg-amber-400/10",
  pending: "text-slate-400 bg-white/[0.05]",
  failed: "text-rose-400 bg-rose-400/10",
};
const STATUS_LABEL: Record<string, string> = { completed: "완료", processing: "생성중", pending: "대기", failed: "실패" };
const PAYMENT_SOURCE_LABEL: Record<string, string> = { dev: "개발모드", free_pass: "프리패스", zero_won_coupon: "0원쿠폰" };

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const resultPath = (o: Order) =>
  o.service === "tarot" ? `/tarot/result/${o.id}` : o.service === "compatibility" ? `/hap/result/${o.id}` : `/result/${o.id}`;

export function OrdersTab({ fetchWithAuth }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (service) params.set("service", service);
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      const res = await fetchWithAuth(`/api/admin/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.jobs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else setError(data.error || "불러오지 못했습니다.");
    } catch {
      setError("불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, service, status, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [service, status, q]);

  const retry = async (o: Order) => {
    setRetrying(o.id);
    try {
      const res = await fetchWithAuth("/api/admin/jobs/retry", {
        method: "POST",
        body: JSON.stringify({ jobId: o.id, source: o.source }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message || "재실행했습니다."); setTimeout(load, 800); }
      else toast.error(data.error || "재실행 실패");
    } catch {
      toast.error("재실행 실패");
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-4">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2">
        <TabGroup tabs={SERVICE_TABS} active={service} onChange={setService} />
        <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
        <TabGroup tabs={STATUS_TABS} active={status} onChange={setStatus} />
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQ(queryInput.trim())}
            placeholder="이름·이메일·ID"
            className="w-44 pl-8 pr-3 py-1.5 rounded-lg bg-[#151a2a] border border-white/[0.06] text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-600">총 {total.toLocaleString()}건</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-600" /></div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mb-3">{error}</p>
          <button onClick={load} className="text-xs text-indigo-400 hover:underline">다시 시도</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-sm text-slate-600">해당하는 주문이 없습니다.</div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-600 bg-white/[0.02]">
                <th className="px-4 py-2.5 font-medium">서비스</th>
                <th className="px-4 py-2.5 font-medium">고객</th>
                <th className="px-4 py-2.5 font-medium">금액</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5 font-medium">일시</th>
                <th className="px-4 py-2.5 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {orders.map((o) => (
                <tr key={`${o.source}-${o.id}`} className="text-xs hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SERVICE_DOT[o.service] }} />
                      <span className="text-slate-300">{o.serviceLabel}</span>
                      <span className="text-[10px] text-slate-600">{o.plan}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200">{o.customerName}</p>
                    {o.customerEmail && <p className="text-[10px] text-slate-600">{o.customerEmail}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {o.isFree ? <span className="text-slate-600">무료</span> : won(o.price)}
                    {PAYMENT_SOURCE_LABEL[o.paymentSource] && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-medium text-amber-400 bg-amber-400/10" title="매출 집계에서 제외됨">
                        {PAYMENT_SOURCE_LABEL[o.paymentSource]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(o.status === "failed" || o.status === "pending") && (
                        <button
                          onClick={() => retry(o)}
                          disabled={retrying === o.id}
                          title="재실행"
                          className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-white/[0.05] disabled:opacity-40"
                        >
                          {retrying === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {o.status === "completed" && (
                        <a
                          href={resultPath(o)} target="_blank" rel="noreferrer"
                          title="결과 보기"
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-1.5 rounded-md text-slate-500 hover:bg-white/[0.05] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-1.5 rounded-md text-slate-500 hover:bg-white/[0.05] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function TabGroup({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            active === t.id ? "bg-white/[0.1] text-white" : "text-slate-500 hover:text-slate-300"
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
