// ─────────────────────────────────────────────
// 작명 엔진 스모크 테스트
// 실행: npx tsx scripts/test-naming-engine.ts
// 주요 성씨 × 성별 × 보완오행 조합에서 후보가 충분히 나오는지 검증한다.
// ─────────────────────────────────────────────

import { SURNAMES } from '../src/features/naming/data/surnames';
import { generateNameCandidates } from '../src/features/naming/nameGenerator';
import { diagnoseOhaeng } from '../src/features/naming/ohaengAnalysis';
import { Ohaeng } from '../src/features/naming/types';

const ELEMENTS: Ohaeng[] = ['목', '화', '토', '금', '수'];
const TEST_SURNAMES = [
    '김', '이', '박', '최', '정', '윤', '장', '한', '권', '황', '남궁',
    // 특이 성씨 (극단 획수 포함: 簡 18획, 葛 15획, 司空 13획 복성)
    '당', '견', '단', '갈', '상', '간', '승', '팽', '좌', '범', '시', '서문', '사공',
];

let failCount = 0;
let totalCases = 0;

for (const surnameKey of TEST_SURNAMES) {
    const surname = SURNAMES[surnameKey];

    for (const lackElement of ELEMENTS) {
        for (const gender of ['male', 'female'] as const) {
            totalCases++;

            // 특정 오행이 0개인 가상의 오행 분포 생성
            const counts: Record<string, number> = { '목': 2, '화': 2, '토': 2, '금': 1, '수': 1 };
            counts[lackElement] = 0;

            const diagnosis = diagnoseOhaeng(counts);
            const candidates = generateNameCandidates(surname, gender, diagnosis, 10);

            const status = candidates.length >= 5 ? 'OK' : candidates.length > 0 ? 'WARN' : 'FAIL';
            if (status !== 'OK') failCount++;

            const sample = candidates.slice(0, 3).map(c =>
                `${surname.hangul}${c.hangul}(${surname.hanja}${c.hanja[0].char}${c.hanja[1].char})`
            ).join(', ');

            console.log(
                `[${status}] ${surname.hangul}(${surname.strokes}획) · ${gender === 'male' ? '남' : '여'} · 결핍 ${lackElement} → 후보 ${candidates.length}개 ${sample ? '| ' + sample : ''}`
            );

            // 사격 길수 검증 (모든 후보가 allGood이어야 함)
            const broken = candidates.filter(c => !c.sagyeok.allGood);
            if (broken.length > 0) {
                failCount++;
                console.error(`  !! 사격 길수 위반 후보 발견: ${broken.map(b => b.hangul).join(', ')}`);
            }
        }
    }
}

console.log(`\n총 ${totalCases}개 케이스 · 부족/실패 ${failCount}건`);
if (failCount > 0) process.exitCode = 1;
