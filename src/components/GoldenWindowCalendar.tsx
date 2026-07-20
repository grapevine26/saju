"use client";

import { motion } from "framer-motion";
import { CalendarHeart } from "lucide-react";

export interface GoldenWindowMonth {
    month: string;
    goodDates: number[];
    badDates: number[];
    /** 각 길일의 일진·선정 근거 (결정론 계산 산출물 — 구버전 데이터에는 없을 수 있음) */
    dateDetails?: { day: number; ganzhi: string; reasons: string[] }[];
}

/** "일간 정임합: 상대방의 마음이 열리는 시기" → 기술 접두어를 떼고 사람 말만 남긴다 */
const humanizeReason = (r: string): string => {
    const i = r.indexOf(':');
    return (i >= 0 ? r.slice(i + 1) : r).replace(/\s*\((주의|자제 필요)\)\s*$/, '').trim();
};

interface Props {
    months: GoldenWindowMonth[];
}

export default function GoldenWindowCalendar({ months }: Props) {
    if (!months || months.length === 0) return null;

    const daysInMonth = 31;

    const getEmptySlots = (monthStr: string) => {
        const num = (monthStr.length + monthStr.charCodeAt(0)) % 4;
        return [...Array(num)];
    };

    return (
        <div className="mt-10 mb-8 space-y-6">
            <h3 className="text-[17px] font-black text-[var(--text-primary)] flex items-center gap-2 mb-4 px-1">
                <CalendarHeart className="w-5 h-5 text-[var(--accent-gold)]" /> 연락 최적기 캘린더
            </h3>

            {months.map((data, idx) => {
                // 최적기 날짜는 최대 3개까지만 — 너무 많으면 "최적"의 희소가치가 사라진다
                const goodDates = (data.goodDates || []).slice(0, 3);
                return (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-2xl border border-white/[0.10] relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                    <div className="relative z-10">
                        <div className="text-center mb-5">
                            <span className="text-[14px] font-black px-5 py-1.5 rounded-full border" style={{ color: '#F06A7E', background: 'rgba(216,72,94,0.12)', borderColor: 'rgba(216,72,94,0.40)' }}>
                                {data.month}
                            </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] mb-2 text-[var(--text-muted)] font-bold">
                            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[12px] font-medium text-[var(--text-secondary)]">
                            {getEmptySlots(data.month).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {[...Array(daysInMonth)].map((_, i) => {
                                const day = i + 1;
                                const isGood = goodDates.includes(day);

                                return (
                                    <div
                                        key={i}
                                        className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-all ${
                                            isGood
                                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] scale-[1.05] z-10'
                                                : 'bg-white/[0.03] border-white/[0.08] opacity-60'
                                        }`}
                                    >
                                        {isGood ? (
                                            <>
                                                <span className="text-[16px] leading-none mb-0.5 drop-shadow-md">🔥</span>
                                                <span className="text-[9px] font-black tracking-tighter">{day}일</span>
                                            </>
                                        ) : (
                                            <span>{day}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 길일별 근거 — "아무 날이나 찍은 게 아니다"를 보여주는 신뢰 장치.
                            사유가 같은 날들은 한 줄로 합쳐 반복 문구를 없앤다 */}
                        {(() => {
                            const details = (data.dateDetails || []).filter(d => goodDates.includes(d.day));
                            const groups: { days: { day: number; ganzhi: string }[]; text: string }[] = [];
                            for (const d of details) {
                                const text = (d.reasons || []).map(humanizeReason).filter(Boolean).join(' · ');
                                if (!text) continue;
                                const g = groups.find(x => x.text === text);
                                if (g) g.days.push({ day: d.day, ganzhi: d.ganzhi });
                                else groups.push({ days: [{ day: d.day, ganzhi: d.ganzhi }], text });
                            }
                            if (groups.length === 0) return null;
                            return (
                                <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2.5">
                                    {groups.map((g, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <span className="flex-shrink-0 text-[12px] font-black px-2 py-0.5 rounded-lg border" style={{ color: '#F06A7E', background: 'rgba(216,72,94,0.10)', borderColor: 'rgba(216,72,94,0.35)' }}>
                                                {g.days.map(d => `${d.day}일`).join(' · ')}
                                            </span>
                                            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)] break-keep pt-0.5">
                                                <span className="text-[var(--text-muted)]">{g.days.map(d => `${d.ganzhi}일`).join('·')} — </span>
                                                {g.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* 범례 */}
                        <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-white/[0.08]">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[16px]">🔥</span>
                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">최적기</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
                );
            })}
        </div>
    );
}
