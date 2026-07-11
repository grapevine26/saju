'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NameCandidate, Ohaeng } from '@/features/naming/types';
import { AppraisalResult } from '@/features/naming/appraisal';
import { mdDist, mdLacking, mdMatchScore, MD_EL_HANJA } from '@/features/naming/yunmyeong';
import MdSajuPillars, { MdManseryeok } from '@/components/naming/yunmyeong/MdSajuPillars';
import MdLoadingMandala from '@/components/naming/yunmyeong/MdLoading';
import MdShell from '@/components/naming/yunmyeong/MdShell';
import { MdChartBars } from '@/components/naming/yunmyeong/MdCharts';
import {
    AppraisalVerdict,
    MdNameCard,
    MdToast,
    ShareCard,
    useMdToast,
} from '@/components/naming/yunmyeong/MdReport';

// ─────────────────────────────────────────────
// 윤명 — 명명증서(命名證書) / 감명 결과서 리포트 (obsidian 테마)
// 규칙 기반 데이터 + 해설을 '증서' 형태로 렌더링.
// [PDF 리포트 다운로드]는 브라우저 인쇄(PDF 저장)를 호출한다.
// ─────────────────────────────────────────────

interface NamingResult {
    service: string;
    input: {
        serviceType: string;
        surname: string;
        gender: string;
        value: string;
        currentName: string | null;
        birthYear?: string;
        birthMonth?: string;
        birthDay?: string;
    };
    surname: { hangul: string; hanja: string; strokes: number; element: Ohaeng };
    baziStr: string;
    manseryeok?: MdManseryeok;
    diagnosis: {
        counts: Record<Ohaeng, number>;
        percentages: Record<Ohaeng, number>;
        missing: Ohaeng[];
        weakest: Ohaeng;
        strongest: Ohaeng;
        complement: [Ohaeng, Ohaeng];
    };
    candidates: NameCandidate[];
    appraisal?: AppraisalResult | null;
    aiReport: {
        intro: string;
        ohaengStory: string;
        names: Array<{ hangul: string; catchphrase: string; interpretation: string; callingVibe?: string }>;
        bestPick: { hangul: string; reason: string };
        closing: string;
    };
}

export default function NamingResultPage() {
    const params = useParams<{ jobId: string }>();
    const router = useRouter();
    const [result, setResult] = useState<NamingResult | null>(null);
    const [status, setStatus] = useState<'loading' | 'processing' | 'error'>('loading');
    const [toastMsg, toast] = useMdToast();
    const startedRef = useRef(false);
    const triesRef = useRef(0);

    useEffect(() => {
        if (startedRef.current || !params?.jobId) return;
        startedRef.current = true;

        const fetchResult = async () => {
            try {
                const res = await fetch(`/api/job-status?jobId=${params.jobId}`);
                const json = await res.json();

                if (!json.success) {
                    setStatus('error');
                    return;
                }
                if (json.status === 'completed' && json.aiResult?.service === 'naming') {
                    setResult(json.aiResult);
                    return;
                }
                if (json.status === 'failed') {
                    setStatus('error');
                    return;
                }
                // 아직 생성 중이면 3초 후 재시도 (최대 5분까지만 — 이후 안내로 전환)
                triesRef.current += 1;
                if (triesRef.current > 100) {
                    setStatus('error');
                    return;
                }
                setStatus('processing');
                setTimeout(() => { startedRef.current = false; setStatus('loading'); }, 3000);
            } catch (e) {
                console.error('리포트 조회 실패:', e);
                setStatus('error');
            }
        };

        fetchResult();
    }, [params?.jobId, status]);

    // ── 에러 화면 ──
    if (!result && status === 'error') {
        return (
            <MdShell theme="obsidian">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
                    <div>
                        <div className="md-serif" style={{ fontSize: 34, marginBottom: 18 }}>命</div>
                        <p style={{ fontSize: 13.5, color: 'var(--md-text-2)' }}>리포트를 찾을 수 없습니다.</p>
                        <button className="md-btn md-btn--ghost" style={{ marginTop: 24 }} onClick={() => router.push('/yunmyeong')}>
                            처음으로 돌아가기
                        </button>
                    </div>
                </div>
            </MdShell>
        );
    }

    // ── 생성 대기 화면 (오행 만다라) ──
    // 리포트 생성은 1분 내외이므로 done=false로 97%에서 홀드하다가
    // 폴링이 완성을 감지하면 곧바로 리포트가 렌더링된다
    if (!result) {
        return (
            <MdShell theme="obsidian">
                <MdLoadingMandala seconds={45} done={false} onDone={() => { /* 폴링 완료 시 리포트로 전환 */ }} />
            </MdShell>
        );
    }

    const { surname, diagnosis, candidates, aiReport, input, manseryeok, appraisal } = result;
    const isAppraise = input.serviceType === 'evaluation';
    const dist = mdDist(diagnosis);
    const lacking = mdLacking(diagnosis);
    
    // AI가 최우선 추천 이름에 성씨를 붙여 반환하는 경우에 대비한 이름 정제
    const bestPickRaw = aiReport.bestPick?.hangul || '';
    const bestPickNameOnly = bestPickRaw.startsWith(surname.hangul)
        ? bestPickRaw.slice(surname.hangul.length)
        : bestPickRaw;

    const cleanLineBreaks = (text?: string | null) => {
        if (!text) return '';
        return text.replace(/\\n/g, '\n');
    };

    // 증서번호 (생년월일 + 성씨 코드 기반 — 표시용)
    const certNo = `YM-${input.birthYear || ''}${String(input.birthMonth || '').padStart(2, '0')}${String(input.birthDay || '').padStart(2, '0')}-${(input.surname || '명').charCodeAt(0).toString(16).toUpperCase()}7`;
    const issued = new Date();

    return (
        <MdShell theme="obsidian">
            {/* 인쇄(PDF 저장) 전용 스타일 */}
            <style jsx global>{`
                @media print {
                    body { background: #ffffff !important; }
                    [data-md-theme] { background: #ffffff !important; }
                    [data-md-theme], [data-md-theme] * { color: #1e293b !important; }
                    .md-app { background: #ffffff !important; max-width: 100% !important; border: none !important; }
                    .md-card { background: #ffffff !important; border-color: #cbd5e1 !important; box-shadow: none !important; }
                    .print-hide { display: none !important; }
                }
            `}</style>
                <div className="md-screen">
                    {/* ── 증서 헤더 ── */}
                    <header style={{ padding: '30px 24px 8px', textAlign: 'center' }}>
                        <div className="md-serif" style={{ fontSize: 12, letterSpacing: '0.34em', color: 'var(--md-accent)', marginBottom: 14 }}>命名寶鑑</div>
                        <h2 className="md-serif" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.45 }}>
                            {isAppraise ? '감명 결과서 鑑名結果書' : '명명증서 命名證書'}
                        </h2>
                        <p style={{ marginTop: 10, fontSize: 11.5, color: 'var(--md-text-3)' }}>
                            증서번호 {certNo} · {issued.getFullYear()}.{String(issued.getMonth() + 1).padStart(2, '0')} 발급
                        </p>
                    </header>

                    <div style={{ padding: '20px 20px 40px', display: 'grid', gap: 16 }}>
                        {/* ── 서문 ── */}
                        {aiReport.intro ? (
                            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty', padding: '4px 2px' }}>
                                {cleanLineBreaks(aiReport.intro)}
                            </p>
                        ) : null}

                        {/* ── 사주 4주 표 ── */}
                        {manseryeok ? <MdSajuPillars manseryeok={manseryeok} /> : null}

                        {/* ── 오행 균형 진단 (리포트는 항상 막대형 — 수치 가독성) ── */}
                        <div className="md-card" style={{ padding: '18px 18px' }}>
                            <div className="md-eyebrow" style={{ marginBottom: 12 }}>오행 균형 진단</div>
                            <MdChartBars dist={dist} lacking={lacking.el} />
                        </div>

                        {/* ── 오행 구조 해설 ── */}
                        {aiReport.ohaengStory ? (
                            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty', padding: '4px 2px' }}>
                                {cleanLineBreaks(aiReport.ohaengStory)}
                            </p>
                        ) : null}

                        {/* ── 현재 이름 판정 (감명: 감명 판정 / 개명: 현재 이름 진단) ── */}
                        {appraisal ? (
                            <AppraisalVerdict
                                appraisal={appraisal}
                                surnameHangul={surname.hangul}
                                surnameHanja={surname.hanja}
                                lacking={lacking}
                                variant={isAppraise ? 'evaluation' : 'rename'}
                            />
                        ) : null}

                        {/* ── 이름 카드 ── */}
                        <div style={{ marginTop: 10 }}>
                            <div className="md-eyebrow" style={{ marginBottom: 4 }}>
                                {isAppraise ? `보완 후보 ${candidates.length}선` : `처방 이름 ${candidates.length}선`}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--md-text-3)', marginBottom: 14 }}>
                                {lacking.el}({lacking.hanja}) 기운 보강 · {surname.hangul}씨 {surname.strokes}획 기준 수리 연산
                            </p>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {candidates.map((candidate, idx) => (
                                    <MdNameCard
                                        key={candidate.hangul}
                                        rank={idx + 1}
                                        surnameHangul={surname.hangul}
                                        surnameHanja={surname.hanja}
                                        candidate={candidate}
                                        aiComment={aiReport.names?.find((n) => n.hangul === candidate.hangul) || aiReport.names?.[idx]}
                                        match={mdMatchScore(candidate, idx)}
                                        defaultOpen={bestPickNameOnly ? candidate.hangul === bestPickNameOnly : idx === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── 최우선 추천 사유 ── */}
                        {!isAppraise && aiReport.bestPick ? (
                            <div className="md-card" style={{ padding: '20px 18px', borderColor: 'var(--md-line-strong)' }}>
                                <div className="md-eyebrow" style={{ marginBottom: 10 }}>최우선 추천 — {surname.hangul}{bestPickNameOnly}</div>
                                <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
                                    {cleanLineBreaks(aiReport.bestPick.reason)}
                                </p>
                            </div>
                        ) : null}

                        {/* ── 맺음말 ── */}
                        {aiReport.closing ? (
                            <p className="md-serif" style={{ fontSize: 13.5, lineHeight: 1.9, color: 'var(--md-text-2)', whiteSpace: 'pre-line', textAlign: 'center', padding: '10px 2px 0' }}>
                                {cleanLineBreaks(aiReport.closing)}
                            </p>
                        ) : null}

                        {/* ── PDF 다운로드 (브라우저 인쇄 기반) ── */}
                        <button className="md-btn print-hide" onClick={() => window.print()}>
                            PDF 리포트 다운로드
                        </button>

                        {/* ── 공유 카드 ── */}
                        <div className="print-hide" style={{ marginTop: 22, paddingTop: 26, borderTop: '1px solid var(--md-line)' }}>
                            <div className="md-eyebrow" style={{ textAlign: 'center', marginBottom: 16 }}>친구에게 공유하기</div>
                            <ShareCard
                                dayPillar={manseryeok?.day || null}
                                strongest={{ el: diagnosis.strongest, pct: diagnosis.percentages[diagnosis.strongest] ?? 0 }}
                                lacking={lacking}
                                // TODO: 1080×1920 공유 이미지 렌더링 구현 (핸드오프 교체 목록 #6)
                                onSave={() => toast('공유 이미지는 준비 중입니다')}
                            />
                        </div>

                        <button className="md-btn md-btn--ghost print-hide" style={{ marginTop: 8 }} onClick={() => router.push('/yunmyeong')}>
                            처음으로 돌아가기
                        </button>
                    </div>
                </div>
            <MdToast msg={toastMsg} />
        </MdShell>
    );
}
