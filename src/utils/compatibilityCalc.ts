/**
 * 궁합 분석 엔진 (compatibilityCalc.ts)
 * 두 사람의 만세력 데이터를 바탕으로 합/충/형/해를 분석하고 재회 가능성 점수를 산출한다.
 */
import { BaziCalculationResult } from './baziCalc';
import {
    getCheonganHap, getJijiYukhap, getJijiChung,
    getJijiHyeong, getJijiHae, getOhhaengBalance,
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
    // ─────────────────────────────────────
    let dayMasterRelation = '';
    if (dayGanHap) {
        dayMasterRelation = `일간 ${dayGanHap.description} — 정신적으로 강하게 끌리는 관계`;
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
        attractionScore, conflictScore, complementScore
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
    ohhaengAnalysis, attractionScore, conflictScore, complementScore
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
}): string => {
    const lines: string[] = [];

    lines.push(`[궁합 핵심 수치]`);
    lines.push(`- 끌림 지수: ${attractionScore}/100`);
    lines.push(`- 갈등 지수: ${conflictScore}/100`);
    lines.push(`- 오행 보완도: ${complementScore}/100`);
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
