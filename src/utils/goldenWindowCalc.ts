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
    worstMonth: GoldenWindow | null;
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

    // 최고/최저 달 찾기
    const sorted = [...windows].sort((a, b) => b.score - a.score);
    const bestMonth = sorted.length > 0 ? sorted[0] : null;
    const worstMonth = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    return { windows, bestMonth, worstMonth };
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
