/**
 * PDF 전용 리포트 문서 — /result/[jobId]/pdf 에서 서버 렌더 후
 * /api/result/[jobId]/pdf 가 headless Chrome으로 A4 PDF로 변환한다.
 *
 * 웹 리포트(ResultClient)와 달리 인쇄 판형(A4)에 맞춰 처음부터 재구성한 레이아웃.
 * - 애니메이션·인터랙션 없음 (서버 컴포넌트)
 * - 차트는 전부 인라인 SVG/CSS — 페이지 경계에서 잘리지 않도록 카드 단위 break-inside: avoid
 * - 이모지는 Noto Color Emoji 웹폰트로 렌더 (서버 Chromium에는 시스템 이모지 폰트가 없음)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const OH_COLOR: Record<string, string> = {
    목: "#3E9B6B", 화: "#D8485E", 토: "#B98A3E", 금: "#7A828C", 수: "#3E6B9B",
};

const OH_ORDER = ["목", "화", "토", "금", "수"];

/** "일간 정임합: 상대방의 마음이 열리는 시기" → 기술 접두어를 떼고 사람 말만 */
const humanizeReason = (r: string): string => {
    const i = r.indexOf(":");
    return (i >= 0 ? r.slice(i + 1) : r).replace(/\s*\((주의|자제 필요)\)\s*$/, "").trim();
};

function PartHeader({ no, title, lede }: { no: string; title: string; lede?: string }) {
    return (
        <div className="pd-part-head">
            <p className="pd-part-no">PART {no}</p>
            <h2 className="pd-part-title">{title}</h2>
            {lede && <p className="pd-part-lede">{lede}</p>}
            <div className="pd-part-rule" />
        </div>
    );
}

function H3({ children }: { children: React.ReactNode }) {
    return <h3 className="pd-h3"><span className="pd-h3-tick" />{children}</h3>;
}

function ScoreBar({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
    const v = Math.max(0, Math.min(100, value ?? 0));
    return (
        <div className="pd-bar-row">
            <span className="pd-bar-label">{label}</span>
            <span className="pd-bar-track">
                <span className="pd-bar-fill" style={{ width: `${v}%`, background: color }} />
            </span>
            <span className="pd-bar-num" style={{ color }}>{v}</span>
            {note && <span className="pd-bar-note">{note}</span>}
        </div>
    );
}

function Donut({ score, size = 168 }: { score: number; size?: number }) {
    const s = Math.max(0, Math.min(100, score ?? 50));
    const r = 62, c = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} viewBox="0 0 160 160">
            <defs>
                <linearGradient id="pdGauge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F06A7E" />
                    <stop offset="100%" stopColor="#A82E42" />
                </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(240,106,126,0.18)" strokeWidth="11" />
            <circle
                cx="80" cy="80" r={r} fill="none" stroke="url(#pdGauge)" strokeWidth="11"
                strokeLinecap="round" strokeDasharray={`${(c * s) / 100} ${c}`}
                transform="rotate(-90 80 80)"
            />
            <text x="80" y="76" textAnchor="middle" fontSize="34" fontWeight="900" fill="#F5E9EC" fontFamily="'Noto Serif KR', serif">{s}</text>
            <text x="80" y="96" textAnchor="middle" fontSize="10" fill="rgba(245,233,236,0.65)" letterSpacing="2">재회 가능성</text>
        </svg>
    );
}

function Radar({ data }: { data: any }) {
    const axes = [
        { label: "소통", v: data?.communication },
        { label: "애정표현", v: data?.affection },
        { label: "갈등 회복력", v: data?.conflict },
        { label: "미래 안정성", v: data?.future },
        { label: "속궁합", v: data?.intimacy },
    ];
    const cx = 160, cy = 118, R = 78; // 좌우 라벨("애정표현 72" 등)이 뷰박스에 잘리지 않도록 여백 확보
    const pt = (i: number, ratio: number) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return [cx + R * ratio * Math.cos(ang), cy + R * ratio * Math.sin(ang)];
    };
    const poly = (ratio: number) => axes.map((_, i) => pt(i, ratio).map(n => n.toFixed(1)).join(",")).join(" ");
    const dataPoly = axes.map((a, i) => pt(i, Math.max(0, Math.min(100, a.v ?? 0)) / 100).map(n => n.toFixed(1)).join(",")).join(" ");
    const labelPos = [
        { dx: 0, dy: -10, anchor: "middle" }, { dx: 12, dy: 2, anchor: "start" },
        { dx: 8, dy: 14, anchor: "start" }, { dx: -8, dy: 14, anchor: "end" },
        { dx: -12, dy: 2, anchor: "end" },
    ];
    return (
        <svg width="100%" viewBox="0 0 320 236" style={{ maxWidth: "98mm", display: "block", margin: "0 auto" }}>
            {[0.25, 0.5, 0.75, 1].map(rt => (
                <polygon key={rt} points={poly(rt)} fill="none" stroke="#EADDE0" strokeWidth="1" />
            ))}
            {axes.map((_, i) => {
                const [x, y] = pt(i, 1);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#EADDE0" strokeWidth="1" />;
            })}
            <polygon points={dataPoly} fill="rgba(216,72,94,0.16)" stroke="#D8485E" strokeWidth="2" strokeLinejoin="round" />
            {axes.map((a, i) => {
                const [x, y] = pt(i, Math.max(0, Math.min(100, a.v ?? 0)) / 100);
                return <circle key={i} cx={x} cy={y} r="3" fill="#D8485E" />;
            })}
            {axes.map((a, i) => {
                const [x, y] = pt(i, 1);
                const p = labelPos[i];
                return (
                    <text key={i} x={x + p.dx} y={y + p.dy} textAnchor={p.anchor as any} fontSize="10.5" fontWeight="700" fill="#66525B">
                        {a.label} <tspan fill="#D8485E" fontWeight="800">{Math.round(a.v ?? 0)}</tspan>
                    </text>
                );
            })}
        </svg>
    );
}

function PillarTable({ title, m }: { title: string; m: any }) {
    if (!m) return null;
    const cols = [
        { name: "년주", p: m.year }, { name: "월주", p: m.month },
        { name: "일주", p: m.day }, ...(m.time ? [{ name: "시주", p: m.time }] : []),
    ].filter(c => c.p);
    if (!cols.length) return null;
    return (
        <div className="pd-avoid" style={{ marginBottom: "5mm" }}>
            <p className="pd-pillar-title">{title}</p>
            <div className="pd-pillar-grid" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                {cols.map((c, i) => (
                    <div key={i} className="pd-pillar-col">
                        <p className="pd-pillar-name">{c.name}</p>
                        <div className="pd-pillar-han">
                            <span style={{ color: OH_COLOR[c.p.ganOhhaeng] || "#26181E" }}>{c.p.ganHanja}</span>
                            <span style={{ color: OH_COLOR[c.p.zhiOhhaeng] || "#26181E" }}>{c.p.zhiHanja}</span>
                        </div>
                        <p className="pd-pillar-read">{c.p.gan}{c.p.zhi}</p>
                        <p className="pd-pillar-meta">{c.p.ganSipsin} · {c.p.zhiSipsin}</p>
                        <p className="pd-pillar-meta" style={{ color: "#A08D96" }}>운성 {c.p.shibiUnsung}</p>
                        {(c.p.shinsal?.length > 0 || c.p.generalShinsal?.length > 0) && (
                            <p className="pd-pillar-shinsal">{[...(c.p.shinsal || []), ...(c.p.generalShinsal || [])].slice(0, 3).join(" · ")}</p>
                        )}
                    </div>
                ))}
                {!m.time && (
                    <div />
                )}
            </div>
            {!m.time && <p className="pd-footnote">시주는 출생 시간 미상으로 분석에서 제외되었습니다.</p>}
        </div>
    );
}

function OhhaengRow({ label, oh }: { label: string; oh: any }) {
    if (!oh) return null;
    const total = OH_ORDER.reduce((a, k) => a + (oh[k] || 0), 0) || 1;
    return (
        <div className="pd-oh-row">
            <span className="pd-oh-who">{label}</span>
            {OH_ORDER.map(k => (
                <span key={k} className="pd-oh-chip" style={{
                    background: `${OH_COLOR[k]}${(oh[k] || 0) > 0 ? "22" : "0D"}`,
                    color: (oh[k] || 0) > 0 ? OH_COLOR[k] : "#B9AAB0",
                    borderColor: `${OH_COLOR[k]}${(oh[k] || 0) > 0 ? "55" : "22"}`,
                }}>
                    {k} {oh[k] || 0}
                </span>
            ))}
            <span className="pd-oh-total">{total}자</span>
        </div>
    );
}

/** 무료판에서 [BLUR]로 가려지던 핵심 행동 지침 — 프리미엄 PDF에서는 강조 표시로 전부 공개 */
function SecretTeaser({ text }: { text: string }) {
    const parts = text.split(/(\[BLUR\].*?\[\/BLUR\])/g);
    return (
        <div className="pd-teaser pd-avoid">
            <p className="pd-teaser-label">핵심 행동 지침 요약</p>
            <p className="pd-body pre">
                {parts.map((part, i) =>
                    part.startsWith("[BLUR]") && part.endsWith("[/BLUR]")
                        ? <strong key={i} className="pd-teaser-key">{part.slice(6, -7)}</strong>
                        : <span key={i}>{part}</span>
                )}
            </p>
        </div>
    );
}

function ChapterCard({ no, title, subtitle, content }: { no: string; title: string; subtitle?: string; content: string }) {
    const m = /^\s*((?:\p{Extended_Pictographic}|\p{Emoji_Component}|️|‍)+)?\s*\[(.+?)\]\s*(.*)$/u.exec(title || "");
    const emoji = m?.[1] || null;
    const kicker = m?.[2];
    const main = m ? m[3] : title;
    return (
        <div className="pd-chapter pd-avoid">
            <div className="pd-chapter-head">
                <span className="pd-chapter-no">{no}</span>
                <div>
                    {kicker && <p className="pd-chapter-kicker">{emoji ? `${emoji} ` : ""}{kicker}</p>}
                    <p className="pd-chapter-title">{main}</p>
                </div>
            </div>
            {subtitle && <p className="pd-chapter-sub">{subtitle}</p>}
            <p className="pd-body pre">{content}</p>
        </div>
    );
}

export default function ReportPdfDocument({ job }: { job: any }) {
    const r = job.ai_result || {};
    const compat = r.compatibility;
    const gw = r.goldenWindows || {};
    const windows: any[] = gw.windows || r.windows || [];
    const bestMonth = gw.bestMonth || r.bestMonth;
    const monthlyEnergies: any[] = gw.monthlyEnergies || r.monthlyEnergies || [];
    const gwMonths: any[] = gw.goldenWindowMonths || r.goldenWindowMonths || [];
    const roadmap: any[] = gw.roadmapStages || r.roadmapStages || [];
    const manual = r.partnerManual;
    const cr = r.compatibilityReport;
    const score = r.reunionScore ?? compat?.reunionScore ?? 50;
    const dateStr = job.created_at
        ? new Date(job.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
        : "";

    const interactions: { label: string; color: string; bg: string; items: any[] }[] = compat ? [
        { label: "합(合) — 서로를 끌어당기는 인연", color: "#2E8B62", bg: "#EDF7F2", items: compat.hapList || [] },
        { label: "충(沖) — 부딪히는 에너지", color: "#A82E42", bg: "#FBF0F2", items: compat.chungList || [] },
        { label: "형(刑) — 마찰과 조정", color: "#B98A3E", bg: "#FAF4E8", items: compat.hyeongList || [] },
        { label: "해(害) — 미묘한 어긋남", color: "#5C6470", bg: "#F2F3F5", items: compat.haeList || [] },
    ].filter(g => g.items.length > 0) : [];

    let partNo = 0;
    const nextPart = () => String(++partNo).padStart(2, "0");

    const tocItems = [
        { t: "재회 가능성 진단", d: "종합 점수 · 두 사람의 사주 원국 · 관계 에너지" },
        { t: "두 사람의 관계 본질", d: "사주가 말하는 이 관계의 정체" },
        { t: "심층 재회 전략 리포트", d: `${(r.details || []).length}개 챕터 심층 분석` },
        ...(manual ? [{ t: "상대방 공략 매뉴얼", d: "금기어 · 마법 키워드 · 데이트 장소 · 문자 예시" }] : []),
        { t: "골든 윈도우", d: "월별 운기 흐름 · 연락 최적기 · 장기 로드맵" },
        ...(cr ? [{ t: "1:1 궁합 리포트", d: "5대 지표 · 성향 비교 · 종합 등급" }] : []),
    ];

    return (
        <div id="pdf-root" className="pd-root">
            <style dangerouslySetInnerHTML={{ __html: PDF_CSS }} />

            {/* ───────────────────────── 표지 ───────────────────────── */}
            <section className="pd-cover">
                <div className="pd-cover-inner">
                    <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/myoyeon-logo.png" alt="묘연 로고" className="pd-cover-logo" />
                        <p className="pd-cover-brand">묘연 妙緣</p>
                        <p className="pd-cover-service">다시, 우리 · 재회 사주</p>
                    </div>
                    <div className="pd-cover-center">
                        <p className="pd-cover-eyebrow">PREMIUM REPORT</p>
                        <h1 className="pd-cover-title">프리미엄 재회<br />심층 분석 리포트</h1>
                        <div className="pd-cover-gauge"><Donut score={score} /></div>
                        {r.reunionKeyword && <p className="pd-cover-keyword">{r.reunionKeyword}</p>}
                        {r.summary && <p className="pd-cover-summary">{r.summary}</p>}
                    </div>
                    <div className="pd-cover-foot">
                        <p>{dateStr && `${dateStr} 생성`}</p>
                        <p>dasisaju.com · 이 리포트 링크는 5년간 유효합니다</p>
                    </div>
                </div>
            </section>

            {/* ───────────────────────── 목차 ───────────────────────── */}
            <section className="pd-page-break">
                <div className="pd-toc-head">
                    <p className="pd-part-no">CONTENTS</p>
                    <h2 className="pd-part-title">이 리포트의 구성</h2>
                    <div className="pd-part-rule" />
                </div>
                {tocItems.map((it, i) => (
                    <div key={i} className="pd-toc-row">
                        <span className="pd-toc-no">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                            <p className="pd-toc-title">{it.t}</p>
                            <p className="pd-toc-desc">{it.d}</p>
                        </div>
                    </div>
                ))}
                <div className="pd-toc-note">
                    <p className="pd-body">
                        사주는 절대적인 미래를 정해놓은 것이 아니라, 우리가 나아갈 수 있는 여러 길 중
                        가장 지혜로운 방향을 알려주는 지도와 같습니다. 이 리포트는 두 분의 사주 원국과
                        현재의 운 흐름을 바탕으로, 재회를 위한 가장 현실적인 전략을 담았습니다.
                    </p>
                </div>
            </section>

            {/* ───────────────────────── PART 1. 진단 ───────────────────────── */}
            <section className="pd-page-break">
                <PartHeader no={nextPart()} title="재회 가능성 진단"
                    lede="두 사람의 사주 원국을 대조해 산출한 종합 진단입니다." />

                {r.summary && (
                    <div className="pd-quote pd-avoid">
                        {r.reunionKeyword && <p className="pd-quote-kicker">{r.reunionKeyword}</p>}
                        <p className="pd-quote-text">{r.summary}</p>
                    </div>
                )}

                {r.secretTeaser && <SecretTeaser text={r.secretTeaser} />}

                {(r.myManseryeok || r.partnerManseryeok) && (
                    <>
                        <H3>사주 원국(原局)</H3>
                        <PillarTable title="나의 사주" m={r.myManseryeok} />
                        <PillarTable title="그 사람의 사주" m={r.partnerManseryeok} />
                    </>
                )}

                {(r.myOhhaeng || r.partnerOhhaeng) && (
                    <div className="pd-avoid">
                        <H3>오행 분포</H3>
                        <div className="pd-card">
                            <OhhaengRow label="나" oh={r.myOhhaeng} />
                            <OhhaengRow label="그 사람" oh={r.partnerOhhaeng} />
                            {compat?.ohhaengAnalysis && <p className="pd-footnote" style={{ marginTop: "2.5mm" }}>{compat.ohhaengAnalysis}</p>}
                        </div>
                    </div>
                )}

                {compat && (
                    <div className="pd-avoid">
                        <H3>관계 에너지 분석</H3>
                        <div className="pd-card">
                            <ScoreBar label="끌림 지수" value={compat.attractionScore} color="#D8485E" />
                            <ScoreBar label="오행 보완" value={compat.complementScore} color="#4F5BD5" />
                            <ScoreBar label="갈등 지수" value={compat.conflictScore} color="#B98A3E" />
                            {(compat.dayMasterRelation || compat.spouseHouseRelation) && (
                                <div className="pd-relation">
                                    {compat.dayMasterRelation && <p><strong>일간 관계</strong> — {compat.dayMasterRelation}</p>}
                                    {compat.spouseHouseRelation && <p><strong>배우자궁</strong> — {compat.spouseHouseRelation}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {interactions.length > 0 && (
                    <div className="pd-avoid">
                        <H3>합(合) · 충(沖) 관계도</H3>
                        <div className="pd-interaction-grid">
                            {interactions.map((g, i) => (
                                <div key={i} className="pd-interaction" style={{ background: g.bg, borderColor: `${g.color}33` }}>
                                    <p className="pd-interaction-label" style={{ color: g.color }}>{g.label}</p>
                                    {g.items.map((it: any, j: number) => (
                                        <p key={j} className="pd-interaction-item">
                                            <strong>{Array.isArray(it.pair) ? it.pair.join(" – ") : ""}</strong>
                                            {"  "}{it.description} <span style={{ color: "#A08D96" }}>({it.type})</span>
                                        </p>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* ───────────────────────── PART 2. 관계의 본질 ───────────────────────── */}
            {r.essenceAnalysis && (
                <section className="pd-page-break">
                    <PartHeader no={nextPart()} title="두 사람의 관계 본질"
                        lede="사주가 말하는, 두 분이 만나고 헤어질 수밖에 없었던 이유." />
                    <div className="pd-essence pd-avoid">
                        {r.essenceAnalysis.subtitle && <p className="pd-essence-sub">{r.essenceAnalysis.subtitle}</p>}
                        <p className="pd-body pre">{r.essenceAnalysis.content}</p>
                    </div>
                </section>
            )}

            {/* ───────────────────────── PART 3. 심층 전략 ───────────────────────── */}
            {r.details?.length > 0 && (
                <section className="pd-page-break">
                    <PartHeader no={nextPart()} title="심층 재회 전략 리포트"
                        lede={`${r.details.length}개의 챕터로 성향·심리·타이밍·전략을 순서대로 분석합니다.`} />
                    {r.details.map((d: any, i: number) => (
                        <ChapterCard key={i} no={String(i + 1).padStart(2, "0")}
                            title={d.title} subtitle={d.subtitle} content={d.content} />
                    ))}
                </section>
            )}

            {/* ───────────────────────── PART 4. 공략 매뉴얼 ───────────────────────── */}
            {manual && (
                <section className="pd-page-break">
                    <PartHeader no={nextPart()} title="상대방 공략 매뉴얼"
                        lede="그 사람의 사주 성향에 맞춘 실전 대응 가이드입니다." />

                    {manual.forbiddenWords?.length > 0 && (
                        <div className="pd-avoid">
                            <H3>절대 쓰면 안 되는 금기어</H3>
                            {manual.forbiddenWords.map((it: any, i: number) => (
                                <div key={i} className="pd-manual-card" style={{ background: "#FBF0F2", borderColor: "rgba(168,46,66,0.2)" }}>
                                    <p className="pd-manual-word" style={{ color: "#A82E42" }}>“{it.word}”</p>
                                    <p className="pd-manual-reason">{it.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {manual.magicKeywords?.length > 0 && (
                        <div className="pd-avoid">
                            <H3>마음을 여는 마법 키워드</H3>
                            {manual.magicKeywords.map((it: any, i: number) => (
                                <div key={i} className="pd-manual-card" style={{ background: "#EDF7F2", borderColor: "rgba(46,139,98,0.2)" }}>
                                    <p className="pd-manual-word" style={{ color: "#2E8B62" }}>“{it.keyword}”</p>
                                    <p className="pd-manual-reason">{it.effect}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {manual.dateSpots?.length > 0 && (
                        <div className="pd-avoid">
                            <H3>재회 데이트 장소</H3>
                            {manual.dateSpots.map((it: any, i: number) => (
                                <div key={i} className="pd-manual-card" style={{ background: "#EFF1FB", borderColor: "rgba(79,91,213,0.2)" }}>
                                    <p className="pd-manual-word" style={{ color: "#4F5BD5" }}>{it.place}</p>
                                    <p className="pd-manual-reason">{it.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {manual.textExamples?.length > 0 && (
                        <div>
                            <H3>상황별 문자 예시</H3>
                            {manual.textExamples.map((it: any, i: number) => (
                                <div key={i} className="pd-text-example pd-avoid">
                                    <p className="pd-text-situation">상황 — {it.situation}</p>
                                    <div className="pd-bubble good">
                                        <p className="pd-bubble-tag" style={{ color: "#2E8B62" }}>이렇게 보내세요</p>
                                        <p>{it.good}</p>
                                    </div>
                                    <div className="pd-bubble bad">
                                        <p className="pd-bubble-tag" style={{ color: "#A82E42" }}>이건 절대 안 돼요</p>
                                        <p>{it.bad}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ───────────────────────── PART 5. 골든 윈도우 ───────────────────────── */}
            {(windows.length > 0 || monthlyEnergies.length > 0 || roadmap.length > 0) && (
                <section className="pd-page-break">
                    <PartHeader no={nextPart()} title="골든 윈도우"
                        lede="앞으로의 운기 흐름과, 연락을 넣기 가장 좋은 시기입니다." />

                    {windows.length > 0 && (
                        <div className="pd-avoid">
                            <H3>월별 운기 타임라인</H3>
                            <div className="pd-card" style={{ padding: "4mm 5mm" }}>
                                {windows.map((w: any, i: number) => (
                                    <div key={i} className={`pd-window-row${w.isGolden ? " golden" : ""}`}>
                                        <span className="pd-window-month">
                                            {w.year}.{String(w.month).padStart(2, "0")}
                                            <span className="pd-window-ganzhi">{w.monthGan}{w.monthZhi}월</span>
                                        </span>
                                        <span className="pd-bar-track">
                                            <span className="pd-bar-fill" style={{
                                                width: `${Math.max(0, Math.min(100, w.score))}%`,
                                                background: w.isGolden ? "linear-gradient(90deg,#F06A7E,#A82E42)" : "#C9BBC1",
                                            }} />
                                        </span>
                                        <span className="pd-bar-num" style={{ color: w.isGolden ? "#A82E42" : "#66525B" }}>{w.score}</span>
                                        <span className="pd-window-reason">
                                            {w.isGolden && <strong className="pd-golden-badge">골든</strong>}
                                            {(w.reasons || []).join(" · ")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bestMonth && (
                        <div className="pd-best pd-avoid">
                            <p className="pd-best-label">최적의 연락 시기</p>
                            <p className="pd-best-month">{bestMonth.year}년 {bestMonth.month}월 <span>({bestMonth.monthGan}{bestMonth.monthZhi}월 · {bestMonth.score}점)</span></p>
                            {bestMonth.reasons?.length > 0 && <p className="pd-best-reason">{bestMonth.reasons.join(" · ")}</p>}
                        </div>
                    )}

                    {gwMonths.length > 0 && (
                        <div className="pd-avoid">
                            <H3>연락 길일 캘린더</H3>
                            {gwMonths.map((m: any, i: number) => (
                                <div key={i} className="pd-card" style={{ marginBottom: "3mm" }}>
                                    <p className="pd-cal-month">{m.month}</p>
                                    {/* 피할 날(badDates)은 의도적으로 표시하지 않음 — 행동을 바꾸지 않는 부정 정보 (제품 결정) */}
                                    {(m.goodDates || []).length > 0 && (
                                        <div className="pd-cal-row">
                                            <span className="pd-cal-tag good">길일</span>
                                            <span className="pd-cal-dates">
                                                {(m.goodDates || []).map((d: number) => <em key={d} className="pd-date good">{d}일</em>)}
                                            </span>
                                        </div>
                                    )}
                                    {/* 길일별 선정 근거 (구버전 데이터에는 dateDetails 없음) */}
                                    {(m.dateDetails || []).map((d: any) => {
                                        const reasons = (d.reasons || []).map(humanizeReason).filter(Boolean);
                                        if (reasons.length === 0) return null;
                                        return (
                                            <p key={d.day} className="pd-cal-reason">
                                                <strong>{d.day}일</strong> <span>({d.ganzhi}일)</span> — {reasons.join(" · ")}
                                            </p>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {monthlyEnergies.length > 0 && (
                        <div>
                            <H3>월별 에너지 흐름</H3>
                            {monthlyEnergies.map((e: any, i: number) => (
                                <div key={i} className="pd-energy pd-avoid">
                                    <div className="pd-energy-head">
                                        <span className="pd-energy-month">{e.month}</span>
                                        <span className="pd-energy-theme">{e.theme}</span>
                                    </div>
                                    <p className="pd-body pre">{e.advice}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {roadmap.length > 0 && (
                        <div>
                            <H3>장기 전략 로드맵</H3>
                            {roadmap.map((s: any, i: number) => (
                                <div key={i} className="pd-road pd-avoid">
                                    <div className="pd-road-badge">{s.step}</div>
                                    <div>
                                        <p className="pd-road-title">{s.title}</p>
                                        <p className="pd-body pre">{s.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ───────────────────────── PART 6. 궁합 리포트 ───────────────────────── */}
            {cr && (
                <section className="pd-page-break">
                    <PartHeader no={nextPart()} title="1:1 궁합 리포트"
                        lede="두 사람의 사주를 1:1로 맞대어 본 심층 궁합 분석입니다." />

                    {cr.coupleType && (
                        <div className="pd-couple pd-avoid">
                            {cr.coupleType.emoji && <p className="pd-couple-emoji">{cr.coupleType.emoji}</p>}
                            <p className="pd-couple-label">{cr.coupleType.label}</p>
                            <p className="pd-body pre" style={{ textAlign: "left" }}>{cr.coupleType.description}</p>
                        </div>
                    )}

                    {cr.radarChart && (
                        <div className="pd-avoid">
                            <H3>5대 궁합 지표</H3>
                            <div className="pd-card">
                                <Radar data={cr.radarChart} />
                                {cr.radarChart.subtitle && <p className="pd-radar-sub">{cr.radarChart.subtitle}</p>}
                                {cr.radarChart.summary && <p className="pd-body pre" style={{ marginTop: "2mm" }}>{cr.radarChart.summary}</p>}
                            </div>
                        </div>
                    )}

                    {cr.vsCards?.length > 0 && (
                        <div>
                            <H3>극과 극 성향 비교</H3>
                            {cr.vsCards.map((c: any, i: number) => (
                                <div key={i} className="pd-vs pd-avoid">
                                    <p className="pd-vs-topic">{c.topic}</p>
                                    <div className="pd-vs-grid">
                                        <div className="pd-vs-side me"><p className="pd-vs-who">나</p><p>{c.myTrait}</p></div>
                                        <div className="pd-vs-side you"><p className="pd-vs-who">그 사람</p><p>{c.partnerTrait}</p></div>
                                    </div>
                                    <p className="pd-body pre" style={{ marginTop: "2.5mm" }}>{c.explanation}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {cr.compatibilityDetails?.length > 0 && (
                        <div>
                            <H3>심층 궁합 해부</H3>
                            {cr.compatibilityDetails.map((d: any, i: number) => (
                                <ChapterCard key={i} no={String(i + 1).padStart(2, "0")} title={d.title} content={d.content} />
                            ))}
                        </div>
                    )}

                    {cr.overallGrade && (
                        <div className="pd-grade pd-avoid">
                            <div className="pd-grade-badge">{cr.overallGrade.grade}</div>
                            <p className="pd-grade-label">{cr.overallGrade.label}</p>
                            <div className="pd-grade-cols">
                                <div className="pd-grade-col" style={{ background: "#EDF7F2" }}>
                                    <p className="pd-grade-col-title" style={{ color: "#2E8B62" }}>강점</p>
                                    {(cr.overallGrade.strengths || []).map((s: string, i: number) => <p key={i}>· {s}</p>)}
                                </div>
                                <div className="pd-grade-col" style={{ background: "#FBF0F2" }}>
                                    <p className="pd-grade-col-title" style={{ color: "#A82E42" }}>약점</p>
                                    {(cr.overallGrade.weaknesses || []).map((w: string, i: number) => <p key={i}>· {w}</p>)}
                                </div>
                            </div>
                            {cr.overallGrade.finalMessage && <p className="pd-body pre" style={{ marginTop: "3mm" }}>{cr.overallGrade.finalMessage}</p>}
                        </div>
                    )}
                </section>
            )}

            {/* ───────────────────────── 마치며 ───────────────────────── */}
            <section className="pd-page-break">
                <div className="pd-closing">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/myoyeon-logo.png" alt="묘연 로고" className="pd-closing-logo" />
                    <p className="pd-closing-brand">묘연 妙緣</p>
                    <p className="pd-closing-title">당신을 응원합니다</p>
                    <div className="pd-part-rule" style={{ margin: "6mm auto" }} />
                    <p className="pd-closing-text">
                        사주라는 것은 절대적인 미래를 정해놓은 것이 아니라,<br />
                        우리가 나아갈 수 있는 여러 길 중 가장 지혜로운 방향을 알려주는 지도와 같습니다.<br /><br />
                        분석 결과가 생각보다 좋게 나왔다면 그 운을 믿고 용기를 내시고,<br />
                        아쉬운 결과가 나왔더라도 너무 상심하지 마세요.<br /><br />
                        당신의 진심과 노력이 언제나 운명보다 더 강한 힘을 발휘한다는 사실을 잊지 마시길.<br />
                        앞으로 걸어갈 당신의 모든 시간에 따뜻한 빛이 함께하기를 진심으로 응원합니다.
                    </p>
                    <div className="pd-closing-foot">
                        <p>다시, 우리 — 재회 사주 심층 분석</p>
                        <p>dasisaju.com{dateStr && ` · ${dateStr} 생성`} · 이 리포트 링크는 5년간 유효합니다</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

const PDF_CSS = `
  html, body {
    background: #FFFFFF !important;
    display: block !important;
    margin: 0; padding: 0;
  }
  body > main {
    max-width: none !important;
    overflow: visible !important;
    background: none !important;
  }
  #ch-plugin, #ch-plugin-entry { display: none !important; }

  .pd-root {
    width: 100%;
    color: #26181E;
    font-family: 'Pretendard', 'Noto Sans KR', 'Noto Color Emoji', sans-serif;
    font-size: 9.5pt;
    line-height: 1.9;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pd-root p { margin: 0; }
  /* 가운데 정렬 박스 — 위 p 리셋(.pd-root p)보다 특이도를 높여 auto 마진이 살아있게 한다 */
  .pd-root .pd-cover-summary, .pd-root .pd-closing-text { margin-left: auto; margin-right: auto; }
  .pd-body { font-size: 9.5pt; color: #3D2E35; line-height: 1.95; }
  .pd-body.pre, .pre { white-space: pre-wrap; }
  .pd-avoid { break-inside: avoid; }
  .pd-page-break { break-before: page; }
  .pd-footnote { font-size: 7.8pt; color: #A08D96; line-height: 1.7; margin-top: 1.5mm; }

  /* ── 표지 ── */
  .pd-cover { height: 266mm; break-after: page; }
  .pd-cover-inner {
    height: 100%; box-sizing: border-box;
    border-radius: 5mm;
    padding: 16mm 14mm;
    display: flex; flex-direction: column; justify-content: space-between;
    text-align: center;
    background:
      radial-gradient(ellipse 120% 60% at 50% 0%, #2A1019 0%, #170A0F 55%, #0F080B 100%);
  }
  .pd-cover-logo {
    width: 26mm; height: 26mm; border-radius: 50%;
    object-fit: cover; display: block; margin: 0 auto 4mm;
    border: 0.4mm solid rgba(240,106,126,0.35);
  }
  .pd-cover-brand {
    font-family: 'Noto Serif KR', serif; font-weight: 900;
    font-size: 12pt; color: #F06A7E; letter-spacing: 0.45em; text-indent: 0.45em;
  }
  .pd-cover-service { font-size: 8pt; color: rgba(245,233,236,0.55); letter-spacing: 0.3em; text-indent: 0.3em; margin-top: 2mm; }
  .pd-cover-eyebrow { font-size: 8pt; color: rgba(240,106,126,0.75); letter-spacing: 0.5em; text-indent: 0.5em; margin-bottom: 6mm; }
  .pd-cover-title {
    font-family: 'Noto Serif KR', serif; font-weight: 900;
    font-size: 26pt; line-height: 1.45; color: #F5E9EC; margin: 0 0 10mm;
  }
  .pd-cover-gauge { display: flex; justify-content: center; margin-bottom: 7mm; }
  .pd-cover-keyword {
    display: inline-block; margin: 0 auto 5mm;
    padding: 1.6mm 6mm; border-radius: 99px;
    border: 1px solid rgba(240,106,126,0.45);
    color: #F06A7E; font-weight: 700; font-size: 10pt;
    background: rgba(240,106,126,0.08);
  }
  .pd-cover-summary {
    max-width: 128mm; margin: 0 auto;
    font-size: 9.5pt; line-height: 2.0; color: rgba(245,233,236,0.82);
  }
  .pd-cover-foot { font-size: 8pt; color: rgba(245,233,236,0.45); line-height: 1.9; }

  /* ── 목차 ── */
  .pd-toc-head { margin-bottom: 10mm; padding-top: 6mm; }
  .pd-toc-row { display: flex; gap: 6mm; align-items: baseline; padding: 4.5mm 1mm; border-bottom: 1px solid #F0E7E9; }
  .pd-toc-no { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 13pt; color: #D8485E; }
  .pd-toc-title { font-weight: 800; font-size: 11.5pt; color: #26181E; }
  .pd-toc-desc { font-size: 8.5pt; color: #A08D96; margin-top: 0.5mm; }
  .pd-toc-note { margin-top: 10mm; padding: 6mm 7mm; background: #FBF0F2; border-radius: 3mm; }

  /* ── 파트 헤더 ── */
  .pd-part-head { padding-top: 6mm; margin-bottom: 8mm; }
  .pd-part-no { font-size: 8.5pt; font-weight: 800; color: #D8485E; letter-spacing: 0.35em; }
  .pd-part-title {
    font-family: 'Noto Serif KR', serif; font-weight: 900;
    font-size: 19pt; color: #26181E; margin: 2mm 0 2.5mm; line-height: 1.4;
  }
  .pd-part-lede { font-size: 9pt; color: #66525B; }
  .pd-part-rule { width: 14mm; height: 0.9mm; background: linear-gradient(90deg, #F06A7E, #A82E42); border-radius: 99px; margin-top: 4mm; }

  .pd-h3 {
    display: flex; align-items: center; gap: 2.2mm;
    font-size: 11pt; font-weight: 800; color: #26181E;
    margin: 7mm 0 3.5mm;
    break-after: avoid; /* 소제목이 페이지 맨 밑에 홀로 남지 않도록 */
  }
  .pd-h3-tick { width: 2.2mm; height: 2.2mm; border-radius: 0.6mm; background: #D8485E; display: inline-block; }

  .pd-card {
    border: 1px solid #EADDE0; border-radius: 3mm;
    padding: 5mm 6mm; background: #FFFDFC;
    margin-bottom: 4mm;
  }

  /* ── 인용/에센스 ── */
  .pd-quote { padding: 6mm 7mm; background: #FBF0F2; border-left: 1.2mm solid #D8485E; border-radius: 0 3mm 3mm 0; margin-bottom: 6mm; }
  .pd-quote-kicker { font-size: 8.5pt; font-weight: 800; color: #A82E42; margin-bottom: 2mm; }
  .pd-quote-text { font-size: 10pt; line-height: 2.0; color: #3D2E35; font-weight: 500; }
  .pd-teaser { padding: 5mm 6mm; border: 1.2px solid rgba(216,72,94,0.4); border-radius: 3mm; background: linear-gradient(160deg, #FBF0F2, #FFFDFC); margin-bottom: 6mm; }
  .pd-teaser-label { font-size: 8.5pt; font-weight: 800; color: #D8485E; letter-spacing: 0.2em; margin-bottom: 2mm; }
  .pd-teaser-key { color: #A82E42; font-weight: 800; }
  .pd-essence { padding: 6mm 7mm; border: 1px solid #EADDE0; border-radius: 3mm; background: #FFFDFC; }
  .pd-essence-sub { font-family: 'Noto Serif KR', serif; font-weight: 700; font-size: 12pt; color: #A82E42; margin-bottom: 4mm; line-height: 1.6; }

  /* ── 원국표 ── */
  .pd-pillar-title { font-size: 9pt; font-weight: 800; color: #66525B; margin-bottom: 2mm; }
  .pd-pillar-grid { display: grid; gap: 2.5mm; }
  .pd-pillar-col { border: 1px solid #EADDE0; border-radius: 2.5mm; padding: 3mm 2mm; text-align: center; background: #FFFDFC; }
  .pd-pillar-name { font-size: 7.5pt; color: #A08D96; letter-spacing: 0.15em; margin-bottom: 1.5mm; }
  .pd-pillar-han { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 17pt; line-height: 1.3; display: flex; flex-direction: column; }
  .pd-pillar-read { font-size: 8.5pt; font-weight: 700; color: #3D2E35; margin-top: 1mm; }
  .pd-pillar-meta { font-size: 7.5pt; color: #66525B; margin-top: 0.6mm; }
  .pd-pillar-shinsal { font-size: 7pt; color: #A08D96; margin-top: 1mm; line-height: 1.5; }

  /* ── 오행 ── */
  .pd-oh-row { display: flex; align-items: center; gap: 1.8mm; padding: 1.6mm 0; }
  .pd-oh-who { width: 12mm; font-size: 8.5pt; font-weight: 800; color: #66525B; }
  .pd-oh-chip { flex: 1; text-align: center; font-size: 8.5pt; font-weight: 700; padding: 1.2mm 0; border-radius: 2mm; border: 1px solid; }
  .pd-oh-total { width: 10mm; text-align: right; font-size: 8pt; color: #A08D96; }

  /* ── 점수 바 ── */
  .pd-bar-row { display: flex; align-items: center; gap: 3mm; padding: 1.8mm 0; }
  .pd-bar-label { width: 20mm; font-size: 8.5pt; font-weight: 700; color: #66525B; flex-shrink: 0; }
  .pd-bar-track { flex: 1; height: 2.4mm; background: #F3EBED; border-radius: 99px; overflow: hidden; display: block; }
  .pd-bar-fill { display: block; height: 100%; border-radius: 99px; }
  .pd-bar-num { width: 8mm; text-align: right; font-weight: 800; font-size: 9.5pt; flex-shrink: 0; }
  .pd-relation { margin-top: 3mm; padding-top: 3mm; border-top: 1px solid #F0E7E9; font-size: 8.8pt; color: #3D2E35; line-height: 1.9; }
  .pd-relation strong { color: #A82E42; }

  /* ── 합충형해 ── */
  .pd-interaction-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .pd-interaction { border: 1px solid; border-radius: 2.5mm; padding: 3.5mm 4mm; }
  .pd-interaction-label { font-size: 8.5pt; font-weight: 800; margin-bottom: 1.5mm; }
  .pd-interaction-item { font-size: 8.5pt; color: #3D2E35; line-height: 1.8; }

  /* ── 챕터 ── */
  .pd-chapter { border: 1px solid #EADDE0; border-radius: 3mm; padding: 5mm 6mm; margin-bottom: 4mm; background: #FFFDFC; }
  .pd-chapter-head { display: flex; gap: 4mm; align-items: center; margin-bottom: 3mm; }
  .pd-chapter-no { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 15pt; color: #E7C6CC; line-height: 1; }
  .pd-chapter-kicker { font-size: 8pt; font-weight: 800; color: #D8485E; letter-spacing: 0.12em; }
  .pd-chapter-title { font-size: 11.5pt; font-weight: 800; color: #26181E; line-height: 1.5; }
  .pd-chapter-sub { font-size: 9.5pt; font-weight: 700; color: #A82E42; margin-bottom: 2.5mm; line-height: 1.7; }

  /* ── 매뉴얼 ── */
  .pd-manual-card { border: 1px solid; border-radius: 2.5mm; padding: 3.5mm 4.5mm; margin-bottom: 2.5mm; }
  .pd-manual-word { font-size: 10pt; font-weight: 800; margin-bottom: 1mm; }
  .pd-manual-reason { font-size: 8.8pt; color: #3D2E35; line-height: 1.85; }
  .pd-text-example { border: 1px solid #EADDE0; border-radius: 3mm; padding: 4mm 5mm; margin-bottom: 3.5mm; background: #FFFDFC; }
  .pd-text-situation { font-size: 8.8pt; font-weight: 800; color: #66525B; margin-bottom: 2.5mm; }
  .pd-bubble { border-radius: 2.5mm; padding: 3mm 4mm; font-size: 9pt; line-height: 1.85; color: #26181E; margin-bottom: 2mm; }
  .pd-bubble.good { background: #EDF7F2; border: 1px solid rgba(46,139,98,0.25); }
  .pd-bubble.bad { background: #FBF0F2; border: 1px solid rgba(168,46,66,0.22); }
  .pd-bubble-tag { font-size: 7.5pt; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 1mm; }

  /* ── 골든 윈도우 ── */
  .pd-window-row { display: flex; align-items: center; gap: 3mm; padding: 2mm 0; border-bottom: 1px solid #F5EEF0; }
  .pd-window-row:last-child { border-bottom: none; }
  .pd-window-row.golden { background: #FBF0F2; margin: 0 -3mm; padding-left: 3mm; padding-right: 3mm; border-radius: 2mm; }
  .pd-window-month { width: 19mm; font-size: 8.8pt; font-weight: 800; color: #26181E; flex-shrink: 0; line-height: 1.3; }
  .pd-window-ganzhi { display: block; font-size: 7pt; font-weight: 400; color: #A08D96; }
  .pd-window-row .pd-bar-track { max-width: 34mm; }
  .pd-window-reason { flex: 1.6; font-size: 7.8pt; color: #66525B; line-height: 1.5; }
  .pd-golden-badge { color: #A82E42; font-weight: 800; margin-right: 1.5mm; }
  .pd-best { text-align: center; padding: 6mm; border: 1.5px solid rgba(216,72,94,0.4); border-radius: 3mm; background: linear-gradient(160deg, #FBF0F2, #FFFDFC); margin: 5mm 0; }
  .pd-best-label { font-size: 8pt; font-weight: 800; color: #D8485E; letter-spacing: 0.3em; text-indent: 0.3em; }
  .pd-best-month { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 17pt; color: #A82E42; margin: 1.5mm 0; }
  .pd-best-month span { font-size: 9.5pt; font-weight: 700; color: #66525B; font-family: 'Pretendard', sans-serif; }
  .pd-best-reason { font-size: 8.8pt; color: #3D2E35; }
  .pd-cal-month { font-size: 10.5pt; font-weight: 800; color: #26181E; margin-bottom: 2mm; }
  .pd-cal-row { display: flex; align-items: baseline; gap: 3mm; padding: 1.2mm 0; }
  .pd-cal-tag { font-size: 8pt; font-weight: 800; width: 13mm; flex-shrink: 0; }
  .pd-cal-tag.good { color: #A82E42; }
  .pd-cal-tag.bad { color: #7A828C; }
  .pd-date { font-style: normal; display: inline-block; padding: 0.8mm 2.4mm; border-radius: 99px; font-size: 8.5pt; font-weight: 700; margin: 0 1.2mm 1.2mm 0; }
  .pd-date.good { background: #FBF0F2; color: #A82E42; border: 1px solid rgba(216,72,94,0.3); }
  .pd-date.bad { background: #F2F3F5; color: #7A828C; border: 1px solid #E2E4E8; text-decoration: line-through; }
  .pd-cal-reason { font-size: 8.5pt; color: #66525B; line-height: 1.8; margin-top: 1.5mm; }
  .pd-cal-reason strong { color: #A82E42; }
  .pd-cal-reason span { color: #A08D96; }
  .pd-energy { border: 1px solid #EADDE0; border-radius: 3mm; padding: 4mm 5mm; margin-bottom: 3mm; background: #FFFDFC; }
  .pd-energy-head { display: flex; align-items: baseline; gap: 3mm; margin-bottom: 1.5mm; }
  .pd-energy-month { font-size: 10pt; font-weight: 800; color: #A82E42; }
  .pd-energy-theme { font-size: 9pt; font-weight: 700; color: #66525B; }
  .pd-road { display: flex; gap: 4mm; border: 1px solid #EADDE0; border-radius: 3mm; padding: 4.5mm 5mm; margin-bottom: 3mm; background: #FFFDFC; }
  .pd-road-badge { flex-shrink: 0; width: 12mm; height: 12mm; border-radius: 3mm; background: linear-gradient(135deg, #F06A7E, #A82E42); color: #FFF0F2; font-weight: 800; font-size: 8.5pt; display: flex; align-items: center; justify-content: center; }
  .pd-road-title { font-size: 10.5pt; font-weight: 800; color: #26181E; margin-bottom: 1.5mm; line-height: 1.5; }

  /* ── 궁합 ── */
  .pd-couple { text-align: center; border: 1px solid rgba(79,91,213,0.25); border-radius: 3mm; padding: 6mm 7mm; background: linear-gradient(160deg, #EFF1FB, #FFFDFC); margin-bottom: 5mm; }
  .pd-couple-emoji { font-size: 22pt; line-height: 1.2; margin-bottom: 2mm; }
  .pd-couple-label { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 15pt; color: #26181E; margin-bottom: 3mm; }
  .pd-radar-sub { text-align: center; font-size: 10pt; font-weight: 800; color: #A82E42; margin-top: 2mm; }
  .pd-vs { border: 1px solid #EADDE0; border-radius: 3mm; padding: 4.5mm 5mm; margin-bottom: 3.5mm; background: #FFFDFC; }
  .pd-vs-topic { font-size: 10.5pt; font-weight: 800; color: #26181E; text-align: center; margin-bottom: 2.5mm; }
  .pd-vs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm; }
  .pd-vs-side { border-radius: 2.5mm; padding: 3mm 3.5mm; font-size: 8.8pt; line-height: 1.8; color: #26181E; }
  .pd-vs-side.me { background: #FBF0F2; border: 1px solid rgba(216,72,94,0.22); }
  .pd-vs-side.you { background: #EFF1FB; border: 1px solid rgba(79,91,213,0.22); }
  .pd-vs-who { font-size: 7.5pt; font-weight: 800; letter-spacing: 0.15em; margin-bottom: 1mm; }
  .pd-vs-side.me .pd-vs-who { color: #A82E42; }
  .pd-vs-side.you .pd-vs-who { color: #4F5BD5; }
  .pd-grade { text-align: center; border: 1.5px solid rgba(216,72,94,0.35); border-radius: 3mm; padding: 6mm 7mm; background: linear-gradient(165deg, #FBF0F2 0%, #FFFDFC 55%); margin-top: 5mm; }
  .pd-grade-badge { width: 18mm; height: 18mm; margin: 0 auto 2mm; border-radius: 4mm; background: linear-gradient(135deg, #F06A7E, #A82E42); color: #FFF0F2; font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 20pt; display: flex; align-items: center; justify-content: center; }
  .pd-grade-label { font-size: 11pt; font-weight: 800; color: #26181E; margin-bottom: 4mm; }
  .pd-grade-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; text-align: left; }
  .pd-grade-col { border-radius: 2.5mm; padding: 3.5mm 4mm; font-size: 8.8pt; line-height: 1.8; color: #3D2E35; }
  .pd-grade-col-title { font-weight: 800; font-size: 8.5pt; letter-spacing: 0.1em; margin-bottom: 1.5mm; }

  /* ── 마치며 ── */
  .pd-closing { text-align: center; padding-top: 48mm; }
  .pd-closing-logo {
    width: 18mm; height: 18mm; border-radius: 50%;
    object-fit: cover; display: block; margin: 0 auto 5mm;
    border: 0.4mm solid rgba(216,72,94,0.3);
  }
  .pd-closing-brand { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 13pt; color: #D8485E; letter-spacing: 0.4em; text-indent: 0.4em; margin-bottom: 4mm; }
  .pd-closing-title { font-family: 'Noto Serif KR', serif; font-weight: 900; font-size: 20pt; color: #26181E; }
  .pd-closing-text { font-size: 10pt; line-height: 2.2; color: #3D2E35; max-width: 140mm; margin: 0 auto; }
  .pd-closing-foot { margin-top: 18mm; font-size: 8pt; color: #A08D96; line-height: 2; }
`;
