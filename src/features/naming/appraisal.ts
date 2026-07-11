import { HanjaEntry, Ohaeng, OhaengDiagnosis, SagyeokResult, SurnameEntry } from './types';
import { HANJA_DICT } from './data/hanjaDict';
import { calculateSagyeok } from './strokeCalculator';

// ─────────────────────────────────────────────
// 감명(鑑名) — 기존 이름의 성명학적 검증 엔진
//
// ⚠️ 프로덕션 전 교체 목록 (디자인 핸드오프 README #4 동일 한계):
//  - 의뢰인이 실제 사용하는 '한자'를 입력받지 않으므로, 독음(讀音)이 일치하는
//    인명용 한자 후보 중 최선의 조합을 '추정'해 평가한다.
//  - 사전(HANJA_DICT)에 없는 독음은 수리 연산이 불가능해 보수적 추정 점수를 사용한다.
//  - 실서비스에서는 한자 직접 선택 UI + 전수 인명용 한자 DB로 교체해야 한다.
// ─────────────────────────────────────────────

export interface AppraisalResult {
    /** 검증 대상 이름 (성 제외, 한글) */
    name: string;
    /** 글자별 추정 한자 (사전에 없으면 null) */
    chars: (HanjaEntry | null)[];
    /** 추정 한자 기준 수리 사격 (두 글자 모두 매칭됐을 때만) */
    sagyeok: SagyeokResult | null;
    /** 종합 점수 (0~100) — 80점 미만이면 보완 권고 */
    score: number;
    /** 명식의 결핍 오행을 이 이름이 채우고 있는지 */
    fillsLack: boolean;
    /** 실제 한자 미상으로 정밀 수리 연산 없이 추정한 결과인지 (true면 점수를 단정적으로 노출하지 않음) */
    estimated: boolean;
}

/** 독음으로 인명용 한자 후보를 찾는다 (성별 적합도 필터 포함) */
function findByReading(reading: string, gender: 'male' | 'female'): HanjaEntry[] {
    return HANJA_DICT.filter(
        (h) => h.reading === reading && (h.gender === 'both' || h.gender === gender)
    );
}

/** 사격 4격 중 길(길·대길) 등급 개수 */
function goodGradeCount(sagyeok: SagyeokResult): number {
    return [sagyeok.won, sagyeok.hyeong, sagyeok.i, sagyeok.jeong]
        .filter((g) => g.grade === '길' || g.grade === '대길').length;
}

/** 문자열 해시 (사전 미수록 이름의 보수적 의사 점수용 — 핸드오프 로직 포팅) */
function nameHash(name: string): number {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
}

/**
 * 이름 감명: 독음 기반 한자 추정 → 수리 사격 + 자원오행 보완 여부 평가
 * 점수 구성 (결정론적):
 *  - 기본 50점
 *  - 사격 길 등급 1개당 +8 (최대 +32)
 *  - 주 보완 오행 포함 +12, 보조 보완 오행 포함 +6
 */
export function appraiseName(
    surname: SurnameEntry,
    nameHangul: string,
    gender: 'male' | 'female',
    diagnosis: OhaengDiagnosis
): AppraisalResult {
    const name = nameHangul.trim();
    const [primary, secondary] = diagnosis.complement;
    const lackingEl: Ohaeng = diagnosis.missing.length > 0 ? diagnosis.missing[0] : diagnosis.weakest;

    // 두 글자 이름만 정밀 연산 (외자/세 글자는 사전 구조상 추정 불가 → 보수적 점수)
    if (name.length !== 2) {
        const pseudo = 58 + (nameHash(name) % 25);
        return { name, chars: [], sagyeok: null, score: Math.min(96, pseudo), fillsLack: false, estimated: true };
    }

    const candidates1 = findByReading(name[0], gender);
    const candidates2 = findByReading(name[1], gender);

    // 글자별 최선 후보: 보완 오행 일치 > 사전 첫 후보
    const pickBest = (list: HanjaEntry[]): HanjaEntry | null => {
        if (list.length === 0) return null;
        return (
            list.find((h) => h.element === primary) ||
            list.find((h) => h.element === secondary) ||
            list[0]
        );
    };

    const c1 = pickBest(candidates1);
    const c2 = pickBest(candidates2);
    const chars = [c1, c2];

    // 둘 다 매칭 실패 → 의사 점수 (한계 명시: 사전 미수록)
    if (!c1 || !c2) {
        const matched = [c1, c2].filter(Boolean) as HanjaEntry[];
        const fillsLack = matched.some((h) => h.element === primary || h.element === lackingEl);
        const pseudo = 58 + (nameHash(name) % 25) + (fillsLack ? 8 : 0);
        return { name, chars, sagyeok: null, score: Math.min(96, pseudo), fillsLack, estimated: true };
    }

    const sagyeok = calculateSagyeok(surname.strokes, c1.strokes, c2.strokes);
    const goodCnt = goodGradeCount(sagyeok);
    const elements = [c1.element, c2.element];
    const hasPrimary = elements.includes(primary) || elements.includes(lackingEl);
    const hasSecondary = elements.includes(secondary);

    let score = 50 + goodCnt * 8;
    if (hasPrimary) score += 12;
    if (hasSecondary) score += 6;

    return {
        name,
        chars,
        sagyeok,
        score: Math.min(96, score),
        fillsLack: hasPrimary,
        estimated: false,
    };
}
