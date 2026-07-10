import { Ohaeng, OhaengDiagnosis } from './types';

// ─────────────────────────────────────────────
// 사주 오행 분포 진단 (작명용)
// baziCalc.calculateBazi()가 반환하는 ohhaengCounts를 입력으로 받아
// 결핍/과다 오행과 이름으로 보완할 오행 2개를 결정한다.
// ─────────────────────────────────────────────

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];

/** 상생 관계: A를 생(生)해주는 오행 — 수생목, 목생화, 화생토, 토생금, 금생수 */
const GENERATING: Record<Ohaeng, Ohaeng> = {
    '목': '수',
    '화': '목',
    '토': '화',
    '금': '토',
    '수': '금',
};

/**
 * 오행 분포 진단
 * @param counts baziCalc의 ohhaengCounts ('목'|'화'|'토'|'금'|'수' → 개수)
 */
export function diagnoseOhaeng(counts: Record<string, number>): OhaengDiagnosis {
    const safeCounts = OHAENG_ORDER.reduce((acc, key) => {
        acc[key] = counts[key] || 0;
        return acc;
    }, {} as Record<Ohaeng, number>);

    const total = OHAENG_ORDER.reduce((sum, key) => sum + safeCounts[key], 0) || 1;
    // 1. 실수 비율과 1차 반올림 정수 비율 계산
    const rawPcts = OHAENG_ORDER.map(key => {
        const raw = (safeCounts[key] / total) * 100;
        const integer = Math.round(raw);
        const diff = raw - integer; // 양수면 올림 손해(버림당함), 음수면 내림 이득(올림당함)
        return { key, raw, integer, diff };
    });

    // 2. 현재 정수 비율의 합 구하기
    let sum = rawPcts.reduce((s, x) => s + x.integer, 0);

    // 3. 100과의 차이 보정 (최대 잔여법 - Largest Remainder Method)
    const remainder = 100 - sum;
    if (remainder !== 0) {
        if (remainder > 0) {
            // 합이 100보다 작으면, 반올림 시 버림을 많이 당한(diff가 큰) 순으로 1씩 가산
            rawPcts.sort((a, b) => b.diff - a.diff);
            for (let i = 0; i < remainder; i++) {
                if (rawPcts[i]) rawPcts[i].integer += 1;
            }
        } else {
            // 합이 100보다 크면, 반올림 시 올림을 많이 당한(diff가 작은) 순으로 1씩 감산
            rawPcts.sort((a, b) => a.diff - b.diff);
            const toSubtract = Math.abs(remainder);
            for (let i = 0; i < toSubtract; i++) {
                if (rawPcts[i]) rawPcts[i].integer -= 1;
            }
        }
    }

    const percentages = rawPcts.reduce((acc, x) => {
        acc[x.key] = x.integer;
        return acc;
    }, {} as Record<Ohaeng, number>);

    const missing = OHAENG_ORDER.filter(key => safeCounts[key] === 0);

    // 가장 부족한 오행 (동률이면 오행 순서상 앞의 것)
    const weakest = OHAENG_ORDER.reduce((min, key) =>
        safeCounts[key] < safeCounts[min] ? key : min, OHAENG_ORDER[0]);

    const strongest = OHAENG_ORDER.reduce((max, key) =>
        safeCounts[key] > safeCounts[max] ? key : max, OHAENG_ORDER[0]);

    // 보완 오행 결정:
    //  1순위 = 가장 부족한 오행(결핍 오행 우선)
    //  2순위 = 1순위 오행을 생(生)해주는 오행 — 이름 안에서 상생 흐름을 만들어
    //          보완 기운이 마르지 않게 한다. 단, 그 오행이 이미 과다하면
    //          두 번째로 부족한 오행으로 대체.
    const primary = missing.length > 0 ? missing[0] : weakest;
    let secondary = GENERATING[primary];

    if (secondary === strongest && safeCounts[strongest] >= 3) {
        const sortedByLack = [...OHAENG_ORDER]
            .filter(key => key !== primary)
            .sort((a, b) => safeCounts[a] - safeCounts[b]);
        secondary = sortedByLack[0];
    }

    return {
        counts: safeCounts,
        percentages,
        missing,
        weakest,
        strongest,
        complement: [primary, secondary],
    };
}

/** 오행 → 상징 키워드 (진단 문구·차트 라벨용) */
export const OHAENG_MEANING: Record<Ohaeng, { keyword: string; domain: string; hanja: string }> = {
    '목': { keyword: '성장과 시작', domain: '명예 · 성장 · 추진력', hanja: '木' },
    '화': { keyword: '열정과 표현', domain: '명성 · 인기 · 표현력', hanja: '火' },
    '토': { keyword: '안정과 신뢰', domain: '재산 · 신용 · 중심', hanja: '土' },
    '금': { keyword: '결단과 결실', domain: '결실 · 권위 · 추진', hanja: '金' },
    '수': { keyword: '지혜와 재물', domain: '재물 · 지혜 · 유연함', hanja: '水' },
};
