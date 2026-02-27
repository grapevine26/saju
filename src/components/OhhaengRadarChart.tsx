"use client";

import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

interface Pillar {
    ganOhhaeng: string;
    zhiOhhaeng: string;
}

interface OhhaengRadarChartProps {
    manseryeok: {
        year: Pillar;
        month: Pillar;
        day: Pillar;
        time: Pillar | null;
    };
}

export default function OhhaengRadarChart({ manseryeok }: OhhaengRadarChartProps) {
    // 1. 오행 개수 카운트
    const ohhaengCounts = {
        '목': 0, // 木
        '화': 0, // 火
        '토': 0, // 土
        '금': 0, // 金
        '수': 0, // 水
    };

    const pillars = [manseryeok.year, manseryeok.month, manseryeok.day, manseryeok.time].filter(Boolean) as Pillar[];

    pillars.forEach(p => {
        if (p.ganOhhaeng && ohhaengCounts[p.ganOhhaeng as keyof typeof ohhaengCounts] !== undefined) {
            ohhaengCounts[p.ganOhhaeng as keyof typeof ohhaengCounts]++;
        }
        if (p.zhiOhhaeng && ohhaengCounts[p.zhiOhhaeng as keyof typeof ohhaengCounts] !== undefined) {
            ohhaengCounts[p.zhiOhhaeng as keyof typeof ohhaengCounts]++;
        }
    });

    // 2. Recharts용 데이터 포맷으로 변환 및 색상 매핑
    const totalOhhaengCount = pillars.length * 2; // 보통 8글자 (시주 모르면 6글자)
    const getPercent = (count: number) => totalOhhaengCount > 0 ? Math.round((count / totalOhhaengCount) * 100) : 0;

    const data = [
        { name: '목(木)', value: ohhaengCounts['목'], percent: getPercent(ohhaengCounts['목']), color: '#86efac' }, // green-300
        { name: '화(火)', value: ohhaengCounts['화'], percent: getPercent(ohhaengCounts['화']), color: '#fda4af' }, // rose-300
        { name: '토(土)', value: ohhaengCounts['토'], percent: getPercent(ohhaengCounts['토']), color: '#fdba74' }, // orange-300
        { name: '금(金)', value: ohhaengCounts['금'], percent: getPercent(ohhaengCounts['금']), color: '#d1d5db' }, // gray-300
        { name: '수(水)', value: ohhaengCounts['수'], percent: getPercent(ohhaengCounts['수']), color: '#67e8f9' }, // cyan-300
    ];

    // 차트 크기를 동적으로 키우기 위해 최댓값 계산
    const maxCount = Math.max(...Object.values(ohhaengCounts));
    const domainMax = Math.max(4, maxCount); // 최소 기준점을 4로 두어 1, 2개일 때도 어느 정도 보이면서, 너무 꽉 차 보이지 않도록 함

    // 3. 차트 툴팁 커스텀 포맷
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 rounded-xl shadow-lg text-sm font-medium">
                    <p className="text-slate-800 mb-1">{data.name}</p>
                    <p className="text-purple-600">
                        {data.value}개 <span className="text-slate-400 text-xs font-normal">({Math.round((data.value / totalOhhaengCount) * 100)}%)</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // 커스텀 라벨 렌더러 (글자색상 차별화 + 퍼센트 표시)
    const renderCustomLabel = (props: any) => {
        const { payload, x, y, textAnchor } = props;
        const entry = data.find(d => d.name === payload.value);
        if (!entry) return null;

        // 중앙으로부터 좀 더 바깥쪽으로 밀어내기 위한 미세 조정
        const yOffset = y > 150 ? 10 : -10;

        return (
            <g>
                <text x={x} y={y + yOffset} textAnchor={textAnchor} fill={entry.color} fontSize={14} fontWeight={700}>
                    {entry.name}
                </text>
                <text x={x} y={y + yOffset + 18} textAnchor={textAnchor} fill="#64748b" fontSize={13} fontWeight={500}>
                    {entry.percent}%
                </text>
            </g>
        );
    };

    // 커스텀 도트 렌더러 (꼭짓점에 데이터별 색상 원 그리기)
    const renderCustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        const entry = data.find(d => d.name === payload.name);
        return (
            <circle
                key={`dot-${payload.name}`}
                cx={cx}
                cy={cy}
                r={4}
                stroke="#fff"
                strokeWidth={1.5}
                fill={entry ? entry.color : "#d8b4fe"}
            />
        );
    };

    return (
        <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
            <h3 className="text-center font-bold text-slate-800 text-lg mb-1">📊 나의 오행 분포도</h3>
            <p className="text-center text-xs text-slate-500 font-medium mb-6">
                사주 8글자 내 각 오행 기운의 비율입니다.
            </p>
            <div className="w-full max-w-[340px] h-[340px] -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis
                            dataKey="name"
                            tick={renderCustomLabel}
                        />
                        {/* 눈금선 숨기기, 동적 도메인 적용으로 그래프를 더 크게 보이게 수정 */}
                        <PolarRadiusAxis angle={30} domain={[0, Math.max(2, domainMax)]} tick={false} axisLine={false} />
                        <Radar
                            name="오행 비율"
                            dataKey="percent"
                            stroke="#c084fc" // 보라색 테두리
                            strokeWidth={2}
                            fill="#d8b4fe" // 연보라색 채움
                            fillOpacity={0.5}
                            isAnimationActive={true}
                            dot={renderCustomDot}
                        />
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
