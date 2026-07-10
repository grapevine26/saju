import { SagyeokResult } from './types';
import { getSuriInfo, isGoodSuri } from './data/suri81';

// ─────────────────────────────────────────────
// 정통 성명학 수리 사격(원형이정) 계산기
// 성 1자 + 이름 2자 구조 기준 (한국 이름의 표준형)
//
//   원격(元格) = 이름1 + 이름2          → 초년운 (0~20세)
//   형격(亨格) = 성 + 이름1             → 청장년운 (20~40세, 주격)
//   이격(利格) = 성 + 이름2             → 중년운 (40~60세, 부격)
//   정격(貞格) = 성 + 이름1 + 이름2     → 말년운 및 인생 총운
// ─────────────────────────────────────────────

/** 수리 사격 계산 */
export function calculateSagyeok(
    surnameStrokes: number,
    firstStrokes: number,
    secondStrokes: number
): SagyeokResult {
    const won = firstStrokes + secondStrokes;
    const hyeong = surnameStrokes + firstStrokes;
    const i = surnameStrokes + secondStrokes;
    const jeong = surnameStrokes + firstStrokes + secondStrokes;

    const build = (value: number) => {
        const info = getSuriInfo(value);
        return { value, grade: info.grade, title: info.title };
    };

    const result: SagyeokResult = {
        won: build(won),
        hyeong: build(hyeong),
        i: build(i),
        jeong: build(jeong),
        allGood: isGoodSuri(won) && isGoodSuri(hyeong) && isGoodSuri(i) && isGoodSuri(jeong),
    };

    return result;
}

/**
 * 주어진 성씨 획수에 대해 사격이 모두 길수가 되는 (이름1, 이름2) 획수 쌍 탐색
 * @param surnameStrokes 성씨 획수
 * @param candidateFirst 이름 첫 글자에 사용 가능한 획수 목록
 * @param candidateSecond 이름 끝 글자에 사용 가능한 획수 목록
 */
export function findGoodStrokePairs(
    surnameStrokes: number,
    candidateFirst: number[],
    candidateSecond: number[]
): Array<{ first: number; second: number; sagyeok: SagyeokResult }> {
    const pairs: Array<{ first: number; second: number; sagyeok: SagyeokResult }> = [];

    for (const first of candidateFirst) {
        for (const second of candidateSecond) {
            const sagyeok = calculateSagyeok(surnameStrokes, first, second);
            if (sagyeok.allGood) {
                pairs.push({ first, second, sagyeok });
            }
        }
    }

    return pairs;
}
