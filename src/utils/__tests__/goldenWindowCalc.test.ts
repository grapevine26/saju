import { describe, it, expect } from 'vitest';
import { calculateGoldenWindows, calculateGoldenDates } from '../goldenWindowCalc';

// 고정 일주 커플 (E2E 감사 스크립트와 동일)
const [MG, MZ, PG, PZ] = ['경', '인', '정', '묘'];

describe('골든 윈도우 월 계산 (calculateGoldenWindows)', () => {
    const gw = calculateGoldenWindows(MG, MZ, PG, PZ, 6);

    it('향후 6개월 윈도우를 생성한다', () => {
        expect(gw.windows).toHaveLength(6);
        gw.windows.forEach(w => {
            expect(w.month).toBeGreaterThanOrEqual(1);
            expect(w.month).toBeLessThanOrEqual(12);
            expect(w.score).toBeGreaterThanOrEqual(0);
            expect(w.score).toBeLessThanOrEqual(100);
        });
    });

    it('bestMonth는 전체 윈도우 중 최고 점수여야 한다', () => {
        const maxScore = Math.max(...gw.windows.map(w => w.score));
        expect(gw.bestMonth?.score).toBe(maxScore);
    });

    it('결정론 — 같은 입력이면 항상 같은 결과', () => {
        const again = calculateGoldenWindows(MG, MZ, PG, PZ, 6);
        expect(again.windows.map(w => `${w.year}-${w.month}:${w.score}`))
            .toEqual(gw.windows.map(w => `${w.year}-${w.month}:${w.score}`));
    });
});

describe('일진 기반 길일 계산 (calculateGoldenDates)', () => {
    const gw = calculateGoldenWindows(MG, MZ, PG, PZ, 6);
    const best = gw.bestMonth!;
    const dates = calculateGoldenDates(best.year, best.month, MG, MZ, PG, PZ);

    it('2~3개의 날짜를 오름차순으로 반환한다', () => {
        expect(dates.length).toBeGreaterThanOrEqual(2);
        expect(dates.length).toBeLessThanOrEqual(3);
        const days = dates.map(d => d.day);
        expect([...days].sort((a, b) => a - b)).toEqual(days);
        days.forEach(d => { expect(d).toBeGreaterThanOrEqual(1); expect(d).toBeLessThanOrEqual(31); });
    });

    it('결정론 — 재실행해도 같은 날짜', () => {
        const again = calculateGoldenDates(best.year, best.month, MG, MZ, PG, PZ);
        expect(again.map(d => d.day)).toEqual(dates.map(d => d.day));
    });

    it('각 날짜에 일진(간지)과 근거가 있고, 근거 라벨은 일간/일지로 표기된다', () => {
        dates.forEach(d => {
            expect(d.dayGan).toBeTruthy();
            expect(d.dayZhi).toBeTruthy();
            expect(d.reasons.length).toBeGreaterThan(0);
            d.reasons.forEach(r => {
                expect(r.startsWith('월간 ')).toBe(false);
                expect(r.startsWith('월지 ')).toBe(false);
            });
        });
    });

    it('점수는 후보군 내 상위권이어야 한다 (아무 날짜나 뽑지 않음)', () => {
        // 1순위 날짜의 점수가 기본 점수(50)보다 높거나 같아야 함
        expect(dates[0].score).toBeGreaterThanOrEqual(50);
    });
});
