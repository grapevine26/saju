// ─────────────────────────────────────────────
// 작명 서비스 공용 타입 정의
// 기존 사주(재회) 서비스 타입과 완전히 격리해서 관리한다.
// ─────────────────────────────────────────────

/** 오행 한글 표기 (baziCalc의 ohhaengCounts 키와 동일) */
export type Ohaeng = '목' | '화' | '토' | '금' | '수';

/** 서비스 유형: 신생아 작명 / 내 이름 감명(검증) / 개명 */
export type NamingServiceType = 'newborn' | 'evaluation' | 'rename';

/** 이름에 담고 싶은 핵심 가치 */
export type NamingValue = 'wealth' | 'career' | 'health' | 'modern';

/** 인명용 한자 사전 엔트리 */
export interface HanjaEntry {
    /** 한자 */
    char: string;
    /** 대표 독음 (한글) */
    reading: string;
    /** 원획법(강희자전) 기준 획수 */
    strokes: number;
    /** 자원오행 */
    element: Ohaeng;
    /** 뜻 풀이 */
    meaning: string;
    /** 성별 적합도 */
    gender: 'male' | 'female' | 'both';
}

/** 성씨 한자 정보 */
export interface SurnameEntry {
    hangul: string;
    hanja: string;
    strokes: number;
    element: Ohaeng;
}

/** 81수리 길흉 등급 */
export type SuriGrade = '대길' | '길' | '평' | '흉';

/** 수리 사격(원형이정) 계산 결과 */
export interface SagyeokResult {
    /** 원격(元格): 이름 글자 획수 합 — 초년운 */
    won: { value: number; grade: SuriGrade; title: string };
    /** 형격(亨格): 성 + 이름 첫 글자 — 청장년운(주격) */
    hyeong: { value: number; grade: SuriGrade; title: string };
    /** 이격(利格): 성 + 이름 끝 글자 — 중년운(부격) */
    i: { value: number; grade: SuriGrade; title: string };
    /** 정격(貞格): 전체 획수 합 — 말년운(총격) */
    jeong: { value: number; grade: SuriGrade; title: string };
    /** 사격이 모두 길수인지 여부 */
    allGood: boolean;
}

/** 규칙 기반으로 생성된 이름 후보 1개 */
export interface NameCandidate {
    /** 한글 이름 (성 제외) 예: "서준" */
    hangul: string;
    /** 한자 구성 */
    hanja: [HanjaEntry, HanjaEntry];
    /** 수리 사격 결과 */
    sagyeok: SagyeokResult;
    /** 이름 두 글자의 자원오행 */
    elements: [Ohaeng, Ohaeng];
    /** 보완 점수 (내부 정렬용) */
    score: number;
}

/** 오행 결핍 분석 결과 */
export interface OhaengDiagnosis {
    /** 오행별 개수 */
    counts: Record<Ohaeng, number>;
    /** 오행별 백분율 (합 100) */
    percentages: Record<Ohaeng, number>;
    /** 결핍 오행 (0개) 목록 */
    missing: Ohaeng[];
    /** 가장 부족한 오행 (보완 1순위) */
    weakest: Ohaeng;
    /** 가장 과다한 오행 */
    strongest: Ohaeng;
    /** 이름으로 보완할 오행 (주 보완 + 상생 보조) */
    complement: [Ohaeng, Ohaeng];
}

/** 유저 입력 (작명 퍼널) */
export interface NamingInput {
    serviceType: NamingServiceType;
    /** 성씨 (한글) */
    surname: string;
    /** 성씨 한자 (동음이성 선택 — 미지정 시 대표 한자로 연산) */
    surnameHanja?: string;
    gender: 'male' | 'female';
    calendarType: 'solar' | 'lunar';
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthHour?: string;
    birthMinute?: string;
    isTimeUnknown: boolean;
    /** 감명/개명일 때 현재 이름 (성 제외) */
    currentName?: string;
    /** 중시하는 가치 */
    value: NamingValue;
    /** 자유 서술 고민 (선택) */
    concern?: string;
}
