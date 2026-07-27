/**
 * 띠 궁합 (ddiGunghap.ts) — pSEO용 약식 궁합 계산기
 *
 * 정밀 궁합(compatibilityCalc.ts)은 네 기둥(년월일시) 전체가 있어야 계산되지만,
 * "쥐띠 소띠 궁합" 검색은 태어난 해(년지=띠) 하나만 갖고 찾는다. 년지만으로도
 * sajuMapper의 합충형해 함수는 그대로 쓸 수 있어 진짜 명리 계산이 가능하다 —
 * 다만 하나의 기둥만 보므로 정밀 리포트보다 근거가 얕다는 걸 페이지에 항상 밝힌다.
 *
 * 점수 배점·등급·궁합 유형 분류는 compatibilityCalc.ts와 같은 함수(hapGradeFromScore·
 * classifyRelationType)를 그대로 재사용해 사이트 전체에서 일관된 기준을 쓴다.
 */
import {
    ZHI, ZHI_ANIMAL, getZhiOhhaeng,
    getJijiYukhap, getJijiSamhapBan, getJijiBanghapBan,
    getJijiChung, getJijiHyeong, getJijiHae,
} from './sajuMapper';
import { classifyRelationType, hapGradeFromScore } from './compatibilityCalc';

const ANIMAL_TO_ZHI: Record<string, string> = Object.fromEntries(
    Object.entries(ZHI_ANIMAL).map(([zhi, animal]) => [animal, zhi])
);

export const animalToZhi = (animal: string): string | null => ANIMAL_TO_ZHI[animal] ?? null;

const slugPart = (zhi: string): string => `${ZHI_ANIMAL[zhi]}띠`;

export const buildSlug = (zhi1: string, zhi2: string): string => `${slugPart(zhi1)}-${slugPart(zhi2)}`;

const isCanonicalOrder = (zhi1: string, zhi2: string): boolean => ZHI.indexOf(zhi1) <= ZHI.indexOf(zhi2);

export const canonicalOrder = (zhi1: string, zhi2: string): [string, string] =>
    isCanonicalOrder(zhi1, zhi2) ? [zhi1, zhi2] : [zhi2, zhi1];

/** "쥐띠-소띠" → ['자','축'] | null (잘못된 슬러그). Next.js 동적 라우트 params가 percent-encoding
 *  그대로 들어오는 경우가 있어(%EC%A5%90... 등) 여기서 한 번 디코딩을 보장한다. */
export const parseSlug = (rawSlug: string): [string, string] | null => {
    let slug = rawSlug;
    try { slug = decodeURIComponent(rawSlug); } catch { /* 이미 디코딩된 문자열이면 그대로 사용 */ }
    const parts = slug.split('-');
    if (parts.length !== 2) return null;
    const zhi1 = animalToZhi(parts[0].replace(/띠$/, ''));
    const zhi2 = animalToZhi(parts[1].replace(/띠$/, ''));
    if (!zhi1 || !zhi2) return null;
    return [zhi1, zhi2];
};

/** 전체 144개 순서쌍 (자기자신 포함) — 정적 생성용. 정규 순서가 아닌 것도 포함해 리다이렉트 처리한다 */
export const getAllOrderedPairs = (): [string, string][] => {
    const pairs: [string, string][] = [];
    for (const z1 of ZHI) for (const z2 of ZHI) pairs.push([z1, z2]);
    return pairs;
};

/** 정규 순서 78개 — 사이트맵·허브 페이지용 (중복 없는 실제 페이지 수) */
export const getCanonicalPairs = (): [string, string][] =>
    getAllOrderedPairs().filter(([a, b]) => isCanonicalOrder(a, b));

const SAENG: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const GEUK: Record<string, string> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

export interface DdiGunghapResult {
    zhi1: string; zhi2: string; animal1: string; animal2: string;
    hapList: { type: string; description: string }[];
    clashList: { type: string; description: string }[];
    ohhaengRelation: '상생' | '상극' | '비화' | '무관';
    ohhaengDesc: string;
    attractionScore: number;
    conflictScore: number;
    complementScore: number;
    totalScore: number;
    grade: string;
    badge: string;
    badgeDesc: string;
}

export const calculateDdiGunghap = (zhi1: string, zhi2: string): DdiGunghapResult => {
    const hapList: { type: string; description: string }[] = [];
    const clashList: { type: string; description: string }[] = [];

    const yukhap = getJijiYukhap(zhi1, zhi2); if (yukhap) hapList.push(yukhap);
    const samhap = getJijiSamhapBan(zhi1, zhi2); if (samhap) hapList.push(samhap);
    const banghap = getJijiBanghapBan(zhi1, zhi2); if (banghap) hapList.push(banghap);
    const chung = getJijiChung(zhi1, zhi2); if (chung) clashList.push(chung);
    const hyeong = getJijiHyeong(zhi1, zhi2); if (hyeong) clashList.push(hyeong);
    const hae = getJijiHae(zhi1, zhi2); if (hae) clashList.push(hae);

    const oh1 = getZhiOhhaeng(zhi1), oh2 = getZhiOhhaeng(zhi2);
    let ohhaengRelation: DdiGunghapResult['ohhaengRelation'] = '무관';
    let ohhaengDesc = '';
    if (oh1 && oh2) {
        if (oh1 === oh2) {
            ohhaengRelation = '비화';
            ohhaengDesc = `둘 다 ${oh1} 기운이라 기질이 비슷해요. 서로를 잘 이해하지만, 같은 약점도 같이 갖고 있어요.`;
        } else if (SAENG[oh1] === oh2) {
            ohhaengRelation = '상생';
            ohhaengDesc = `${ZHI_ANIMAL[zhi1]}띠(${oh1})가 ${ZHI_ANIMAL[zhi2]}띠(${oh2})를 살리는 상생 구조예요. ${ZHI_ANIMAL[zhi1]}띠가 주로 챙기고, ${ZHI_ANIMAL[zhi2]}띠는 받는 쪽이에요.`;
        } else if (SAENG[oh2] === oh1) {
            ohhaengRelation = '상생';
            ohhaengDesc = `${ZHI_ANIMAL[zhi2]}띠(${oh2})가 ${ZHI_ANIMAL[zhi1]}띠(${oh1})를 살리는 상생 구조예요. ${ZHI_ANIMAL[zhi2]}띠가 주로 챙기고, ${ZHI_ANIMAL[zhi1]}띠는 받는 쪽이에요.`;
        } else {
            ohhaengRelation = '상극';
            const attacker = GEUK[oh1] === oh2 ? zhi1 : zhi2;
            const defender = attacker === zhi1 ? zhi2 : zhi1;
            ohhaengDesc = `${ZHI_ANIMAL[attacker]}띠(${getZhiOhhaeng(attacker)})가 ${ZHI_ANIMAL[defender]}띠(${getZhiOhhaeng(defender)})를 누르는 상극 구조예요. 긴장감이 있는 만큼, 그게 끌림이 되기도 해요.`;
        }
    }

    let attractionScore = 30;
    for (const h of hapList) {
        if (h.type === '지지육합') attractionScore += 28;
        else if (h.type === '지지삼합(반합)') attractionScore += 20;
        else if (h.type === '지지방합(반합)') attractionScore += 14;
    }
    if (ohhaengRelation === '상생') attractionScore += 14;
    if (ohhaengRelation === '비화') attractionScore += 6;
    attractionScore = Math.max(0, Math.min(100, attractionScore));

    let conflictScore = 8;
    for (const c of clashList) {
        if (c.type === '지지충') conflictScore += 28;
        else if (c.type === '지지형') conflictScore += 20;
        else if (c.type === '지지해') conflictScore += 16;
    }
    conflictScore = Math.max(0, Math.min(100, conflictScore));

    let complementScore = 50;
    if (ohhaengRelation === '상생') complementScore = 80;
    else if (ohhaengRelation === '비화') complementScore = 55;
    else if (ohhaengRelation === '상극') complementScore = 38;

    const totalScore = Math.max(0, Math.min(100, Math.round(
        attractionScore * 0.4 + complementScore * 0.3 + (100 - conflictScore) * 0.3
    )));
    const grade = hapGradeFromScore(totalScore);
    const { badge, desc: badgeDesc } = classifyRelationType(attractionScore, conflictScore, complementScore);

    return {
        zhi1, zhi2, animal1: ZHI_ANIMAL[zhi1], animal2: ZHI_ANIMAL[zhi2],
        hapList, clashList, ohhaengRelation, ohhaengDesc,
        attractionScore, conflictScore, complementScore,
        totalScore, grade, badge, badgeDesc,
    };
};
