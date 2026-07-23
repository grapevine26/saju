"use client";

/**
 * 운명의 합 — 오행(목화토금수) 분포 비교 차트 (him/her 2색 막대).
 * 무료 미리보기·유료 결과·무료 재열람 3곳에서 공유 — 어느 화면에서 봐도
 * 같은 데이터를 같은 방식으로 보여준다.
 */
import { motion } from "framer-motion";

const C = {
    him: '#B8B4BE',
    her: '#D9B872',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    lineSoft: 'rgba(240,234,235,0.07)',
    serif: "'Noto Serif KR', serif",
    r: 16,
};

const OHHAENG_ORDER = ['목', '화', '토', '금', '수'] as const;

interface Props {
    myName: string;
    partnerName: string;
    myOhhaeng: Record<string, number>;
    partnerOhhaeng: Record<string, number>;
    ohhaengAnalysis?: string;
}

export default function OhhaengCompareChart({ myName, partnerName, myOhhaeng, partnerOhhaeng, ohhaengAnalysis }: Props) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 4px' }}>타고난 기운 비교</h3>
            <p style={{ fontSize: 11.5, color: C.muted, margin: '0 0 16px' }}>사주 여덟 글자를 이루는 다섯 기운의 분포예요</p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.sub }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: C.him, display: 'inline-block' }} />{myName}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.sub }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: C.her, display: 'inline-block' }} />{partnerName}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OHHAENG_ORDER.map((el) => {
                    const mine = myOhhaeng[el] || 0;
                    const theirs = partnerOhhaeng[el] || 0;
                    const max = 8; // 4기둥 × 천간+지지
                    return (
                        <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontFamily: C.serif, fontSize: 13, fontWeight: 700, color: C.ink, width: 16, flexShrink: 0 }}>{el}</span>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div style={{ height: 7, background: 'rgba(240,234,235,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(mine / max) * 100}%` }} transition={{ duration: 0.7, delay: 0.3 }}
                                        style={{ height: '100%', background: C.him, borderRadius: 99 }} />
                                </div>
                                <div style={{ height: 7, background: 'rgba(240,234,235,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(theirs / max) * 100}%` }} transition={{ duration: 0.7, delay: 0.4 }}
                                        style={{ height: '100%', background: C.her, borderRadius: 99 }} />
                                </div>
                            </div>
                            <span style={{ fontSize: 10.5, color: C.muted, width: 30, textAlign: 'right', flexShrink: 0 }}>{mine}·{theirs}</span>
                        </div>
                    );
                })}
            </div>
            {ohhaengAnalysis && (
                <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, margin: '16px 0 0', paddingTop: 14, borderTop: `1px solid ${C.lineSoft}` }}>
                    🌿 {ohhaengAnalysis}
                </p>
            )}
        </motion.div>
    );
}
