// ─────────────────────────────────────────────
// 동음이성 성씨 변형 한자 스모크 테스트
// 실행: npx tsx scripts/test-surname-variants.ts
// 모든 변형 한자(丁 2획, 邊 22획 등 극단 획수 포함)에서
// 수리 사격 길격 후보가 충분히 나오는지 검증한다.
// ─────────────────────────────────────────────

import { SURNAME_VARIANTS, SURNAMES, resolveSurname } from '../src/features/naming/data/surnames';
import { generateNameCandidates } from '../src/features/naming/nameGenerator';
import { diagnoseOhaeng } from '../src/features/naming/ohaengAnalysis';
import { Ohaeng } from '../src/features/naming/types';

const ELEMENTS: Ohaeng[] = ['목', '화', '토', '금', '수'];

let failCount = 0;
let totalCases = 0;

// 0. 변형 테이블 무결성: 첫 항목이 대표 한자(SURNAMES)와 일치해야 함
for (const [hangul, variants] of Object.entries(SURNAME_VARIANTS)) {
    const rep = SURNAMES[hangul];
    if (!rep || variants[0].hanja !== rep.hanja || variants[0].strokes !== rep.strokes) {
        failCount++;
        console.error(`!! 대표 한자 불일치: ${hangul} — SURNAMES ${rep?.hanja}(${rep?.strokes}) vs VARIANTS[0] ${variants[0].hanja}(${variants[0].strokes})`);
    }
}

// 1. resolveSurname 동작 확인
const jeong = resolveSurname('정', '丁');
if (!jeong || jeong.strokes !== 2) { failCount++; console.error('!! resolveSurname(정, 丁) 실패'); }
const fallback = resolveSurname('정', '존재하지않는한자');
if (!fallback || fallback.hanja !== '鄭') { failCount++; console.error('!! resolveSurname 폴백 실패'); }

// 2. 모든 변형 × 결핍오행 × 성별 후보 생성 검증
for (const variants of Object.values(SURNAME_VARIANTS)) {
    for (const surname of variants) {
        for (const lackElement of ELEMENTS) {
            for (const gender of ['male', 'female'] as const) {
                totalCases++;
                const counts: Record<string, number> = { '목': 2, '화': 2, '토': 2, '금': 1, '수': 1 };
                counts[lackElement] = 0;

                const diagnosis = diagnoseOhaeng(counts);
                const candidates = generateNameCandidates(surname, gender, diagnosis, 10);

                const status = candidates.length >= 5 ? 'OK' : candidates.length > 0 ? 'WARN' : 'FAIL';
                if (status !== 'OK') {
                    failCount++;
                    console.log(`[${status}] ${surname.hangul}/${surname.hanja}(${surname.strokes}획) · ${gender === 'male' ? '남' : '여'} · 결핍 ${lackElement} → 후보 ${candidates.length}개`);
                }

                const broken = candidates.filter(c => !c.sagyeok.allGood);
                if (broken.length > 0) {
                    failCount++;
                    console.error(`  !! 사격 길수 위반: ${surname.hanja} ${broken.map(b => b.hangul).join(', ')}`);
                }
            }
        }
    }
}

console.log(`\n총 ${totalCases}개 케이스 · 부족/실패 ${failCount}건`);
if (failCount > 0) process.exitCode = 1;
