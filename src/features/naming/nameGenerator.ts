import { HanjaEntry, NameCandidate, NamingValue, Ohaeng, OhaengDiagnosis, SagyeokResult, SurnameEntry } from './types';
import { findGoodStrokePairs } from './strokeCalculator';
import { findHanja, availableStrokesByElement } from './data/hanjaDict';

// ─────────────────────────────────────────────
// 규칙 기반 이름 후보 생성기 (Deterministic)
//
// 1. 보완 오행 2개에 해당하는 한자들의 획수 풀을 만든다.
// 2. 성씨 획수와 조합해 수리 사격(원형이정)이 모두 길수인 획수 쌍을 찾는다.
// 3. 각 획수 쌍에 보완 오행 한자를 매칭해 이름 후보를 만든다.
// 4. 수리 등급·오행 배치 점수로 정렬 후 상위 N개를 반환한다.
//    → AI는 이 결과를 받아 '해설'만 담당한다 (연산은 100% 코드).
// ─────────────────────────────────────────────

/** 현대 이름에서 흔히 쓰여 어감이 자연스러운 음절 (가산점) */
const NATURAL_SYLLABLES = new Set([
    '서', '연', '지', '아', '은', '우', '현', '민', '준', '수',
    '윤', '하', '예', '채', '주', '다', '소', '율', '시', '영',
    '도', '건', '재', '호', '진', '규', '원', '세', '승', '환',
    '성', '유', '혜', '빈', '온', '설', '담', '희', '정', '선', '태',
]);

/** 어감이 옛스럽거나 현대 이름에 거의 쓰이지 않는 음절 (강한 감점 — 수리 점수로 역전 불가) */
const DATED_SYLLABLES = new Set(['토', '산', '악', '증', '숭', '옥', '금', '삼', '식', '안', '근', '웅', '방', '봉']);

/**
 * 어떤 조합에서도 이름으로 쓰지 않을 음절 (완전 차단)
 * 감점으로 걸러지지 않는 경우를 대비한 하드 블록
 */
const HARD_BLOCKED_SYLLABLES = new Set([
    '삼', '식', '악', '증', '토', '옥', '숭', '배',
    '렬',  // 렬영 등 — 어느 위치에서도 이름에 쓰면 어색
    // '안'은 DATED_SYLLABLES -10점 감점으로 걸러짐 (하드차단하면 후보 부족)
]);

/** 어감이 어색한 음절 조합 필터 (동일 음 반복 등) */
function isAwkwardSound(first: string, second: string, surnameHangul?: string, gender?: 'male' | 'female'): boolean {
    if (first === second) return true;
    if (surnameHangul && surnameHangul === first) return true;

    // 성씨 '전'씨와 이름 첫 글자 '온'의 조합 차단 (발음 연음 '저논' 및 어색한 단어 연상 방지)
    if (surnameHangul === '전' && first === '온') return true;

    // 성씨 '전'씨와 이름 첫 글자 '남'의 조합 차단 ('전남' 지역명 연상 방지)
    if (surnameHangul === '전' && first === '남') return true;

    // 성씨 '전'씨와 '정온' 조합 차단 ('전정온' -> '전정' 및 전정기관 연상 방지)
    if (surnameHangul === '전' && first === '정' && second === '온') return true;

    // 성씨 '전'씨와 '청온' 조합 차단 ('전청온' -> 어색한 발음 및 특정 단어 연상 방지)
    if (surnameHangul === '전' && first === '청' && second === '온') return true;

    // 성씨 '전'씨와 '현하' 조합 차단 ('전현하' -> 임금 호칭 '전하' 및 발음 꼬임 방지)
    if (surnameHangul === '전' && first === '현' && second === '하') return true;

    // 성씨 '전'씨와 '연하' 조합 차단 ('전연하' -> '전 연하(ex-partner)' 단어 연상 방지)
    if (surnameHangul === '전' && first === '연' && second === '하') return true;

    // 성씨 '전'씨와 '경온' 조합 차단 ('전경온' -> '전경' 단어 연상 방지)
    if (surnameHangul === '전' && first === '경' && second === '온') return true;

    // 성씨 '전'씨와 이름 첫 글자 '안'의 조합 차단 (연음 [저난] 및 '저난년(저년)' 비속어 연상 방지)
    if (surnameHangul === '전' && first === '안') return true;

    // 성씨 '주'씨와 '준현' 조합 차단 ('주준현' -> ㅈ 초성 연속 반복 및 둔탁한 발음 방지)
    if (surnameHangul === '주' && first === '준' && second === '현') return true;

    // 성씨 '박'씨와 '주서' 조합 차단 ('박주서' -> 어감 및 발음 연상 어색함 방지)
    if (surnameHangul === '박' && first === '주' && second === '서') return true;

    // 성씨의 초성과 이름 두 글자의 초성이 모두 동일한 자음인 경우 차단 (예: 주준진, 지준진, 강건기 등 3연속 동일 초성 방지)
    if (surnameHangul) {
        const sCode = surnameHangul.charCodeAt(0) - 0xac00;
        const fCode = first.charCodeAt(0) - 0xac00;
        const secCode = second.charCodeAt(0) - 0xac00;
        if (sCode >= 0 && sCode <= 11171 && fCode >= 0 && fCode <= 11171 && secCode >= 0 && secCode <= 11171) {
            const sCho = Math.floor(sCode / 588);
            const fCho = Math.floor(fCode / 588);
            const secCho = Math.floor(secCode / 588);
            if (sCho === fCho && fCho === secCho) return true;
        }
    }

    // 0. 절대 사용하지 않을 음절 하드 차단
    if (HARD_BLOCKED_SYLLABLES.has(first) || HARD_BLOCKED_SYLLABLES.has(second)) return true;

    // 0-1. 둘째 글자가 'ㄹ' 초성으로 시작하고(랑, 람, 림, 린, 련, 률, 려 등), 첫째 글자의 받침이 'ㄴ/ㄹ/ㅇ/ㅁ'이면 발음 자음동화로 인해 어색해지므로 차단 (현랑, 신람, 민림 등)
    const secondCode = second.charCodeAt(0) - 0xac00;
    if (secondCode >= 0 && secondCode <= 11171 && Math.floor(secondCode / 588) === 5) {
        const firstCode = first.charCodeAt(0) - 0xac00;
        if (firstCode >= 0 && firstCode <= 11171) {
            const jong = firstCode % 28;
            if ([4, 8, 16, 21].includes(jong)) return true;
        }
    }
    
    // 1. 단조롭거나 어색한 모음 조합
    const flat = ['으', '의'];
    if (flat.includes(first) || flat.includes(second)) return true;

    // 2. ㅜ/ㅠ 계열이 연속될 때 발음이 꼬이는 조합만 명시 차단 (블랙리스트 방식)
    //    '준수', '윤서', '수윤', '재율', '경율' 등 자연스러운 조합은 자동 허용
    const wooBlocked = new Set([
        '융웅', '웅융', '융율', '율융', '웅율', '율웅',
        '우훈', '훈우', '융훈', '훈융', '웅훈', '훈웅',
        '융윤', '윤융', '웅윤', '윤웅',
        '우율', '율우', '우융', '융우', '우웅', '웅우',
        '윤율', '율윤', '준율', '율준',
        '수율', '율수', '수훈', '훈수',
        '규율', '율규', '규융', '융규', '규훈', '훈규',
        '유율', '율유', '유융', '융유', '유훈', '훈유',
    ]);
    if (wooBlocked.has(`${first}${second}`)) return true;


    // 3. 발음하기 뻑뻑하거나 정서적으로 어색한 특정 조합 차단
    const awkwardPairs = new Set([
        // 기존 차단 목록
        '안영', '안훈', '환훈', '우훈', '욱우', '욱재', '훈재', '지재', '근훈', '우율', '환영', '영환',
        '재지', '영렬', '경지', '영령', '재령', '우령', '지령',
        // 요·율·지·경 계열 어색 조합
        '요율', '요지', '요경', '요영', '요엽', '요정', '요소',
        '율요', '지요', '경요', '영요',
        '지경', '경지', '지율', '율지',
        '요령', '령요', '요렬', '렬요',
        '지렬', '렬지', '경렬', '렬경',
        // 우지·지우 계열 (이름으로 어색)
        '우지', '지우',
        // 영시·율경만 차단 (시영·경율은 자연스러우므로 허용)
        '영시', '율경',
        // 영예·예영 — 영예(榮譽)라는 단어와 발음이 같아 이름으로 어색
        '영예', '예영',
        // 환현 — ㅎ 계열 발음이 연속되어 어색
        '환현', '현환',
        // 율연·율영 — 이름으로 어색한 조합
        '율연', '율영', '연율', '영율',
        // 온지·온희·지온 — 이름으로 어색 (희온은 자연스러우므로 허용)
        '온지', '온희', '지온',
        // 연신 — 부사 '연신' 또는 '연신내'와 같아 이름으로 어색
        '연신',
        // 예민 — 성격이 '예민(sensitive)하다'는 부정적 어감 연상 방지
        '예민',
        // 우배·희배 — '배' 음절 자체의 예스러움 및 어색한 조합 차단
        '우배', '희배',
        // 지하 — '지하(地下/지하세계/지하철)' 등 어두운 단어 연상 차단
        '지하',
        // 민윤·민연·윤연 — 'ㄴ' 받침과 'ㅇ' 초성이 연속되어 발음이 꼬이고 연음([미뉸/미년/유년])이 어색한 조합 차단
        '민윤', '민연', '윤연',
        // 연효 — [여뇨]로 발음이 연음되어 발음하기 어렵고 어색한 조합 차단
        '연효',
        // 신연 — [시년]으로 연음되어 비속어로 오인될 우려가 크며, 성씨와 결합(예: 전신연 -> 전신) 시 어색한 단어 연상 방지
        '신연',
        // 연민 — 동정의 의미인 '연민(憐憫)' 단어 및 성격이 예민하다는 뉘앙스 차단
        '연민',
        // 연윤 — [여뉸]으로 연음되어 혀가 꼬이고 발음이 대단히 어려운 조합 차단
        '연윤',
        // 하지 — 절기 '하지(夏至)', 부사적 어감(~을 하지), 신체 부위 '하지(下肢)' 등 어색한 다중 연상 차단
        '하지',
        // 지계 — '지게(짐을 지는 지게)'로 발음 연상되어 놀림감이 될 수 있고 투박한 어감 차단
        '지계',
        // 현안 — '현안(懸案/해결 안 된 문제)' 단어 및 성씨 결합 시 발음(전현안 -> 전혀 안) 오인 방지
        '현안',
        // 지방 — 신체 '지방(脂肪)' 및 지역 '지방(地方)' 등 부적절한 단어 연상 차단
        '지방',
        // 안현 — [저난현]처럼 연음되어 발음이 둔탁하고 꼬이는 현상 방지
        '안현',
        // 연안 — 바다의 가장자리를 뜻하는 '연안(沿岸)' 단어 및 성씨 결합 시 발음(전현안 -> 전혀 안) 오인 방지
        '연안',
        // 연배 — 나이대를 의미하는 '연배(年配)' 단어 연상 차단
        '연배',
        // 봉진 — '봉' 자 자체의 옛스럽고 투박한 어감 차단
        '봉진',
        // 준진 — ㅈ 초성 반복 및 현대 인명으로 부자연스러운 어감 차단
        '준진',
        // 배우 — 직업 명칭 '배우(actor)' 및 성씨 결합 시 발음(전배우 -> 전직 배우) 오인 방지
        '배우',
        // 안연 — [아년]으로 연음되어 비속어(저 년)로 연상되거나 발음이 둔탁해지는 현상 방지
        '안연',
        // 승성·성승 — ㅅ 초성과 ㅇ 받침이 연속되어 발음이 둔탁하고 꼬이는 현상 방지
        '승성', '성승',
        // 지목 — '지목하다(pointing out)'의 뜻으로 연상되어 이름으로 부적절
        '지목',
        // 현휘 — 판타지/무협 소설에 나올 것 같은 예스러운 어감 방지
        '현휘',
        // 지휘 — '지휘하다(directing/orchestra conducting)' 단어 연상 방지
        '지휘',
        // 수주 — '수주하다(winning a contract)' 단어 연상 방지
        '수주',
        // 주수 — '주수하다/주스' 단어 연상 및 투박한 어감 방지
        '주수',
        // 곤연 — 연음 시 비속어(고년/곤년)로 들릴 우려가 있어 차단
        '곤연',
        // 현온·수온·온서 — 발음 및 단어 연상(수온: 물의 온도)이 어색하여 차단
        '현온', '수온', '온서',
        // 성단 — 우주 성단(star cluster) 단어 연상 및 이름으로 무거운 어감
        '성단',
        // 단윤 — 발음이 뻑뻑하고 어색하여 차단
        '단윤',
        // 온수 — 뜨거운 물(溫水) 단어 연상으로 이름으로 부자연스러워 차단
        '온수',
        // 민단 — 단체명(재일대한민국민단) 연상으로 이름으로 부적절하여 차단
        '민단',
        // 명예 — 일반 명사 '명예(honor)'와 발음 및 단어 연상이 겹쳐 차단
        '명예',
        // 흔예 — 발음이 뻑뻑하고 인명으로 어색하여 차단
        '흔예',
    ]);
    if (awkwardPairs.has(`${first}${second}`)) return true;

    // 성별이 'female' (여성)일 때 현대 여성 이름으로 쓰이기엔 지나치게 남성적인 특정 조합 차단
    if (gender === 'female') {
        // A. 일반화된 남성적 음절 차단 (첫 글자 또는 둘째 글자가 확실히 남성적인 경우)
        // 태, 찬, 혁, 웅, 철, 석, 용, 식, 봉, 범, 훈, 욱, 건, 환, 동, 종, 강, 규
        const maleEndings = new Set(['태', '찬', '혁', '웅', '철', '석', '용', '식', '봉', '범', '훈', '욱', '건', '환', '동', '종', '강', '규']);
        if (maleEndings.has(second)) return true;

        const maleStartings = new Set(['태', '찬', '혁', '웅', '철', '석', '용', '식', '봉', '범', '훈', '욱', '건', '환', '동', '종', '강', '규']);
        if (maleStartings.has(first)) return true;

        // B. 일반화 규칙에 걸리지 않으나 현대 여성 이름으로 부자연스러운 개별 남성적 조합 차단 (예: 현으로 끝나거나 시작하는 특정 조합 등)
        const maleLikePairs = new Set([
            '민현', '진현', '성현', '도현', '재현', '우현', '창현', '기현', '상현', '병현', '대현', '승현',
            '현성', '현도', '현동', '현승', '현재', '현진', '현준', '현태', '현국', '현민',
            '단성', '곤성', '단민', '규하', '성곤', '온현'
        ]);
        if (maleLikePairs.has(`${first}${second}`)) return true;
    }

    // 4. '욱'이나 '훈'이 어색하게 결합되어 발음이 억센 경우 제한 (허용 목록 확장)
    if (first === '욱' && !['준', '민', '서', '진', '하', '성', '도', '채'].includes(second)) return true;
    if (second === '욱' && !['현', '재', '진', '동', '명', '성', '준', '시', '태'].includes(first)) return true;
    if (first === '훈' && !['민', '서', '진', '하', '재', '성', '도', '현', '채'].includes(second)) return true;
    if (second === '훈' && !['지', '재', '서', '승', '영', '태', '성', '도', '현', '시'].includes(first)) return true;

    return false;
}

/**
 * 두음법칙: ㄹ 초성 음절(리·람·림·련 등)은 남한 이름의 첫 글자로 쓰지 않는다.
 * (첫 글자에 오면 북한식 어감이 됨 — 둘째 글자로는 자연스러움: 예림, 하람)
 */
function startsWithRieul(reading: string): boolean {
    const code = reading.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return false;
    return Math.floor(code / 588) === 5; // 초성 인덱스 5 = ㄹ
}

/** 어감(자연스러움) 점수 — 수리·오행 점수에 더해진다 */
function soundScore(first: string, second: string): number {
    let s = 0;
    if (NATURAL_SYLLABLES.has(first)) s += 2;
    if (NATURAL_SYLLABLES.has(second)) s += 2;
    if (DATED_SYLLABLES.has(first)) s -= 10;   // 수리 최고점(~18)도 역전 불가
    if (DATED_SYLLABLES.has(second)) s -= 10;
    return s;
}

/** 수리 등급 점수화 */
function gradeScore(grade: string): number {
    if (grade === '대길') return 3;
    if (grade === '길') return 2;
    return 0;
}

// ─────────────────────────────────────────────
// 가치 선호 가중치 — "선택하신 가치를 중심으로 이름의 기운을 배열합니다"
// 보완 오행·사격 길수 조건(절대 조건)은 그대로 두고,
// 한자의 뜻과 수리 격 이름이 선택 가치와 맞는 후보를 상위로 끌어올린다.
// ─────────────────────────────────────────────

/** 한자 뜻풀이에서 찾을 가치별 키워드 */
const VALUE_MEANING_KEYWORDS: Record<NamingValue, string[]> = {
    wealth: ['보배', '구슬', '보물', '진주', '비단', '결실', '열매', '윤택', '풍요', '복', '은혜', '가치', '재'],
    career: ['세울', '기둥', '동량', '벼리', '법도', '재상', '새길', '오를', '우뚝', '이끌', '개척', '솟'],
    health: ['굳셀', '건강', '단단', '뿌리', '근본', '영원', '끈기', '절개', '샘', '맑'],
    modern: [], // 세련된 어감은 음절 자연스러움으로 평가
};

/** 수리 격 이름에서 찾을 가치별 키워드 (예: 재리격·공명격·평안격) */
const VALUE_SURI_KEYWORDS: Record<NamingValue, string[]> = {
    wealth: ['재리', '복록', '천복', '유덕', '요행', '융창'],
    career: ['공명', '출세', '입신', '장성', '통솔', '현달', '수령', '대공', '용진', '발전', '승천', '명예'],
    health: ['평안', '안전', '덕망', '계승', '환원', '태초'],
    modern: [],
};

/** 가치 선호 가산점 (0~10 내외 — 오행·사격 점수를 뒤집지 않는 범위) */
function valueScore(h1: HanjaEntry, h2: HanjaEntry, sagyeok: SagyeokResult, value?: NamingValue, hangul?: string): number {
    if (!value) return 0;

    // 세련된 어감: 두 음절 모두 현대 이름 음절일 때 강한 보너스 및 촌스러운 음절 감점
    if (value === 'modern') {
        let s = 0;
        if (NATURAL_SYLLABLES.has(h1.reading)) s += 10;
        if (NATURAL_SYLLABLES.has(h2.reading)) s += 10;
        if (!NATURAL_SYLLABLES.has(h1.reading)) s -= 12;
        if (!NATURAL_SYLLABLES.has(h2.reading)) s -= 12;
        return s;
    }

    let s = 0;
    // 한자 뜻 매칭 (글자당 최대 1회)
    const meaningKeys = VALUE_MEANING_KEYWORDS[value];
    for (const h of [h1, h2]) {
        if (meaningKeys.some((kw) => h.meaning.includes(kw))) s += 3;
    }
    // 수리 격 이름 매칭 (4격 각각)
    const suriKeys = VALUE_SURI_KEYWORDS[value];
    for (const g of [sagyeok.won, sagyeok.hyeong, sagyeok.i, sagyeok.jeong]) {
        if (suriKeys.some((kw) => g.title.includes(kw))) s += 1;
    }
    return s;
}

/**
 * 이름 후보 생성
 * @param surname 성씨 정보
 * @param gender 성별
 * @param diagnosis 오행 진단 결과
 * @param limit 최대 후보 수 (기본 10)
 * @param value 가치 선호 (재물/커리어/건강/어감) — 후보 우선순위에 반영
 */
export function generateNameCandidates(
    surname: SurnameEntry,
    gender: 'male' | 'female',
    diagnosis: OhaengDiagnosis,
    limit = 10,
    value?: NamingValue
): NameCandidate[] {
    const [primary, secondary] = diagnosis.complement;

    // 이름 두 글자의 오행 배치 패턴: (주보완, 보조) / (보조, 주보완) / (주보완, 주보완)
    const elementPatterns: Array<[Ohaeng, Ohaeng]> = [
        [primary, secondary],
        [secondary, primary],
        [primary, primary],
    ];

    const candidates: NameCandidate[] = [];
    // 두음법칙 위반(ㄹ 초성이 첫 글자) 후보 — 정상 후보가 부족할 때만 채움
    const fallback: NameCandidate[] = [];
    const seenNames = new Set<string>();

    for (const [firstEl, secondEl] of elementPatterns) {
        const firstStrokesPool = availableStrokesByElement(firstEl, gender);
        const secondStrokesPool = availableStrokesByElement(secondEl, gender);

        const pairs = findGoodStrokePairs(surname.strokes, firstStrokesPool, secondStrokesPool);

        for (const pair of pairs) {
            const firstHanjas = findHanja(pair.first, firstEl, gender);
            const secondHanjas = findHanja(pair.second, secondEl, gender);

            for (const h1 of firstHanjas) {
                for (const h2 of secondHanjas) {
                    if (isAwkwardSound(h1.reading, h2.reading, surname.hangul, gender)) continue;

                    const hangul = `${h1.reading}${h2.reading}`;
                    // 동일 발음 이름은 수리 점수가 더 높은 첫 후보만 유지
                    if (seenNames.has(hangul)) continue;

                    const score =
                        gradeScore(pair.sagyeok.won.grade) +
                        gradeScore(pair.sagyeok.hyeong.grade) * 2 + // 주격(형격) 가중치
                        gradeScore(pair.sagyeok.i.grade) +
                        gradeScore(pair.sagyeok.jeong.grade) * 2 + // 총격(정격) 가중치
                        (firstEl === primary || secondEl === primary ? 2 : 0) +
                        soundScore(h1.reading, h2.reading) + // 어감(자연스러움) 반영
                        valueScore(h1, h2, pair.sagyeok, value); // 가치 선호 반영

                    seenNames.add(hangul);
                    const candidate: NameCandidate = {
                        hangul,
                        hanja: [h1, h2],
                        sagyeok: pair.sagyeok,
                        elements: [firstEl, secondEl],
                        score,
                    };

                    if (startsWithRieul(h1.reading)) continue; // 두음법칙 위반(첫 글자 'ㄹ') 후보는 완전히 비노출
                    candidates.push(candidate);
                }
            }
        }
    }

    // 점수 내림차순 정렬 후, 발음이 한쪽으로 쏠리지 않게 다양성 확보
    candidates.sort((a, b) => b.score - a.score);
    fallback.sort((a, b) => b.score - a.score);

    const result: NameCandidate[] = [];
    const firstSoundCount: Record<string, number> = {};
    const secondSoundCount: Record<string, number> = {};
    const pickedNames = new Set<string>();

    const tryPick = (cand: NameCandidate) => {
        const firstSound = cand.hangul[0];
        const secondSound = cand.hangul[1];
        if ((firstSoundCount[firstSound] || 0) >= 3) return;  // 같은 첫 음절 최대 3개
        if ((secondSoundCount[secondSound] || 0) >= 3) return; // 같은 끝 음절 최대 3개
        // 글자 순서만 뒤집은 이름(현수↔수현)은 점수 높은 쪽 하나만 노출
        const reversed = `${secondSound}${firstSound}`;
        if (pickedNames.has(reversed)) return;

        firstSoundCount[firstSound] = (firstSoundCount[firstSound] || 0) + 1;
        secondSoundCount[secondSound] = (secondSoundCount[secondSound] || 0) + 1;
        pickedNames.add(cand.hangul);
        result.push(cand);
    };

    for (const cand of candidates) {
        if (result.length >= limit) break;
        tryPick(cand);
    }
    // 정상 후보만으로 부족할 때만 두음법칙 위반 후보로 채운다 (희귀 성씨·획수 대비)
    for (const cand of fallback) {
        if (result.length >= limit) break;
        tryPick(cand);
    }

    // 그래도 부족하면 다양성 캡(첫/끝 음절 3개·뒤집기 제한)을 풀고 채운다
    // — 한자 풀이 좁은 성씨·획수 조합에서는 후보 수 확보가 우선
    if (result.length < limit) {
        for (const cand of [...candidates, ...fallback]) {
            if (result.length >= limit) break;
            if (pickedNames.has(cand.hangul)) continue;
            pickedNames.add(cand.hangul);
            result.push(cand);
        }
    }

    // 최종 결과 리스트를 점수 기준으로 다시 한 번 내림차순 정렬 (다양성 캡 완화로 인해 순서가 흐트러지는 현상 방지)
    result.sort((a, b) => b.score - a.score);

    return result;
}
