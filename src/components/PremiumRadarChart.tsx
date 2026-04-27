import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarData {
    communication: number;
    affection: number;
    intimacy: number;
    future: number;
    conflict: number;
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
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="우리 궁합"
                            dataKey="A"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            fill="#F59E0B"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 w-full text-center">
                <p className="text-[14px] text-amber-400 font-bold leading-relaxed break-keep">
                    {data.summary}
                </p>
            </div>
        </div>
    );
}
