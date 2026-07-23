"use client";

/**
 * 운명의 합 — 무료 진단 다시 보기 (보관함의 Free 항목 전용)
 * 서버 잡이 없는 무료 미리보기라, 저장해둔 resultData를 그대로 다시 그린다
 * (재호출 없음 — 다시 봐도 항상 같은 내용).
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import CompatibilityChart from "@/components/CompatibilityChart";
import { getHapHistoryEntry, type HapHistoryEntry } from "@/features/hap/history";

const C = {
    accentBright: '#E8CF9C',
    accentSoft: 'rgba(201,161,92,0.10)',
    accentBorder: 'rgba(201,161,92,0.32)',
    him: '#B8B4BE',
    her: '#D9B872',
    ink: '#F0EAEB',
    sub: '#9C9199',
    muted: '#8A8290',
    card: 'rgba(240,234,235,0.04)',
    cardBorder: 'rgba(240,234,235,0.13)',
    lineSoft: 'rgba(240,234,235,0.07)',
    btnBg: 'linear-gradient(135deg, #E8CF9C 0%, #8C6A32 100%)',
    btnInk: '#241C0C',
    serif: "'Noto Serif KR', serif",
    r: 16,
};

const SCORE_LABELS: { key: string; label: string }[] = [
    { key: 'romance', label: '연애궁합' },
    { key: 'marriage', label: '결혼궁합' },
    { key: 'wealth', label: '재물궁합' },
    { key: 'personality', label: '성격궁합' },
    { key: 'family', label: '가정궁합' },
    { key: 'communication', label: '소통궁합' },
];

export default function HapFreeHistoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params.id);
    const [entry, setEntry] = useState<HapHistoryEntry | null | undefined>(undefined);

    useEffect(() => {
        setEntry(getHapHistoryEntry(id));
    }, [id]);

    if (entry === undefined) return null;

    if (!entry || entry.tier !== 'free' || !entry.resultData) {
        return (
            <div style={{ minHeight: '100vh', color: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700 }}>기록을 찾을 수 없어요</p>
                <p style={{ fontSize: 13, color: C.muted }}>이 기기에서 저장된 무료 진단 기록이 아니에요.</p>
                <Link href="/hap/history" style={{ color: C.accentBright, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 8 }}>보관함으로 돌아가기</Link>
            </div>
        );
    }

    const r = entry.resultData;
    const comp = r.compatibility;
    const ai = r.aiPreview as { coreLine: string | null; essence: string } | undefined;
    const myName = entry.myName || '나';
    const partnerName = entry.partnerName || '그 사람';

    return (
        <div style={{ minHeight: '100vh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', paddingBottom: 60 }}>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4, color: C.sub, cursor: 'pointer', display: 'flex' }}>
                        <ArrowLeft size={22} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>무료 진단 기록</span>
                </header>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '22px 0 26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, border: `2.5px solid ${C.him}`, color: C.him, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 23, fontWeight: 900, transform: 'rotate(-4deg)', margin: '0 auto 8px' }}>{r.mySeal}</div>
                            <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{myName}</p>
                        </div>
                        <span style={{ fontSize: 15, color: C.sub, marginBottom: 22 }}>✕</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, border: `2.5px solid ${C.her}`, color: C.her, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.serif, fontSize: 23, fontWeight: 900, transform: 'rotate(4deg)', margin: '0 auto 8px' }}>{r.partnerSeal}</div>
                            <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{partnerName}</p>
                        </div>
                    </div>
                    <h1 style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 700, margin: 0 }}>{myName} ✕ {partnerName}</h1>
                </motion.div>

                {r.hapScores && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: '26px 20px 22px', textAlign: 'center', marginBottom: 14 }}>
                        {r.relationType && (
                            <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: C.accentBright, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 99, padding: '5px 14px', marginBottom: 14 }}>
                                {r.relationType.badge}
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                            <span style={{ fontFamily: C.serif, fontSize: 56, fontWeight: 900, color: C.accentBright, lineHeight: 1 }}>{r.hapScores.total}</span>
                            <span style={{ fontSize: 15, color: C.sub }}>점</span>
                            <span style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 700, color: C.ink, marginLeft: 10 }}>{r.totalGrade}</span>
                            <span style={{ fontSize: 12, color: C.muted }}>등급</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20 }}>
                            {SCORE_LABELS.map(({ key, label }) => (
                                <div key={key} style={{ background: 'rgba(240,234,235,0.03)', border: `1px solid ${C.lineSoft}`, borderRadius: 12, padding: '12px 4px 10px' }}>
                                    <p style={{ fontFamily: C.serif, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{r.hapScores[key]}</p>
                                    <p style={{ fontSize: 10.5, color: C.muted, margin: '3px 0 0' }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {ai?.essence && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 14, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: C.r, padding: 20 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.sub, margin: '0 0 12px' }}>
                            <Sparkles size={13} color={C.accentBright} /> 역술가의 첫 진단
                        </h3>
                        {ai.coreLine && (
                            <p style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 700, color: C.accentBright, margin: '0 0 10px' }}>「 {ai.coreLine} 」</p>
                        )}
                        <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>{ai.essence}</p>
                    </motion.div>
                )}

                {comp && (
                    <div style={{
                        ['--accent-gold' as any]: '#D9B872',
                        ['--accent-soft' as any]: 'rgba(201,161,92,0.10)',
                        ['--accent-border' as any]: 'rgba(201,161,92,0.32)',
                    }}>
                        <CompatibilityChart
                            attractionScore={comp.attractionScore} conflictScore={comp.conflictScore} complementScore={comp.complementScore}
                            hapList={comp.hapList} chungList={comp.chungList} hyeongList={comp.hyeongList} haeList={comp.haeList}
                            dayMasterRelation={comp.dayMasterRelation} spouseHouseRelation={comp.spouseHouseRelation}
                        />
                    </div>
                )}

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 26, background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: C.r, padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: C.ink, fontWeight: 700, marginBottom: 6 }}>4개 파트 전체 리포트는 아직이에요</p>
                    <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>같은 정보로 새 미리보기를 열어 결제하면, 이 기록 바로 아래에 전체 리포트가 저장돼요.</p>
                    <Link href="/hap/input" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 14, padding: '13px 0',
                        borderRadius: 12, textDecoration: 'none',
                    }}>
                        <Lock size={14} /> 새로 궁합 보기
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
