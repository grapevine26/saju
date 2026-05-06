"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Inquiry {
  id: string; name: string; email: string; phone: string;
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

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/admin/inquiries${filter ? `?status=${filter}` : ""}`);
      const data = await res.json();
      if (data.success) setInquiries(data.inquiries);
    } catch { /* */ }
  }, [fetchWithAuth, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetchWithAuth("/api/admin/inquiries", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      load();
    } catch { /* */ }
  };

  const timeStr = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" /> 고객 문의
        </h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-transparent border border-white/[0.06] text-[11px] text-slate-400 rounded px-2 py-1 outline-none">
          <option value="">전체</option>
          <option value="pending">대기</option>
          <option value="replied">답변완료</option>
          <option value="closed">종료</option>
        </select>
      </div>

      <div className="bg-[#111627] rounded-lg border border-white/[0.04] overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Mail className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-600">문의가 없습니다</p>
            <p className="text-[10px] text-slate-700 mt-1">Supabase에 contact_inquiries 테이블이 있는지 확인하세요</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {inquiries.map(inq => {
              const s = statusMap[inq.status] || statusMap.pending;
              const Icon = s.icon;
              return (
                <div key={inq.id} className="px-4 py-3 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-200">{inq.name || "익명"}</span>
                        <span className="text-[10px] text-slate-600">{inq.email}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] ${s.color}`}>
                          <Icon className="w-3 h-3" />{s.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{inq.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{timeStr(inq.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
    </div>
  );
}
