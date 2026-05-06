"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, DollarSign, Calendar, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface DailyRevenue {
  fullDate: string;
  date: string;
  premiumRevenue: number;
  signatureRevenue: number;
  totalRevenue: number;
  premiumCount: number;
  signatureCount: number;
  totalCount: number;
}

interface Stats {
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
    dailyRevenue: DailyRevenue[];
  };
}

interface Props {
  fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response>;
}

const fmt = (n: number) => n.toLocaleString();

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyRevenue;
    return (
      <div className="bg-[#151a2a] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-white font-bold mb-2">{data.fullDate}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-rose-400">Signature</span>
            <span className="font-medium text-white">{fmt(data.signatureRevenue)}원 ({data.signatureCount}건)</span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-amber-400">Premium</span>
            <span className="font-medium text-white">{fmt(data.premiumRevenue)}원 ({data.premiumCount}건)</span>
          </div>
          <div className="flex justify-between gap-4 text-sm font-bold pt-2 border-t border-white/10 mt-2">
            <span className="text-indigo-400">Total</span>
            <span className="text-white">{fmt(data.totalRevenue)}원</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueTab({ fetchWithAuth }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchWithAuth("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success) setStats(data.stats);
      })
      .catch((err) => console.error("Stats fetch error:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>매출 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-rose-400">
        <p>데이터를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const { revenue } = stats;

  return (
    <div className="space-y-6">
      
      {/* 매출 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "오늘 매출", value: revenue.today, icon: DollarSign, color: "text-emerald-400" },
          { label: "이번 주 매출", value: revenue.week, icon: TrendingUp, color: "text-blue-400" },
          { label: "이번 달 매출", value: revenue.month, icon: Calendar, color: "text-indigo-400" },
          { label: "누적 총 매출", value: revenue.total, icon: BarChart2, color: "text-purple-400" },
        ].map((card, i) => (
          <div key={i} className="bg-[#151a2a] border border-white/[0.06] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-white/[0.03] ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              {fmt(card.value)}<span className="text-sm font-medium text-slate-500 ml-1">원</span>
            </p>
          </div>
        ))}
      </div>

      {/* 매출 차트 */}
      <div className="bg-[#151a2a] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">최근 14일 매출 추이</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenue.dailyRevenue}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tickFormatter={(val) => `${val / 10000}만`} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#cbd5e1' }} />
              <Bar 
                dataKey="premiumRevenue" 
                name="Premium (재회사주)" 
                stackId="a" 
                fill="#fbbf24" 
                radius={[0, 0, 4, 4]} 
                maxBarSize={40}
              />
              <Bar 
                dataKey="signatureRevenue" 
                name="Signature (궁합포함)" 
                stackId="a" 
                fill="#fb7185" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 표 */}
      <div className="bg-[#151a2a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h3 className="text-md font-bold text-white">일자별 상세 내역</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-xs uppercase text-slate-500">
                <th className="px-5 py-3 font-semibold">날짜</th>
                <th className="px-5 py-3 font-semibold text-right">Premium 건수</th>
                <th className="px-5 py-3 font-semibold text-right">Signature 건수</th>
                <th className="px-5 py-3 font-semibold text-right">총 건수</th>
                <th className="px-5 py-3 font-semibold text-right">일매출 합계</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/[0.06]">
              {[...revenue.dailyRevenue].reverse().map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-300">{row.fullDate}</td>
                  <td className="px-5 py-4 text-right text-amber-400">{fmt(row.premiumCount)}건</td>
                  <td className="px-5 py-4 text-right text-rose-400">{fmt(row.signatureCount)}건</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-300">{fmt(row.totalCount)}건</td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-400">{fmt(row.totalRevenue)}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
