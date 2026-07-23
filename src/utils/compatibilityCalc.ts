/**
 * 궁합 분석 엔진 (compatibilityCalc.ts)
 * 두 사람의 만세력 데이터를 바탕으로 합/충/형/해를 분석하고 재회 가능성 점수를 산출한다.
 */
import { BaziCalculationResult } from './baziCalc';
import {
    getCheonganHap, getJijiYukhap, getJijiChung,
    getJijiHyeong, getJijiHae, getOhhaengBalance,
    getJijiSamhapBan, getJijiBanghapBan,
    HapResult, ClashResult
} from './sajuMapper';

// ========================================================================
// 타입 정의
// ========================================================================

/** 궁합 분석 결과 */
export interface CompatibilityResult {
    reunionScore: number;         // 재회 가능성 점수 (0~100)
    attractionScore: number;      // 끌림 지수 (0~100)
    conflictScore: number;        // 갈등 지수 (0~100)
    complementScore: number;      // 오행 보완 점수 (0~100)

    hapList: HapResult[];         // 합 목록
    chungList: ClashResult[];     // 충 목록
    hyeongList: ClashResult[];    // 형 목록
    haeList: ClashResult[];       // 해 목록

    dayMasterRelation: string;    // 일간끼리의 관계 요약
    spouseHouseRelation: string;  // 일지(부부궁)끼리의 관계 요약

    ohhaengAnalysis: string;      // 오행 보완 분석 요약

    // AI 프롬프트에 전달할 요약 문자열
    promptSummary: string;
}

// ========================================================================
// 내부 유틸리티
// ========================================================================

/** 만세력에서 천간/지지 배열 추출 (년/월/일/시 순서) */
const extractPillars = (manseryeok: BaziCalculationResult['manseryeok']) => {
    const gans: string[] = [];
    const zhis: string[] = [];

    const pillars = [manseryeok.year, manseryeok.month, manseryeok.day, manseryeok.time];
    for (const p of pillars) {
        if (p) {
            gans.push(p.gan);
            zhis.push(p.zhi);
        }
    }
    return { gans, zhis };
};

// ========================================================================
// 일간 생극(生剋) 관계 — 합충만으로는 놓치는 고전 궁합의 핵심 축
// (예: 을목×무토 = 합은 없지만 '산에 뿌리내리는 꽃'의 유정한 상극 구조)
// ========================================================================

const GAN_OHHAENG: Record<string, string> = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
const GAN_YANG: Record<string, boolean> = { 갑: true, 을: false, 병: true, 정: false, 무: true, 기: false, 경: true, 신: false, 임: true, 계: false };
const SAENG: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // A가 B를 생
const GEUK: Record<string, string> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };  // A가 B를 극

/** 나의 일간 기준으로 상대 일간이 어떤 십신인지 */
const crossSipsin = (myGan: string, otherGan: string): string | null => {
    const myOh = GAN_OHHAENG[myGan], otOh = GAN_OHHAENG[otherGan];
    if (!myOh || !otOh) return null;
    const same = GAN_YANG[myGan] === GAN_YANG[otherGan];
    if (myOh === otOh) return same ? '비견' : '겁재';
    if (SAENG[myOh] === otOh) return same ? '식신' : '상관';
    if (SAENG[otOh] === myOh) return same ? '편인' : '정인';
    if (GEUK[myOh] === otOh) return same ? '편재' : '정재';
    if (GEUK[otOh] === myOh) return same ? '편관' : '정관';
    return null;
};

const SIPSIN_LOVE_MEANING: Record<string, string> = {
    비견: '대등하게 나란히 걷는 동료 같은 존재',
    겁재: '경쟁심과 승부욕을 자극하는 존재',
    식신: '편안하게 마음을 표현하게 만드는 존재',
    상관: '감정을 자극하고 뒤흔드는 존재',
    편재: '재미와 설렘, 소유욕을 일으키는 존재',
    정재: '안정적으로 곁에 두고 지키고 싶은 존재',
    편관: '긴장감과 강한 끌림을 동시에 주는 존재',
    정관: '존중하게 되고 의지하게 되는 존재',
    편인: '독특한 방식으로 나를 품어주는 존재',
    정인: '조건 없이 기대고 싶은 안식처 같은 존재',
};

/** 일간 생극 구조 분석 → 관계 서사 + 끌림 가점 */
const analyzeDayGanStructure = (myGan: string, partnerGan: string): { desc: string; bonus: number } => {
    const myOh = GAN_OHHAENG[myGan], ptOh = GAN_OHHAENG[partnerGan];
    if (!myOh || !ptOh) return { desc: '', bonus: 0 };
    const mySip = crossSipsin(myGan, partnerGan);   // 나에게 상대는?
    const ptSip = crossSipsin(partnerGan, myGan);   // 상대에게 나는?
    const sipText = mySip && ptSip
        ? ` 나에게 그 사람은 '${mySip}'(${SIPSIN_LOVE_MEANING[mySip]}), 그 사람에게 나는 '${ptSip}'(${SIPSIN_LOVE_MEANING[ptSip]})`
        : '';

    if (myOh === ptOh) {
        return { desc: `일간 ${myGan}(${myOh})×${partnerGan}(${ptOh}) — 같은 기질이 나란히 선 비화(比和) 구조. 서로를 가장 잘 이해하지만 양보가 어려운 관계.${sipText}`, bonus: 5 };
    }
    if (SAENG[ptOh] === myOh) {
        return { desc: `일간 ${myGan}(${myOh})×${partnerGan}(${ptOh}) — 그 사람의 기운이 나를 살리는 상생(相生) 구조. 함께 있으면 내가 채워지는 관계.${sipText}`, bonus: 12 };
    }
    if (SAENG[myOh] === ptOh) {
        return { desc: `일간 ${myGan}(${myOh})×${partnerGan}(${ptOh}) — 내 기운이 그 사람을 살리는 상생(相生) 구조. 내가 아낌없이 주게 되는 관계.${sipText}`, bonus: 12 };
    }
    if (GEUK[myOh] === ptOh) {
        return { desc: `일간 ${myGan}(${myOh})×${partnerGan}(${ptOh}) — 내가 그 사람을 붙잡는 유정(有情)한 상극 구조. 고전 궁합에서 서로를 소유와 책임으로 묶는 인연으로 본다.${sipText}`, bonus: 10 };
    }
    return { desc: `일간 ${myGan}(${myOh})×${partnerGan}(${ptOh}) — 그 사람이 나를 이끄는 유정(有情)한 상극 구조. 긴장감이 곧 끌림이 되는 인연.${sipText}`, bonus: 10 };
};

// ========================================================================
// 메인 분석 함수
// ========================================================================

/**
 * 두 사람의 궁합을 분석하여 재회 가능성 점수를 산출한다.
 * @param myBazi - 나의 만세력 계산 결과
 * @param partnerBazi - 상대방의 만세력 계산 결과
 */
export const calculateCompatibility = (
    myBazi: BaziCalculationResult,
    partnerBazi: BaziCalculationResult
): CompatibilityResult => {
    const my = extractPillars(myBazi.manseryeok);
    const partner = extractPillars(partnerBazi.manseryeok);

    const hapList: HapResult[] = [];
    const chungList: ClashResult[] = [];
    const hyeongList: ClashResult[] = [];
    const haeList: ClashResult[] = [];

    // ─────────────────────────────────────
    // 1. 모든 기둥 조합에서 합/충/형/해 탐색
    // ─────────────────────────────────────
    // 천간끼리 (나의 4천간 × 상대의 4천간)
    for (const myGan of my.gans) {
        for (const partnerGan of partner.gans) {
            const hap = getCheonganHap(myGan, partnerGan);
            if (hap) hapList.push(hap);
        }
    }

    // 지지끼리 (나의 4지지 × 상대의 4지지)
    for (const myZhi of my.zhis) {
        for (const partnerZhi of partner.zhis) {
            const yukhap = getJijiYukhap(myZhi, partnerZhi);
            if (yukhap) hapList.push(yukhap);

            // 삼합·방합 반합 — 육합만 보면 삼합 커플이 저평가된다
            const samhap = getJijiSamhapBan(myZhi, partnerZhi);
            if (samhap) hapList.push(samhap);
            const banghap = getJijiBanghapBan(myZhi, partnerZhi);
            if (banghap) hapList.push(banghap);

            const chung = getJijiChung(myZhi, partnerZhi);
            if (chung) chungList.push(chung);

            const hyeong = getJijiHyeong(myZhi, partnerZhi);
            if (hyeong) hyeongList.push(hyeong);

            const hae = getJijiHae(myZhi, partnerZhi);
            if (hae) haeList.push(hae);
        }
    }

    // 중복 제거 (같은 설명은 하나만 남김)
    const dedup = <T extends { description: string }>(arr: T[]): T[] => {
        const seen = new Set<string>();
        return arr.filter(item => {
            if (seen.has(item.description)) return false;
            seen.add(item.description);
            return true;
        });
    };

    const uniqueHap = dedup(hapList);
    const uniqueChung = dedup(chungList);
    const uniqueHyeong = dedup(hyeongList);
    const uniqueHae = dedup(haeList);

    // ─────────────────────────────────────
    // 2. 끌림 점수 계산 (합 기반)
    // ─────────────────────────────────────
    // 천간합은 정신적 끌림 (+15), 지지합은 현실적 끌림 (+12)
    let attractionRaw = 30; // 기본값

    for (const hap of uniqueHap) {
        if (hap.type === '천간합') attractionRaw += 15;
        if (hap.type === '지지육합') attractionRaw += 12;
        if (hap.type === '지지삼합(반합)') attractionRaw += 10;
        if (hap.type === '지지방합(반합)') attractionRaw += 7;
    }

    // 일간끼리 합이면 특별 보너스 (+20)
    const dayGanHap = getCheonganHap(
        myBazi.manseryeok.day?.gan || '',
        partnerBazi.manseryeok.day?.gan || ''
    );
    if (dayGanHap) attractionRaw += 20;

    // 일지끼리 합이면 부부궁 합 (+18)
    const dayZhiHap = getJijiYukhap(
        myBazi.manseryeok.day?.zhi || '',
        partnerBazi.manseryeok.day?.zhi || ''
    );
    if (dayZhiHap) attractionRaw += 18;

    // 일간 생극 구조 가점 — 합이 없어도 상생·유정한 상극은 고전 궁합의 끌림 축
    attractionRaw += analyzeDayGanStructure(
        myBazi.manseryeok.day?.gan || '',
        partnerBazi.manseryeok.day?.gan || ''
    ).bonus;

    const attractionScore = Math.min(100, attractionRaw);

    // ─────────────────────────────────────
    // 3. 갈등 점수 계산 (충/형/해 기반)
    // ─────────────────────────────────────
    let conflictRaw = 10; // 기본값 (어느 관계든 갈등 소지는 있음)

    for (const c of uniqueChung) conflictRaw += 12;
    for (const h of uniqueHyeong) conflictRaw += 10;
    for (const h of uniqueHae) conflictRaw += 8;

    // 일지끼리 충이면 특별 가중치 (+15)
    const dayZhiChung = getJijiChung(
        myBazi.manseryeok.day?.zhi || '',
        partnerBazi.manseryeok.day?.zhi || ''
    );
    if (dayZhiChung) conflictRaw += 15;

    const conflictScore = Math.min(100, conflictRaw);

    // ─────────────────────────────────────
    // 4. 오행 보완 점수
    // ─────────────────────────────────────
    const ohhaengResult = getOhhaengBalance(myBazi.ohhaengCounts, partnerBazi.ohhaengCounts);
    const complementScore = ohhaengResult.score;

    // ─────────────────────────────────────
    // 5. 일간 관계 분석 (핵심 궁합)
    // 합이 없어도 생극(상생·유정한 상극)과 서로에 대한 십신 관계가 고전 궁합의 본론이다
    // ─────────────────────────────────────
    const ganStructure = analyzeDayGanStructure(
        myBazi.manseryeok.day?.gan || '',
        partnerBazi.manseryeok.day?.gan || ''
    );
    let dayMasterRelation = '';
    if (dayGanHap) {
        dayMasterRelation = `일간 ${dayGanHap.description} — 정신적으로 강하게 끌리는 관계.${ganStructure.desc ? ` ${ganStructure.desc.split(' — ')[1] || ''}` : ''}`;
    } else if (ganStructure.desc) {
        dayMasterRelation = ganStructure.desc;
    } else {
        dayMasterRelation = `일간 합 없음 — 자연스러운 끌림보다는 의식적 노력이 필요한 관계`;
    }

    // ─────────────────────────────────────
    // 6. 부부궁 관계 분석
    // ─────────────────────────────────────
    let spouseHouseRelation = '';
    if (dayZhiHap) {
        spouseHouseRelation = `부부궁 ${dayZhiHap.description} — 함께 있으면 안정감을 느끼는 관계`;
    } else if (dayZhiChung) {
        spouseHouseRelation = `부부궁 ${dayZhiChung.description} — 자극과 충돌이 동반되는 관계`;
    } else {
        spouseHouseRelation = '부부궁 특별한 합충 없음 — 평범한 관계 에너지';
    }

    // ─────────────────────────────────────
    // 7. 재회 가능성 종합 점수 (가중 합산)
    // ─────────────────────────────────────
    // 끌림 40% + 오행보완 30% + (100 - 갈등) 30%
    const reunionScore = Math.round(
        attractionScore * 0.4 +
        complementScore * 0.3 +
        (100 - conflictScore) * 0.3
    );

    // ─────────────────────────────────────
    // 8. AI 프롬프트용 요약 문자열 생성
    // ─────────────────────────────────────
    const promptSummary = buildPromptSummary({
        uniqueHap, uniqueChung, uniqueHyeong, uniqueHae,
        dayMasterRelation, spouseHouseRelation,
        ohhaengAnalysis: ohhaengResult.analysis,
        attractionScore, conflictScore, complementScore,
        reunionScore: Math.max(0, Math.min(100, reunionScore))
    });

    return {
        reunionScore: Math.max(0, Math.min(100, reunionScore)),
        attractionScore,
        conflictScore,
        complementScore,
        hapList: uniqueHap,
        chungList: uniqueChung,
        hyeongList: uniqueHyeong,
        haeList: uniqueHae,
        dayMasterRelation,
        spouseHouseRelation,
        ohhaengAnalysis: ohhaengResult.analysis,
        promptSummary
    };
};

// ========================================================================
// AI 프롬프트 요약 생성
// ========================================================================

const buildPromptSummary = ({
    uniqueHap, uniqueChung, uniqueHyeong, uniqueHae,
    dayMasterRelation, spouseHouseRelation,
    ohhaengAnalysis, attractionScore, conflictScore, complementScore, reunionScore
}: {
    uniqueHap: HapResult[];
    uniqueChung: ClashResult[];
    uniqueHyeong: ClashResult[];
    uniqueHae: ClashResult[];
    dayMasterRelation: string;
    spouseHouseRelation: string;
    ohhaengAnalysis: string;
    attractionScore: number;
    conflictScore: number;
    complementScore: number;
    reunionScore: number;
}): string => {
    const lines: string[] = [];

    lines.push(`[궁합 핵심 수치]`);
    lines.push(`- 끌림 지수: ${attractionScore}/100`);
    lines.push(`- 갈등 지수: ${conflictScore}/100`);
    lines.push(`- 오행 보완도: ${complementScore}/100`);
    lines.push(`- 재회 가능성 점수(시스템 계산): ${reunionScore}/100`);
    lines.push('');

    lines.push(`[일주 관계]`);
    lines.push(`- ${dayMasterRelation}`);
    lines.push(`- ${spouseHouseRelation}`);
    lines.push('');

    if (uniqueHap.length > 0) {
        lines.push(`[합(合) — 끌림/유대]`);
        uniqueHap.forEach(h => lines.push(`- ${h.description} (${h.type})`));
        lines.push('');
    }

    if (uniqueChung.length > 0) {
        lines.push(`[충(沖) — 갈등/충돌]`);
        uniqueChung.forEach(c => lines.push(`- ${c.description}`));
        lines.push('');
    }

    if (uniqueHyeong.length > 0) {
        lines.push(`[형(刑) — 상처/시련]`);
        uniqueHyeong.forEach(h => lines.push(`- ${h.description}`));
        lines.push('');
    }

    if (uniqueHae.length > 0) {
        lines.push(`[해(害) — 은밀한 피해]`);
        uniqueHae.forEach(h => lines.push(`- ${h.description}`));
        lines.push('');
    }

    lines.push(`[오행 보완 분석]`);
    lines.push(`- ${ohhaengAnalysis}`);

    return lines.join('\n');
};

// ========================================================================
// 운명의 합(궁합 단독 상품) — 6항목 점수 앵커
// AI가 점수를 지어내면 전부 S급 인플레가 나므로, 기존 결정론 점수
// (끌림·갈등·보완)를 항목별 가중치로 섞어 시스템이 앵커를 확정한다.
// AI는 프롬프트에서 이 값 기준 ±5 조정만 허용된다.
// ========================================================================

/** 운명의 합 6항목 점수 (0~100) */
export interface HapScores {
    romance: number;        // 연애궁합
    marriage: number;       // 결혼궁합
    wealth: number;         // 재물궁합
    personality: number;    // 성격궁합
    family: number;         // 가정궁합
    communication: number;  // 소통궁합
    total: number;          // 종합
}

/** 점수 → 등급 환산 (등급표는 AI가 아닌 코드가 확정) */
export const hapGradeFromScore = (score: number): string => {
    if (score >= 95) return 'S+';
    if (score >= 90) return 'S';
    if (score >= 84) return 'A+';
    if (score >= 77) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 62) return 'B';
    if (score >= 54) return 'C+';
    return 'C';
};

/** 종합 점수 → 별점 (5점 만점, 0.5 단위) */
export const hapStarsFromScore = (score: number): number => {
    return Math.max(2.5, Math.min(5, Math.round((score / 20) * 2) / 2));
};

/** 규칙 기반 관계 유형 배지 — AI 없이 점수 조합으로 분류 (무료 미리보기·유료 리포트 공용) */
export const classifyRelationType = (attraction: number, conflict: number, complement: number): { badge: string; desc: string } => {
    if (attraction >= 70 && conflict >= 45) return { badge: '불꽃 궁합', desc: '강렬하게 끌리고, 강렬하게 부딪히는 사이' };
    if (attraction >= 70) return { badge: '천생연분형', desc: '설명이 필요 없는 자연스러운 끌림' };
    if (complement >= 65) return { badge: '보완형 궁합', desc: '서로의 빈 곳을 정확히 채워주는 사이' };
    if (conflict >= 45) return { badge: '성장형 궁합', desc: '부딪히며 서로를 단련시키는 사이' };
    if (attraction < 50 && conflict < 35) return { badge: '스며드는 궁합', desc: '첫눈에 반하기보다 천천히 깊어지는 사이' };
    return { badge: '안정형 궁합', desc: '무리 없이 흘러가는 편안한 사이' };
};

export const calculateHapScores = (comp: CompatibilityResult): HapScores => {
    const a = comp.attractionScore;          // 끌림
    const h = 100 - comp.conflictScore;      // 조화 (갈등의 역)
    const c = comp.complementScore;          // 오행 보완

    // 합·충 개수 보정 — 합이 많으면 유대 가산, 충·형이 많으면 소통·가정 감산
    const hapBonus = Math.min(6, comp.hapList.length * 2);
    const clashPenalty = Math.min(8, (comp.chungList.length + comp.hyeongList.length) * 3);

    // 상업 보정: 원(raw) 혼합값은 40~70대에 몰려 유료 궁합 시장 기대(80~90대)보다
    // 박하게 읽힌다. 순위·편차는 그대로 두고 대역만 50+raw*0.5로 이동시킨다
    // (나쁜 조합 → 70대 초반, 평범 → 80 안팎, 좋은 조합 → 90대 — 등급 변별력 유지).
    const clamp = (v: number) => Math.round(Math.max(45, Math.min(97, 50 + v * 0.5)));
    const scores = {
        romance: clamp(a * 0.55 + h * 0.25 + c * 0.20 + hapBonus),
        marriage: clamp(c * 0.40 + h * 0.35 + a * 0.25 + hapBonus - clashPenalty * 0.5),
        wealth: clamp(c * 0.50 + h * 0.30 + a * 0.20),
        personality: clamp(a * 0.35 + h * 0.40 + c * 0.25),
        family: clamp(h * 0.45 + c * 0.35 + a * 0.20 - clashPenalty * 0.5),
        communication: clamp(h * 0.50 + a * 0.30 + c * 0.20 - clashPenalty),
    };
    const total = Math.round(
        (scores.romance + scores.marriage + scores.wealth +
            scores.personality + scores.family + scores.communication) / 6
    );
    return { ...scores, total };
};
