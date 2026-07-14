/**
 * 일진 기반 길일 계산 검증 스크립트
 * 실행: npx tsx scripts/test-golden-dates.ts
 */
import { calculateGoldenWindows, calculateGoldenDates } from '../src/utils/goldenWindowCalc';

const CASES: Array<[string, string, string, string, string]> = [
    ['이도현×한유진', '경', '오', '신', '유'],
    ['김서연×박지훈', '기', '묘', '갑', '오'],
    ['테스트×점검용', '갑', '자', '정', '미'],
];

for (const [label, mg, mz, pg, pz] of CASES) {
    const gw = calculateGoldenWindows(mg, mz, pg, pz, 6);
    if (!gw.bestMonth) { console.log(`${label}: bestMonth 없음`); continue; }
    const d1 = calculateGoldenDates(gw.bestMonth.year, gw.bestMonth.month, mg, mz, pg, pz);
    const d2 = calculateGoldenDates(gw.bestMonth.year, gw.bestMonth.month, mg, mz, pg, pz);
    const deterministic = JSON.stringify(d1.map(d => d.day)) === JSON.stringify(d2.map(d => d.day));

    console.log(`\n■ ${label} (일주: ${mg}${mz} / ${pg}${pz})`);
    console.log(`  최적 달: ${gw.bestMonth.year}년 ${gw.bestMonth.month}월 (점수 ${gw.bestMonth.score})`);
    console.log(`  길일: ${d1.map(d => `${d.day}일(${d.dayGan}${d.dayZhi}, ${d.score}점)`).join(' · ')}`);
    console.log(`  결정론(재실행 동일): ${deterministic}`);
    console.log(`  1순위 근거: ${d1[0]?.reasons.join(' / ')}`);
    if (d1.length < 2 || d1.length > 3) console.log(`  ⚠️ 날짜 개수 이상: ${d1.length}개`);
    if (d1.some(d => d.day < 1 || d.day > 31)) console.log(`  ⚠️ 날짜 범위 이탈`);
}
console.log('\n완료');
