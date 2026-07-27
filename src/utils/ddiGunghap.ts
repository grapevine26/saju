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
    ZHI, ZHI_ANIMAL, getZhiOhhaeng, JIJANGGAN_MAP, getCheonganHap,
    getJijiYukhap, getJijiSamhapBan, getJijiBanghapBan,
    getJijiChung, getJijiHyeong, getJijiHae,
} from './sajuMapper';
import { classifyRelationType, hapGradeFromScore } from './compatibilityCalc';
import { DDI_PROFILES, DdiProfile } from './ddiProfiles';

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

/** 지장간(지지 속에 숨은 천간) 사이의 천간합 — 겉으로 안 드러나는 끌림 */
export interface JijangganLink {
    gan1: string; gan2: string; description: string; element: string;
}

export interface DdiGunghapResult {
    zhi1: string; zhi2: string; animal1: string; animal2: string;
    profile1: DdiProfile; profile2: DdiProfile;
    hapList: { type: string; description: string }[];
    clashList: { type: string; description: string }[];
    jijangganLinks: JijangganLink[];
    ohhaengRelation: '상생' | '상극' | '비화' | '무관';
    ohhaengDesc: string;
    attractionScore: number;
    conflictScore: number;
    complementScore: number;
    totalScore: number;
    grade: string;
    badge: string;
    badgeDesc: string;
    /** 관계가 실제로 어떻게 흘러가는지 — 관계 유형 × 오행 조합으로 만든 서사 */
    narrative: string;
    /** 이 조합이 잘 지내려면 */
    advice: string;
    /** 부딪히기 쉬운 지점 — 두 사람의 약점이 어떻게 맞물리는지 */
    frictionPoint: string;
}

/**
 * 지장간 천간합 분석 — 지지 안에 숨은 천간끼리 합이 되는지 본다.
 * 겉(지지)으로는 합이 없어도 속으로 당기는 구조가 있는 경우를 잡아낸다.
 */
export const analyzeJijanggan = (zhi1: string, zhi2: string): JijangganLink[] => {
    const links: JijangganLink[] = [];
    const seen = new Set<string>();
    for (const g1 of JIJANGGAN_MAP[zhi1] ?? []) {
        for (const g2 of JIJANGGAN_MAP[zhi2] ?? []) {
            const hap = getCheonganHap(g1, g2);
            if (hap && !seen.has(hap.description)) {
                seen.add(hap.description);
                links.push({ gan1: g1, gan2: g2, description: hap.description, element: hap.element ?? '' });
            }
        }
    }
    return links;
};

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

    const jijangganLinks = analyzeJijanggan(zhi1, zhi2);

    let attractionScore = 30;
    for (const h of hapList) {
        if (h.type === '지지육합') attractionScore += 28;
        else if (h.type === '지지삼합(반합)') attractionScore += 20;
        else if (h.type === '지지방합(반합)') attractionScore += 14;
    }
    if (ohhaengRelation === '상생') attractionScore += 14;
    if (ohhaengRelation === '비화') attractionScore += 6;
    // 지장간 합은 겉으로 안 드러나는 끌림이라 가중치를 낮게 준다 (지지합의 1/4 수준)
    attractionScore += Math.min(14, jijangganLinks.length * 7);
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
    else if (ohhaengRelation === '상극') {
        // 육합·삼합이 성립하면 오행의 극은 합이 중재하는 것으로 본다.
        // (예: 자축합토 — 토극수 관계지만 육합이라 고전에서 최고 궁합으로 친다)
        // 이 완화가 없으면 합으로 끌림을 올려놓고 극으로 보완을 깎아 이중 상쇄가 일어난다.
        const mediatedByHap = hapList.some(h => h.type === '지지육합' || h.type === '지지삼합(반합)');
        complementScore = mediatedByHap ? 55 : 38;
    }

    const totalScore = Math.max(0, Math.min(100, Math.round(
        attractionScore * 0.4 + complementScore * 0.3 + (100 - conflictScore) * 0.3
    )));
    const grade = hapGradeFromScore(totalScore);
    const { badge, desc: badgeDesc } = classifyRelationType(attractionScore, conflictScore, complementScore);

    const profile1 = DDI_PROFILES[zhi1];
    const profile2 = DDI_PROFILES[zhi2];
    const a1 = ZHI_ANIMAL[zhi1], a2 = ZHI_ANIMAL[zhi2];
    const sameDdi = zhi1 === zhi2;

    const narrative = buildNarrative({ a1, a2, sameDdi, hapList, clashList, jijangganLinks, ohhaengRelation });
    const frictionPoint = buildFrictionPoint({ a1, a2, sameDdi, profile1, profile2, clashList });
    const advice = buildAdvice({ a1, a2, sameDdi, hapList, clashList, ohhaengRelation });

    return {
        zhi1, zhi2, animal1: a1, animal2: a2,
        profile1, profile2,
        hapList, clashList, jijangganLinks, ohhaengRelation, ohhaengDesc,
        attractionScore, conflictScore, complementScore,
        totalScore, grade, badge, badgeDesc,
        narrative, advice, frictionPoint,
    };
};

// ========================================================================
// 서사·조언 생성 — 관계 유형 × 오행 × 두 띠의 약점 조합으로 만든다.
// AI를 쓰지 않는 이유: 78페이지를 매번 생성하면 비용도 들고 같은 조합이 매번
// 달라져 "같은 입력이면 같은 결과"라는 브랜드 원칙과 어긋난다.
// ========================================================================

type NarrativeInput = {
    a1: string; a2: string; sameDdi: boolean;
    hapList: { type: string; description: string }[];
    clashList: { type: string; description: string }[];
    jijangganLinks: JijangganLink[];
    ohhaengRelation: DdiGunghapResult['ohhaengRelation'];
};

const buildNarrative = ({ a1, a2, sameDdi, hapList, clashList, jijangganLinks, ohhaengRelation }: NarrativeInput): string => {
    const parts: string[] = [];
    const hasYukhap = hapList.some(h => h.type === '지지육합');
    const hasSamhap = hapList.some(h => h.type === '지지삼합(반합)');
    const hasBanghap = hapList.some(h => h.type === '지지방합(반합)');
    const hasChung = clashList.some(c => c.type === '지지충');
    const hasHyeong = clashList.some(c => c.type === '지지형');
    const hasHae = clashList.some(c => c.type === '지지해');

    if (sameDdi) {
        parts.push(`같은 ${a1}띠끼리는 서로를 설명할 필요가 없어요. 말하지 않아도 왜 그러는지 알고, 그래서 초반에 빠르게 가까워져요.`);
    } else if (hasYukhap) {
        parts.push(`${a1}띠와 ${a2}띠는 서로를 끌어당기는 짝이에요. 처음 만났을 때부터 대화가 자연스럽고, 억지로 맞추지 않아도 리듬이 맞는 편이에요.`);
    } else if (hasSamhap) {
        parts.push(`${a1}띠와 ${a2}띠는 같은 방향을 보는 조합이에요. 연애 감정보다 먼저 "이 사람이랑은 말이 통한다"는 느낌이 오는 쪽이에요.`);
    } else if (hasBanghap) {
        parts.push(`${a1}띠와 ${a2}띠는 비슷한 결을 가진 조합이에요. 극적인 끌림은 아니지만, 같이 있으면 편안한 관계로 자리 잡아요.`);
    } else if (hasChung) {
        parts.push(`${a1}띠와 ${a2}띠는 정면으로 부딪히는 자리에 있어요. 성향이 정반대라 서로를 이해하기 어려운 만큼, 그 낯섦이 강한 끌림이 되기도 해요.`);
    } else if (hasHyeong) {
        parts.push(`${a1}띠와 ${a2}띠는 가까워질수록 서로를 시험하게 되는 조합이에요. 관계가 깊어지는 과정에서 한 번은 크게 부딪히는 편이에요.`);
    } else if (hasHae) {
        parts.push(`${a1}띠와 ${a2}띠는 큰 싸움은 없는데 이상하게 서운함이 남는 조합이에요. 겉으로 드러나지 않는 지점에서 어긋나요.`);
    } else {
        parts.push(`${a1}띠와 ${a2}띠 사이에는 강하게 끌어당기거나 밀어내는 힘이 없어요. 첫인상보다 시간을 두고 천천히 판단해야 하는 관계예요.`);
    }

    if (ohhaengRelation === '상생') {
        parts.push('기운으로 보면 한쪽이 다른 쪽을 살려주는 구조라, 오래 만날수록 서로가 편해지는 방향으로 흘러가요.');
    } else if (ohhaengRelation === '상극') {
        parts.push('기운으로는 한쪽이 다른 쪽을 누르는 구조예요. 그래서 긴장이 있는데, 그 긴장이 관계를 지루하지 않게 만드는 힘이기도 해요.');
    } else if (ohhaengRelation === '비화') {
        parts.push('기운의 결이 같아서 서로를 잘 이해해요. 다만 같은 약점도 나눠 갖고 있어서, 둘 다 흔들릴 때 붙잡아 줄 사람이 없어요.');
    }

    if (jijangganLinks.length > 0 && !hasYukhap) {
        parts.push('겉으로 드러나는 합은 없지만, 속으로 당기는 구조가 숨어 있어요. 주변에서 보기엔 안 어울리는데 정작 본인들은 계속 신경 쓰이는 조합이에요.');
    }

    return parts.join(' ');
};

type FrictionInput = {
    a1: string; a2: string; sameDdi: boolean;
    profile1: DdiProfile; profile2: DdiProfile;
    clashList: { type: string; description: string }[];
};

const buildFrictionPoint = ({ a1, a2, sameDdi, profile1, profile2, clashList }: FrictionInput): string => {
    if (sameDdi) {
        return `같은 약점을 공유한다는 게 이 조합의 가장 큰 위험이에요. ${profile1.weakness} 둘 다 그러니까, 한쪽이 무너질 때 다른 쪽도 같이 무너져요.`;
    }
    const intro = clashList.length > 0
        ? '이미 부딪히는 자리에 있는 데다, 각자의 약한 지점까지 맞물려요.'
        : '큰 충돌은 없어도, 각자의 약한 지점이 맞물리는 순간이 와요.';
    return `${intro} ${a1}띠는 ${profile1.weakness} ${a2}띠는 ${profile2.weakness}`;
};

type AdviceInput = {
    a1: string; a2: string; sameDdi: boolean;
    hapList: { type: string; description: string }[];
    clashList: { type: string; description: string }[];
    ohhaengRelation: DdiGunghapResult['ohhaengRelation'];
};

const buildAdvice = ({ a1, a2, sameDdi, hapList, clashList, ohhaengRelation }: AdviceInput): string => {
    if (sameDdi) {
        return `서로 너무 잘 알기 때문에 오히려 대화가 줄어요. "당연히 알겠지" 하고 넘기지 말고 말로 확인하는 습관이 이 조합엔 특히 중요해요.`;
    }
    if (clashList.some(c => c.type === '지지충')) {
        return `맞추려고 애쓰기보다 다르다는 걸 인정하는 쪽이 나아요. 이 조합은 상대를 바꾸려는 순간 관계가 급격히 나빠져요. 각자의 영역을 남겨두면 오래 갈 수 있어요.`;
    }
    if (clashList.some(c => c.type === '지지형')) {
        return `갈등이 왔을 때 이기려 들지 않는 게 핵심이에요. 이 조합은 한 번의 큰 다툼을 어떻게 넘기느냐로 이후가 갈려요.`;
    }
    if (clashList.some(c => c.type === '지지해')) {
        return `서운한 걸 그때그때 말해야 해요. 이 조합은 쌓아두면 원인을 못 찾는 상태로 멀어져요.`;
    }
    if (hapList.length > 0) {
        return `잘 맞는 만큼 긴장이 풀리기 쉬워요. 편한 게 당연해지면 서로에게 소홀해지니, 이 조합은 익숙해진 뒤가 더 중요해요.`;
    }
    if (ohhaengRelation === '상생') {
        return `한쪽이 주로 챙기는 구조라 균형이 기울기 쉬워요. 받는 쪽이 그걸 알아채고 표현해주면 오래 갈 수 있는 조합이에요.`;
    }
    return `극적인 끌림이 없는 대신 부딪힘도 적어요. 이런 조합은 시간을 들여 쌓는 쪽이 맞고, 첫인상만으로 판단하면 놓치기 쉬워요.`;
};

/**
 * 받침 유무에 따라 조사를 고른다. 천간합 이름이 토·금·수·목·화로 끝나는데
 * 받침이 있는 건 금·목뿐이라, 조사를 고정하면 5개 중 3개가 틀린 문장이 된다.
 * (sajuMapper.getOhhaengBalance가 쓰는 판정과 같은 방식)
 */
export const josa = (word: string, withBatchim: string, withoutBatchim: string): string => {
    const last = word.trim().slice(-1);
    const code = last.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return withoutBatchim; // 한글이 아니면 기본형
    return code % 28 > 0 ? withBatchim : withoutBatchim;
};

/** 이 띠 기준으로 12개 상대를 궁합 점수순 정렬 — 베스트/워스트 노출 및 내부 링크용 */
export const getRankedMatches = (zhi: string): { zhi: string; animal: string; score: number; grade: string; badge: string }[] =>
    ZHI.map((other) => {
        const [c1, c2] = canonicalOrder(zhi, other);
        const r = calculateDdiGunghap(c1, c2);
        return { zhi: other, animal: ZHI_ANIMAL[other], score: r.totalScore, grade: r.grade, badge: r.badge };
    }).sort((x, y) => y.score - x.score);
