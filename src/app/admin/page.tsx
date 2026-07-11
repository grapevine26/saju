"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut, Shield, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { OverviewTab } from "./tabs/OverviewTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { InquiriesTab } from "./tabs/InquiriesTab";
import { supabase } from "@/lib/supabase";

const TABS = [
  { id: "overview", label: "개요", icon: "📊" },
  { id: "orders", label: "주문", icon: "🧾" },
  { id: "inquiries", label: "문의", icon: "📩" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    return () => subscription.unsubscribe();
  }, []);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.status === 401) {
      handleLogout();
      toast.error("접근 권한이 없습니다. (관리자 계정만 가능)");
      throw new Error("Unauthorized");
    }
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
            <h1 className="text-lg font-bold text-slate-200">묘연 Admin</h1>
            <p className="text-[11px] text-slate-600 mt-1">관리자 계정으로 로그인</p>
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
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0b0f19]/95 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">묘연</span>
            <span className="text-[10px] text-slate-600">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                }`}>
                <span className="mr-1.5">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout}
          className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-white/[0.05] transition-colors" title="로그아웃">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </header>

      <main className="px-5 lg:px-8 py-6">
        {activeTab === "overview" && <OverviewTab fetchWithAuth={fetchWithAuth} />}
        {activeTab === "orders" && <OrdersTab fetchWithAuth={fetchWithAuth} />}
        {activeTab === "inquiries" && <InquiriesTab fetchWithAuth={fetchWithAuth} />}
      </main>
    </div>
  );
}
