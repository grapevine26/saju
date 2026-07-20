/**
 * 골든 윈도우 계산기 (goldenWindowCalc.ts)
 * 향후 N개월 동안 두 사람의 합이 가장 강해지는 시점을 찾아낸다.
 * lunar-javascript 라이브러리를 사용하여 월간 천간/지지를 계산한다.
 */
import { Solar } from 'lunar-javascript';
import {
    getCheonganHap, getJijiYukhap, getJijiChung,
    HANJA_TO_HANGUL
} from './sajuMapper';

// ========================================================================
// 타입 정의
// ========================================================================

/** 개별 골든 윈도우 정보 */
export interface GoldenWindow {
    year: number;
    month: number;
    monthGan: string;    // 월간 (한글)
    monthZhi: string;    // 월지 (한글)
    score: number;       // 이 달의 합 강도 (0~100)
    isGolden: boolean;   // 골든 윈도우 여부 (score >= 70)
    reasons: string[];   // 점수가 높은 이유들
}

/** 골든 윈도우 계산 결과 */
export interface GoldenWindowResult {
    windows: GoldenWindow[];
    bestMonth: GoldenWindow | null;
}

// ========================================================================
// 메인 계산 함수
// ========================================================================

/**
 * 향후 N개월의 골든 윈도우를 계산한다.
 * @param myDayGan - 나의 일간 (한글, 예: "갑")
 * @param myDayZhi - 나의 일지 (한글, 예: "자")
 * @param partnerDayGan - 상대방의 일간
 * @param partnerDayZhi - 상대방의 일지
 * @param months - 분석할 개월 수 (기본 6)
 */
export const calculateGoldenWindows = (
    myDayGan: string,
    myDayZhi: string,
    partnerDayGan: string,
    partnerDayZhi: string,
    months: number = 6
): GoldenWindowResult => {
    const windows: GoldenWindow[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
        // 다음 달부터 계산 (현재 달 포함하지 않음)
        const targetDate = new Date(now.getFullYear(), now.getMonth() + 1 + i, 15);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;

        try {
            // lunar-javascript로 해당 월의 천간/지지 추출
            const solar = Solar.fromYmd(year, month, 15);
            const lunar = solar.getLunar();
            const bazi = lunar.getEightChar();

            const monthGanHanja = bazi.getMonthGan();
            const monthZhiHanja = bazi.getMonthZhi();
            const monthGan = HANJA_TO_HANGUL[monthGanHanja] || monthGanHanja;
            const monthZhi = HANJA_TO_HANGUL[monthZhiHanja] || monthZhiHanja;

            // 이 달의 점수 계산
            const { score, reasons } = calculateMonthScore(
                monthGan, monthZhi,
                myDayGan, myDayZhi,
                partnerDayGan, partnerDayZhi
            );

            windows.push({
                year,
                month,
                monthGan,
                monthZhi,
                score,
                isGolden: score >= 70,
                reasons
            });
        } catch (e) {
            console.error(`골든 윈도우 계산 오류 (${year}-${month}):`, e);
            // 계산 실패 시 기본값으로 채움
            windows.push({
                year,
                month,
                monthGan: '?',
                monthZhi: '?',
                score: 50,
                isGolden: false,
                reasons: ['계산 불가']
            });
        }
    }

    // 최고점 달 찾기 (최저점 달은 부정 정보라 산출하지 않음 — 피할 날과 같은 제품 결정)
    // 월 점수가 동점(합충 없는 평탄한 6개월 등)이면 그 달 안의 일진 길일 품질로 타이브레이크 —
    // "왜 하필 이 달이 최적기냐"에 근거를 만들어 준다 (동점 시 무조건 첫 달이 되는 임의성 제거)
    const sorted = [...windows].sort((a, b) => b.score - a.score);
    let bestMonth = sorted.length > 0 ? sorted[0] : null;
    if (bestMonth) {
        const tied = sorted.filter(w => w.score === bestMonth!.score);
        if (tied.length > 1) {
            const withQuality = tied.map(w => ({
                w,
                quality: bestDayQuality(w.year, w.month, myDayGan, myDayZhi, partnerDayGan, partnerDayZhi),
            }));
            withQuality.sort((a, b) =>
                b.quality - a.quality
                || (a.w.year * 100 + a.w.month) - (b.w.year * 100 + b.w.month) // 품질도 같으면 빠른 달
            );
            bestMonth = withQuality[0].w;
        }
    }

    return { windows, bestMonth };
};

/** 해당 달 일진 중 상위 2일의 합충 점수 합 — 동점 달 사이의 타이브레이크용 */
const bestDayQuality = (
    year: number, month: number,
    myDayGan: string, myDayZhi: string, partnerDayGan: string, partnerDayZhi: string,
): number => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const scores: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
        try {
            const lunar = Solar.fromYmd(year, month, day).getLunar();
            const dayGan = HANJA_TO_HANGUL[lunar.getDayGan()] || lunar.getDayGan();
            const dayZhi = HANJA_TO_HANGUL[lunar.getDayZhi()] || lunar.getDayZhi();
            scores.push(calculateMonthScore(dayGan, dayZhi, myDayGan, myDayZhi, partnerDayGan, partnerDayZhi).score);
        } catch { /* 개별 날짜 실패 무시 */ }
    }
    return scores.sort((a, b) => b - a).slice(0, 2).reduce((s, v) => s + v, 0);
};

// ========================================================================
// 월별 점수 계산 로직
// ========================================================================

/**
 * 특정 달의 월간/월지가 두 사람의 일주와 어떤 관계를 형성하는지 분석
 */
const calculateMonthScore = (
    monthGan: string,
    monthZhi: string,
    myDayGan: string,
    myDayZhi: string,
    partnerDayGan: string,
    partnerDayZhi: string
): { score: number; reasons: string[] } => {
    let score = 50; // 기본 점수
    const reasons: string[] = [];

    // ─── 1. 월간이 상대방 일간과 합 ───
    const ganHapWithPartner = getCheonganHap(monthGan, partnerDayGan);
    if (ganHapWithPartner) {
        score += 20;
        reasons.push(`월간 ${ganHapWithPartner.description}: 상대방의 마음이 열리는 시기`);
    }

    // ─── 2. 월간이 나의 일간과 합 ───
    const ganHapWithMe = getCheonganHap(monthGan, myDayGan);
    if (ganHapWithMe) {
        score += 10;
        reasons.push(`월간 ${ganHapWithMe.description}: 내 에너지가 좋아지는 시기`);
    }

    // ─── 3. 월지가 상대방 일지와 합 ───
    const zhiHapWithPartner = getJijiYukhap(monthZhi, partnerDayZhi);
    if (zhiHapWithPartner) {
        score += 18;
        reasons.push(`월지 ${zhiHapWithPartner.description}: 상대방과의 현실적 접점이 생기는 시기`);
    }

    // ─── 4. 월지가 나의 일지와 합 ───
    const zhiHapWithMe = getJijiYukhap(monthZhi, myDayZhi);
    if (zhiHapWithMe) {
        score += 8;
        reasons.push(`월지 ${zhiHapWithMe.description}: 내 일상이 안정되는 시기`);
    }

    // ─── 5. 월지가 상대방 일지와 충이면 감점 ───
    const zhiChungWithPartner = getJijiChung(monthZhi, partnerDayZhi);
    if (zhiChungWithPartner) {
        score -= 15;
        reasons.push(`월지 ${zhiChungWithPartner.description}: 상대방이 예민해지는 시기 (주의)`);
    }

    // ─── 6. 월지가 나의 일지와 충이면 감점 ───
    const zhiChungWithMe = getJijiChung(monthZhi, myDayZhi);
    if (zhiChungWithMe) {
        score -= 10;
        reasons.push(`월지 ${zhiChungWithMe.description}: 내가 불안정해지는 시기 (자제 필요)`);
    }

    // 점수 범위 보정 (0~100)
    score = Math.max(0, Math.min(100, score));

    // 이유가 하나도 없으면 기본 메시지
    if (reasons.length === 0) {
        reasons.push('특별한 합충 없이 평탄한 흐름');
    }

    return { score, reasons };
};

// ========================================================================
// 특정 시점(연·월)의 운 에너지 분석 — AI 프롬프트 재료용
// ========================================================================

/**
 * 특정 연·월의 세운(연간지)·월운(월간지)을 뽑고, 두 사람의 일주와
 * 어떤 합충 관계였는지 요약 문자열을 만든다.
 * 이별 시점·현재 시점의 "그때 왜 그랬는지"를 AI가 지어내지 않고
 * 실제 간지 근거로 서술하게 하는 것이 목적.
 * @returns 분석 요약 문자열 (계산 실패 시 null)
 */
export const describeTimePointEnergy = (
    year: number,
    month: number,
    myDayGan: string,
    myDayZhi: string,
    partnerDayGan: string,
    partnerDayZhi: string,
): string | null => {
    try {
        const solar = Solar.fromYmd(year, month, 15);
        const bazi = solar.getLunar().getEightChar();
        const yGan = HANJA_TO_HANGUL[bazi.getYearGan()] || bazi.getYearGan();
        const yZhi = HANJA_TO_HANGUL[bazi.getYearZhi()] || bazi.getYearZhi();
        const mGan = HANJA_TO_HANGUL[bazi.getMonthGan()] || bazi.getMonthGan();
        const mZhi = HANJA_TO_HANGUL[bazi.getMonthZhi()] || bazi.getMonthZhi();

        const relations: string[] = [];
        const pairs: { gan: string; zhi: string; label: string }[] = [
            { gan: yGan, zhi: yZhi, label: '세운(연)' },
            { gan: mGan, zhi: mZhi, label: '월운(월)' },
        ];
        const persons = [
            { gan: myDayGan, zhi: myDayZhi, who: '나' },
            { gan: partnerDayGan, zhi: partnerDayZhi, who: '상대방' },
        ];
        for (const p of pairs) {
            for (const person of persons) {
                const ganHap = getCheonganHap(p.gan, person.gan);
                if (ganHap) relations.push(`${p.label} 천간이 ${person.who}의 일간과 합(${ganHap.description}) — ${person.who}의 마음이 흔들리거나 열리는 흐름`);
                const zhiHap = getJijiYukhap(p.zhi, person.zhi);
                if (zhiHap) relations.push(`${p.label} 지지가 ${person.who}의 일지와 합(${zhiHap.description}) — ${person.who}의 현실 환경에 접점이 생기는 흐름`);
                const zhiChung = getJijiChung(p.zhi, person.zhi);
                if (zhiChung) relations.push(`${p.label} 지지가 ${person.who}의 일지와 충(${zhiChung.description}) — ${person.who}에게 변화 압력·불안정이 커지는 흐름`);
            }
        }
        const relText = relations.length > 0
            ? relations.map(r => `  · ${r}`).join('\n')
            : '  · 두 사람의 일주와 특별한 합충 없음 (평이한 흐름)';
        return `${year}년 ${month}월 — 세운 ${yGan}${yZhi}년 · 월운 ${mGan}${mZhi}월\n${relText}`;
    } catch (e) {
        console.error(`시점 운 분석 오류 (${year}-${month}):`, e);
        return null;
    }
};

// ========================================================================
// 일진(日辰) 기반 길일 계산
// ========================================================================

/** 특정 달 안의 길일 정보 */
export interface GoldenDate {
    day: number;         // 일 (1~31)
    dayGan: string;      // 그 날의 일간 (한글)
    dayZhi: string;      // 그 날의 일지 (한글)
    score: number;       // 합 강도 (월 점수와 동일 로직)
    reasons: string[];
}

/**
 * 골든 달 안에서 두 사람의 일주와 합이 강한 날짜를 일진 기반으로 선정.
 * 월 점수와 동일한 합충 로직(calculateMonthScore)을 그 날의 간지에 적용한다.
 * — 예전엔 이 날짜를 AI가 임의로 생성했으나, 이제 캘린더의 🔥 날짜에도
 *   월 선정과 같은 명리적 근거 체인이 이어진다.
 *
 * @returns 점수순 상위 N일 (날짜 오름차순 정렬, 가능하면 5일 이상 간격으로 분산)
 *          기본 2일 — 날짜마다 근거(이유)를 함께 노출하므로 적고 확실하게 (희소가치 유지)
 */
export const calculateGoldenDates = (
    year: number,
    month: number,
    myDayGan: string,
    myDayZhi: string,
    partnerDayGan: string,
    partnerDayZhi: string,
    maxDates: number = 2,
): GoldenDate[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    // 대상 달이 현재 달이면 오늘 이후 날짜만 후보로 (과거 길일 추천 방지)
    const startDay = (year === today.getFullYear() && month === today.getMonth() + 1)
        ? today.getDate() + 1
        : 1;

    const candidates: GoldenDate[] = [];
    for (let day = startDay; day <= daysInMonth; day++) {
        try {
            const lunar = Solar.fromYmd(year, month, day).getLunar();
            const dayGan = HANJA_TO_HANGUL[lunar.getDayGan()] || lunar.getDayGan();
            const dayZhi = HANJA_TO_HANGUL[lunar.getDayZhi()] || lunar.getDayZhi();
            const { score, reasons } = calculateMonthScore(
                dayGan, dayZhi, myDayGan, myDayZhi, partnerDayGan, partnerDayZhi,
            );
            // 월 점수 로직 재사용으로 근거 문구가 "월간/월지"로 나오므로 일 단위 표기로 치환
            const dayReasons = reasons.map(r => r.replace(/^월간 /, '일간 ').replace(/^월지 /, '일지 '));
            candidates.push({ day, dayGan, dayZhi, score, reasons: dayReasons });
        } catch {
            // 개별 날짜 계산 실패는 건너뜀
        }
    }

    // 점수 내림차순 (동점이면 빠른 날짜 우선)
    const sorted = [...candidates].sort((a, b) => b.score - a.score || a.day - b.day);

    // 상위 후보에서 가능하면 5일 이상 간격으로 분산 선택 (한 주에 몰리는 것 방지)
    const picked: GoldenDate[] = [];
    for (const c of sorted) {
        if (picked.length >= maxDates) break;
        if (picked.every(p => Math.abs(p.day - c.day) >= 5)) picked.push(c);
    }
    // 간격 조건으로 못 채웠으면 점수순으로 마저 채움
    for (const c of sorted) {
        if (picked.length >= maxDates) break;
        if (!picked.includes(c)) picked.push(c);
    }

    return picked.sort((a, b) => a.day - b.day);
};
