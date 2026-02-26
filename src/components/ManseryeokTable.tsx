"use client";

import React from "react";

interface PillarData {
    gan?: string;
    ganHanja?: string;
    ganOhhaeng?: string;
    ganColor?: string;
    ganSipsin?: string;

    zhi?: string;
    zhiHanja?: string;
    zhiOhhaeng?: string;
    zhiColor?: string;
    zhiSipsin?: string;

    jijanggan?: string[];
    shibiUnsung?: string;
    shinsal?: string[];
    generalShinsal?: string[];
}

interface Props {
    data: {
        year: PillarData | null;
        month: PillarData | null;
        day: PillarData | null;
        time: PillarData | null;
    };
    userInfo?: {
        name: string;
        gender: "male" | "female" | string | null;
        calendarType: "solar" | "lunar" | string | null;
        birthDate: string;
        birthTime: string | null;
    };
}

export default function ManseryeokTable({ data, userInfo }: Props) {
    if (!data) return null;

    // 레퍼런스 이미지에 맞춰 좌측부터 시주, 일주, 월주, 연주 순서로 렌더링하도록 배열 구성
    const pillars = [
        { label: "시주", payload: data.time },
        { label: "일주", payload: data.day },
        { label: "월주", payload: data.month },
        { label: "연주", payload: data.year },
    ];

    const RowLabel = ({ text }: { text: string }) => (
        <div className="flex items-center justify-center border-r border-slate-100 bg-slate-50 h-full w-full py-1">
            <div className="flex flex-col items-center justify-center text-[10px] md:text-xs font-bold text-slate-400 leading-tight">
                {text.split('').map((char, i) => <span key={i}>{char}</span>)}
            </div>
        </div>
    );

    const gridClass = "grid grid-cols-[1.5rem_repeat(4,1fr)] md:grid-cols-[2rem_repeat(4,1fr)]";

    return (
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-6">
            <div className="bg-emerald-600 p-4 text-center text-white">
                <h3 className="font-bold text-lg mb-2 tracking-wide">{userInfo ? `${userInfo.name || '익명'}님의 사주해설` : '만세력'}</h3>
                {userInfo && (
                    <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-medium">
                        <span className="bg-black/15 px-2.5 py-1 rounded-full">{userInfo.birthDate}</span>
                        <span className="bg-black/15 px-2.5 py-1 rounded-full">{userInfo.calendarType === 'solar' ? '양력' : '음력'}</span>
                        <span className="bg-black/15 px-2.5 py-1 rounded-full">{userInfo.birthTime}</span>
                        <span className="bg-black/15 px-2.5 py-1 rounded-full">{userInfo.gender === 'male' ? '남성' : userInfo.gender === 'female' ? '여성' : userInfo.gender}</span>
                    </div>
                )}
            </div>

            {/* 4기둥 헤더 */}
            <div className={`${gridClass} bg-white border-b border-slate-200`}>
                <div className="border-r border-slate-100 bg-slate-50"></div>
                {pillars.map((p, idx) => (
                    <div key={idx} className="py-2 text-center text-sm font-bold text-slate-600 border-r last:border-0 border-slate-100">
                        {p.label}
                    </div>
                ))}
            </div>

            {/* 천간 영역 */}
            <div className={`${gridClass}`}>
                <RowLabel text="천간" />
                {pillars.map((p, idx) => {
                    const content = p.payload;
                    if (!content) {
                        return (
                            <div key={`gan-empty-${idx}`} className="h-28 bg-slate-50 border-r border-slate-100 flex items-center justify-center last:border-0">
                                <span className="text-slate-300 text-sm">모름</span>
                            </div>
                        );
                    }
                    return (
                        <div key={`gan-${idx}`} className={`h-28 flex flex-col items-center justify-center border-r border-white last:border-0 ${content.ganColor}`}>
                            <div className="text-3xl font-serif font-bold mb-1">{content.ganHanja}</div>
                            <div className="flex flex-col items-center text-xs opacity-90 font-medium">
                                <span>{content.gan}</span>
                                <span className="mt-1 opacity-80">{content.ganSipsin}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 지지 영역 */}
            <div className={`${gridClass} border-t-2 border-white`}>
                <RowLabel text="지지" />
                {pillars.map((p, idx) => {
                    const content = p.payload;
                    if (!content) {
                        return (
                            <div key={`zhi-empty-${idx}`} className="h-28 bg-slate-50 border-r border-slate-100 flex items-center justify-center last:border-0">
                                <span className="text-slate-300 text-sm">모름</span>
                            </div>
                        );
                    }
                    return (
                        <div key={`zhi-${idx}`} className={`h-28 flex flex-col items-center justify-center border-r border-white last:border-0 ${content.zhiColor}`}>
                            <div className="text-3xl font-serif font-bold mb-1">{content.zhiHanja}</div>
                            <div className="flex flex-col items-center text-xs opacity-90 font-medium">
                                <span>{content.zhi}</span>
                                <span className="mt-1 opacity-80">{content.zhiSipsin}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 부가 정보 - 지장간 */}
            <div className={`${gridClass} border-t border-slate-200 bg-white`}>
                <RowLabel text="지장간" />
                {pillars.map((p, idx) => {
                    const content = p.payload;
                    return (
                        <div key={`ji-${idx}`} className="py-2 px-1 text-center border-r border-slate-100 last:border-0 flex flex-col justify-center items-center min-h-[50px]">
                            {content?.jijanggan?.map((j, i) => (
                                <span key={i} className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">{j}</span>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* 부가 정보 - 십이운성 */}
            <div className={`${gridClass} border-t border-slate-200 bg-white`}>
                <RowLabel text="십이운성" />
                {pillars.map((p, idx) => (
                    <div key={`shibi-${idx}`} className="py-2 px-1 text-center border-r border-slate-100 last:border-0 flex items-center justify-center">
                        <span className="text-[11px] md:text-xs text-slate-600 font-semibold">{p.payload?.shibiUnsung || '-'}</span>
                    </div>
                ))}
            </div>

            {/* 부가 정보 - 십이신살 */}
            <div className={`${gridClass} border-t border-slate-200 bg-white`}>
                <RowLabel text="십이신살" />
                {pillars.map((p, idx) => (
                    <div key={`shinsal-${idx}`} className="py-2 px-1 text-center border-r border-slate-100 last:border-0 flex flex-col gap-1.5 items-center justify-center min-h-[50px]">
                        {p.payload?.shinsal && p.payload.shinsal.length > 0 ? (
                            p.payload.shinsal.map((s, i) => (
                                s === '-' ? (
                                    <span key={i} className="text-[10.5px] text-slate-300">-</span>
                                ) : (
                                    <span key={i} className="text-[10px] md:text-[11px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded leading-none whitespace-nowrap">
                                        {s}
                                    </span>
                                )
                            ))
                        ) : (
                            <span className="text-xs text-slate-300">-</span>
                        )}
                    </div>
                ))}
            </div>

            {/* 부가 정보 - 일반 신살 (길흉성) */}
            <div className={`${gridClass} border-t border-slate-200 bg-white`}>
                <RowLabel text="신살" />
                {pillars.map((p, idx) => (
                    <div key={`general-${idx}`} className="py-3 px-1 text-center border-r border-slate-100 last:border-0 flex flex-col gap-1 items-center min-h-[50px]">
                        {p.payload?.generalShinsal && p.payload.generalShinsal.length > 0 ? (
                            p.payload.generalShinsal.map((s, i) => (
                                <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded leading-tight whitespace-nowrap">
                                    {s}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-300">-</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
