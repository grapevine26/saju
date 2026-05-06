"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response> }

export function SettingsTab({ fetchWithAuth }: Props) {
  const [landing, setLanding] = useState({ analysisCount: 12845, accuracyRate: 87, satisfactionRate: 94 });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/admin/settings?key=landing_stats");
      const data = await res.json();
      if (data.success && data.value) setLanding(data.value);
    } catch { /* 테이블 없으면 기본값 사용 */ }
    setLoaded(true);
  }, [fetchWithAuth]);

  useEffect(() => { load(); }, [load]);

  const saveLanding = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key: "landing_stats", value: landing }),
      });
      const data = await res.json();
      if (data.success) toast.success("저장 완료");
      else toast.error("저장 실패");
    } catch {
      toast.error("저장 중 오류");
    }
    setSaving(false);
  };

  if (!loaded) return <div className="text-center py-12 text-xs text-slate-600">로딩중...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 랜딩 페이지 수치 */}
      <div>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-indigo-400" /> 랜딩 페이지 수치
        </h2>
        <div className="bg-[#111627] rounded-lg border border-white/[0.04] p-4 space-y-4">
          <p className="text-[11px] text-slate-500">랜딩 페이지에 표시되는 수치를 수정합니다. 저장 후 페이지를 새로고침하면 반영됩니다.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">누적 분석 건수</label>
              <input type="number" value={landing.analysisCount}
                onChange={e => setLanding(p => ({ ...p, analysisCount: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md bg-[#0b0f19] border border-white/[0.06] text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">적중률 (%)</label>
              <input type="number" value={landing.accuracyRate}
                onChange={e => setLanding(p => ({ ...p, accuracyRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md bg-[#0b0f19] border border-white/[0.06] text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">만족도 (%)</label>
              <input type="number" value={landing.satisfactionRate}
                onChange={e => setLanding(p => ({ ...p, satisfactionRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md bg-[#0b0f19] border border-white/[0.06] text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveLanding} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-[#111627] rounded-lg border border-white/[0.04] p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-2">💡 사용 가이드</h3>
        <ul className="text-[11px] text-slate-500 space-y-1.5">
          <li>• <strong className="text-slate-400">누적 분석 건수</strong>: 랜딩 페이지 "실시간 분석 현황" 카운터에 표시됩니다.</li>
          <li>• <strong className="text-slate-400">적중률</strong>: "재회 전략 적중률 87%" 부분에 반영됩니다.</li>
          <li>• <strong className="text-slate-400">만족도</strong>: 소셜 프루프 섹션의 만족도 수치에 반영됩니다.</li>
          <li>• 설정은 Supabase <code className="text-indigo-400">admin_settings</code> 테이블에 저장됩니다.</li>
          <li>• 테이블이 없으면 <code className="text-indigo-400">supabase/admin_tables.sql</code>을 실행하세요.</li>
        </ul>
      </div>
    </div>
  );
}
