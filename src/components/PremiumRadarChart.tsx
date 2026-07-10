import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarData {
    communication: number;
    affection: number;
    intimacy: number;
    future: number;
    conflict: number;
    subtitle?: string;
    summary: string;
}

export default function PremiumRadarChart({ data }: { data: RadarData }) {
    const chartData = [
        { subject: '소통', A: data.communication, fullMark: 100 },
        { subject: '애정표현', A: data.affection, fullMark: 100 },
        { subject: '갈등 회복력', A: data.conflict, fullMark: 100 },
        { subject: '미래 안정성', A: data.future, fullMark: 100 },
        { subject: '속궁합', A: data.intimacy, fullMark: 100 },
    ];

    return (
        <div className="glass-card p-6 flex flex-col items-center">
            <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="rgba(240,234,235,0.13)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'rgba(240,234,235,0.7)', fontSize: 13, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0A090C', border: '1px solid rgba(240,234,235,0.13)', borderRadius: '12px', color: '#F0EAEB' }}
                            itemStyle={{ color: '#D8485E', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value}점`, '점수']}
                        />
                        <Radar
                            name="우리 궁합"
                            dataKey="A"
                            stroke="#F06A7E"
                            strokeWidth={2}
                            fill="#D8485E"
                            fillOpacity={0.3}
                            label={{ position: 'outside', fill: '#F06A7E', fontSize: 12, fontWeight: 'bold', formatter: (val: any) => `${val}점` }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-5 bg-[var(--bg-glass)] rounded-xl border border-[var(--border-glass)] w-full text-center">
                {data.subtitle && (
                    <div className="mb-3 pb-3 border-b border-[var(--line-soft)]">
                        <span className="text-[15px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F06A7E] to-[#D8485E]">
                            ✨ {data.subtitle}
                        </span>
                    </div>
                )}
                <p className="text-[14px] text-[var(--text-secondary)] font-medium leading-[1.8] break-keep text-left">
                    {data.summary}
                </p>
            </div>
        </div>
    );
}
