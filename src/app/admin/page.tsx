"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, RefreshCw, LogOut, Shield, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { DashboardTab } from "./tabs/DashboardTab";
import { InquiriesTab } from "./tabs/InquiriesTab";
import { RevenueTab } from "./tabs/RevenueTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { supabase } from "@/lib/supabase";

const TABS = [
  { id: "dashboard", label: "대시보드", icon: "📊" },
  { id: "revenue", label: "매출 통계", icon: "💰" },
  { id: "inquiries", label: "고객 문의", icon: "📩" },
  { id: "settings", label: "사이트 설정", icon: "⚙️" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        toast.error(error?.message || "로그인 실패: 이메일이나 비밀번호를 확인해주세요.");
      } else {
        setToken(data.session.access_token);
        setIsAuthed(true);
        sessionStorage.setItem("admin_token", data.session.access_token);
        toast.success("인증 성공");
      }
    } catch {
      toast.error("인증 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthed(false);
    setToken("");
    setEmail("");
    setPassword("");
    sessionStorage.removeItem("admin_token");
  }, []);

  // 세션 복원 및 리스너 등록
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setToken(session.access_token);
        setIsAuthed(true);
        sessionStorage.setItem("admin_token", session.access_token);
      } else {
        setIsAuthed(false);
        setToken("");
        sessionStorage.removeItem("admin_token");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers as Record<string, string>, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.status === 401) { handleLogout(); throw new Error("Unauthorized"); }
    return res;
  }, [token, handleLogout]);

  // ── 로그인 ──
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-slate-200">Admin</h1>
          </div>
          <div className="space-y-3">
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full px-4 py-3 rounded-lg bg-[#151a2a] border border-white/[0.06] text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-colors"
              autoFocus
            />
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-lg bg-[#151a2a] border border-white/[0.06] text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-colors"
            />
            <button onClick={handleLogin} disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "로그인"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 대시보드 ──
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-300">
      <Toaster position="top-center" />

      {/* 헤더 */}
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0b0f19]/95 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">다시, 우리</span>
            <span className="text-[10px] text-slate-600 ml-1">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                }`}>
                <span className="mr-1.5">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { if (activeTab === "dashboard") window.location.reload(); }}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleLogout}
            className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-white/[0.05] transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="px-5 lg:px-8 py-5">
        {activeTab === "dashboard" && <DashboardTab fetchWithAuth={fetchWithAuth} />}
        {activeTab === "revenue" && <RevenueTab fetchWithAuth={fetchWithAuth} />}
        {activeTab === "inquiries" && <InquiriesTab fetchWithAuth={fetchWithAuth} />}
        {activeTab === "settings" && <SettingsTab fetchWithAuth={fetchWithAuth} />}
      </main>
    </div>
  );
}
