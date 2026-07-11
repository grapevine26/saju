"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle2, Clock, XCircle, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface Inquiry {
  id: string; name: string; email: string;
  message: string; status: string; created_at: string;
}
interface Props { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response> }

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "대기", color: "text-yellow-400", icon: Clock },
  replied: { label: "답변완료", color: "text-emerald-400", icon: CheckCircle2 },
  closed: { label: "종료", color: "text-slate-500", icon: XCircle },
};

export function InquiriesTab({ fetchWithAuth }: Props) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/inquiries${filter ? `?status=${filter}` : ""}`);
      const data = await res.json();
      if (data.success) setInquiries(data.inquiries);
      else setError(data.error || "문의를 불러오지 못했습니다.");
    } catch {
      setError("문의를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetchWithAuth("/api/admin/inquiries", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) { toast.success("처리했습니다."); load(); }
      else toast.error("처리 실패");
    } catch { toast.error("처리 실패"); }
  };

  const timeStr = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" /> 고객 문의
          <span className="text-[10px] text-slate-600 font-normal">고객이 support@dasisaju.com에 보낸 메일</span>
        </h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-transparent border border-white/[0.06] text-[11px] text-slate-400 rounded px-2 py-1 outline-none">
          <option value="">전체</option>
          <option value="pending">대기</option>
          <option value="replied">답변완료</option>
          <option value="closed">종료</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-600" /></div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mb-1">{error}</p>
          <p className="text-[10px] text-slate-600 mb-3">Supabase에 contact_inquiries 테이블이 있는지, Resend 인바운드 웹훅이 연결됐는지 확인하세요</p>
          <button onClick={load} className="text-xs text-indigo-400 hover:underline">다시 시도</button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Mail className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">문의가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {inquiries.map(inq => {
                const s = statusMap[inq.status] || statusMap.pending;
                const Icon = s.icon;
                const isOpen = expanded === inq.id;
                return (
                  <div key={inq.id} className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded(isOpen ? null : inq.id)}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-slate-200 truncate">{inq.name || "제목 없음"}</span>
                          <span className="text-[10px] text-indigo-400/80">{inq.email}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] ${s.color}`}>
                            <Icon className="w-3 h-3" />{s.label}
                          </span>
                        </div>
                        <p className={`text-xs text-slate-400 whitespace-pre-wrap ${isOpen ? "" : "line-clamp-2"}`}>{inq.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeStr(inq.created_at)} · {isOpen ? "접기" : "펼치기"}</p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={`mailto:${inq.email}`} title="답장"
                          className="text-[10px] px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors">
                          답장
                        </a>
                        {inq.status === "pending" && (
                          <button onClick={() => updateStatus(inq.id, "replied")}
                            className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            답변완료
                          </button>
                        )}
                        {inq.status !== "closed" && (
                          <button onClick={() => updateStatus(inq.id, "closed")}
                            className="text-[10px] px-2 py-1 rounded bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] transition-colors">
                            종료
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
