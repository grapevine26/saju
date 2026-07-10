import { NameCandidate, NamingServiceType, NamingValue, Ohaeng, OhaengDiagnosis } from './types';

// ─────────────────────────────────────────────
// 윤명(潤名) 디자인 시스템 — UI 카피 & 파생 데이터
// design_handoff_myeongdam 핸드오프의 카피를 '원문 그대로' 보관한다.
// (카피 수정 금지 — 변경 시 디자인 핸드오프와 싱크가 깨짐)
// 연산 로직은 기존 features/naming 엔진을 사용하고,
// 이 모듈은 화면 표시용 매핑/카피만 담당한다.
// ─────────────────────────────────────────────

/** 랜딩 모드 카드 (id는 기존 NamingServiceType과 매핑됨) */
export const MD_MODES: Array<{
    id: NamingServiceType;
    title: string;
    sub: string;
    desc: string;
    glyph: string;
}> = [
    {
        id: 'newborn', title: '아기 작명', sub: '신생아',
        desc: '사주의 빈 곳을 채우는 이름 10선과 인명용 한자 풀이',
        glyph: '名',
    },
    {
        id: 'rename', title: '개명', sub: '새 출발',
        desc: '지금 이름의 수리를 진단하고 흐름을 바꿀 이름을 처방',
        glyph: '改',
    },
    {
        id: 'evaluation', title: '감명', sub: '이름 검증',
        desc: '직접 지은 이름이 사주에 맞는지 성명학적으로 검증',
        glyph: '鑑',
    },
];

/** 가치 선호 옵션 (id는 기존 NamingValue와 매핑 — 핸드오프 'sound' → 기존 'modern') */
export const MD_VALUES: Array<{ id: NamingValue; label: string; icon: string; copy: string }> = [
    { id: 'wealth', label: '재물운', icon: '◈', copy: '재물의 그릇' },
    { id: 'career', label: '커리어 · 성공', icon: '◆', copy: '성취와 명예' },
    { id: 'health', label: '건강 · 장수', icon: '●', copy: '건강한 흐름' },
    { id: 'modern', label: '세련된 어감', icon: '◇', copy: '부르기 좋은 결' },
];

/** 로딩 시퀀스 (5종 순차 교체) */
export const MD_LOADING_STEPS = [
    '입력하신 생년월일의 사주 명식 추출 중',
    '선천적으로 타고난 오행의 과다 · 결핍 연산 중',
    '성명학 정통 규칙(원격·형격·이격·정격) 수리 배열 매칭 중',
    '대법원 지정 인명용 한자 8,142자 대조 중',
    '명식 맞춤 해설 집필 중',
];

/** 12시진 칩 (이름 + 시간 범위) */
export const MD_SIJIN: Array<[string, string]> = [
    ['자시', '23–01시'], ['축시', '01–03시'], ['인시', '03–05시'], ['묘시', '05–07시'],
    ['진시', '07–09시'], ['사시', '09–11시'], ['오시', '11–13시'], ['미시', '13–15시'],
    ['신시', '15–17시'], ['유시', '17–19시'], ['술시', '19–21시'], ['해시', '21–23시'],
];

/** 시진 인덱스 → 대표 시각 (시주 연산용 — 각 시진의 중심 시각) */
export const MD_SIJIN_HOUR = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

/** 오행 한자 표기 */
export const MD_EL_HANJA: Record<Ohaeng, string> = {
    목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
};

/** 오행별 '자산' 카피 — 진단 문구의 빈칸에 들어가는 표현 */
export const MD_EL_ASSET: Record<Ohaeng, string> = {
    목: '성장과 명예의 뿌리',
    화: '존재감과 확장의 불씨',
    토: '신용과 터전의 기반',
    금: '결단과 완성의 추진력',
    수: '평생의 자산과 결실',
};

/** 오행 결핍 방치 시 리스크 카피 */
export const MD_EL_LACK_COPY: Record<Ohaeng, string> = {
    목: '새로운 일을 벌여도 뿌리내리지 못하고, 배움과 명예가 결실 직전에 흩어지기 쉽습니다.',
    화: '능력에 비해 존재감이 드러나지 않아, 기회가 와도 주목받지 못한 채 지나가기 쉽습니다.',
    토: '주변 환경이 자주 흔들리고, 신용과 터전이 쌓이다가도 무너지는 흐름이 반복되기 쉽습니다.',
    금: '마무리와 결단의 힘이 약해, 다 된 일이 마지막 문턱에서 어긋나는 패턴이 생기기 쉽습니다.',
    수: '열심히 노력해도 재물이 밑 빠진 독에 물 붓듯 새어나가고, 늘 마지막 결실에서 좌절하기 쉽습니다.',
};

/** 일간(日干) 10천간 캐릭터 템플릿 — 무료 진단의 '내 얘기' 체감용 (결정론) */
export const MD_DAYMASTER: Record<string, { hanja: string; element: Ohaeng; title: string; desc: string }> = {
    갑: {
        hanja: '甲', element: '목', title: '하늘로 곧게 뻗는 거목',
        desc: '시작을 두려워하지 않는 개척의 명식입니다. 꺾이는 한이 있어도 구부러지지 않는 강직함이 운의 뼈대를 이룹니다.',
    },
    을: {
        hanja: '乙', element: '목', title: '바위틈에서도 길을 내는 덩굴',
        desc: '부드럽지만 결국 원하는 곳에 닿는 유연한 생존력의 명식입니다. 환경이 거칠수록 오히려 빛을 발합니다.',
    },
    병: {
        hanja: '丙', element: '화', title: '만물을 고루 비추는 태양',
        desc: '숨기려 해도 드러나는 존재감의 명식입니다. 사람을 모으고 판을 밝히는 확장의 기운을 타고났습니다.',
    },
    정: {
        hanja: '丁', element: '화', title: '어둠일수록 또렷해지는 등불',
        desc: '화려하진 않아도 가장 오래 타오르는 집중의 명식입니다. 한 분야를 깊게 파고들 때 진가가 드러납니다.',
    },
    무: {
        hanja: '戊', element: '토', title: '흔들림 없이 자리를 지키는 큰 산',
        desc: '쉽게 동요하지 않는 묵직한 신뢰의 명식입니다. 주변이 흔들릴 때 중심을 잡는 역할이 따라옵니다.',
    },
    기: {
        hanja: '己', element: '토', title: '만물을 길러내는 기름진 땅',
        desc: '드러나지 않게 결실을 만들어내는 실속의 명식입니다. 품어 기르는 자리에서 가장 큰 힘을 냅니다.',
    },
    경: {
        hanja: '庚', element: '금', title: '벼릴수록 강해지는 무쇠',
        desc: '망설임 없이 끊어내는 결단의 명식입니다. 시련을 거칠수록 더 단단해지는 구조를 타고났습니다.',
    },
    신: {
        hanja: '辛', element: '금', title: '세공을 마친 날카로운 보석',
        desc: '디테일에서 승부가 갈리는 완성도의 명식입니다. 예리한 안목과 절제된 품격이 무기입니다.',
    },
    임: {
        hanja: '壬', element: '수', title: '바다를 향해 멈추지 않는 큰 강',
        desc: '스케일 큰 지혜와 포용의 명식입니다. 고이지 않고 흐를 때 재물과 기회가 함께 따라옵니다.',
    },
    계: {
        hanja: '癸', element: '수', title: '메마른 땅을 깨우는 봄비',
        desc: '소리 없이 스며들어 판을 바꾸는 통찰의 명식입니다. 섬세함이 곧 경쟁력이 되는 구조입니다.',
    },
};

/** 오행 상극(相剋) 관계 — key가 value를 누른다 */
const MD_GEUK: Record<Ohaeng, Ohaeng> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

/** 상극 비유 표현 (X가 Y를 누르는 모습) */
const MD_GEUK_VERB: Record<Ohaeng, string> = {
    목: '뿌리가 흙을 가르듯',
    토: '둑이 물길을 막듯',
    수: '물이 불씨를 꺼뜨리듯',
    화: '불이 쇠를 녹이듯',
    금: '도끼가 나무를 베듯',
};

/** 과다 오행 ↔ 결핍 오행의 상호작용 진단 (결정론 템플릿) */
export function mdConflictCopy(strongest: Ohaeng, lacking: Ohaeng): string | null {
    if (strongest === lacking) return null;
    const s = `${strongest}(${MD_EL_HANJA[strongest]})`;
    const l = `${lacking}(${MD_EL_HANJA[lacking]})`;
    if (MD_GEUK[strongest] === lacking) {
        // 과다 오행이 결핍 오행을 직접 극(剋)하는 구조 — 가장 강한 경고
        return `지금 명식에서는 과다한 ${s}의 기운이 부족한 ${l}을 ${MD_GEUK_VERB[strongest]} 끊임없이 누르고 있습니다. 채워지지 않는 한, 이 불균형은 시간이 갈수록 더 깊어지는 구조입니다.`;
    }
    return `과다한 ${s}의 기운이 명식의 중심을 차지하면서, 가장 약한 ${l}은 점점 설 자리를 잃어가는 구조입니다.`;
}

/**
 * 오행 균형 점수 (0~100, 결정론)
 * 다섯 오행이 각 20%일 때 100점. 편차 합이 클수록 점수가 낮아진다.
 */
export function mdBalanceScore(percentages: Record<Ohaeng, number>): number {
    const sumDev = (['목', '화', '토', '금', '수'] as const)
        .reduce((acc, el) => acc + Math.abs((percentages[el] ?? 0) - 20), 0);
    return Math.max(5, Math.min(95, Math.round(100 - sumDev * 1.0)));
}

/** 균형 점수 라벨 */
export function mdBalanceLabel(score: number): string {
    if (score >= 70) return '안정';
    if (score >= 50) return '주의';
    if (score >= 30) return '불균형';
    return '심각한 불균형';
}

/** 차트/표 공용 — 오행 분포 행 */
export interface MdDistRow {
    el: Ohaeng;
    hanja: string;
    count: number;
    pct: number;
}

/** 진단 결과 → 차트용 분포 배열 (목화토금수 순서 고정) */
export function mdDist(diagnosis: Pick<OhaengDiagnosis, 'counts' | 'percentages'>): MdDistRow[] {
    return (['목', '화', '토', '금', '수'] as const).map((el) => ({
        el,
        hanja: MD_EL_HANJA[el],
        count: diagnosis.counts[el] ?? 0,
        pct: diagnosis.percentages[el] ?? 0,
    }));
}

/** 결핍 오행 (0개 오행이 있으면 그중 1순위, 없으면 최약 오행) */
export function mdLacking(diagnosis: Pick<OhaengDiagnosis, 'missing' | 'weakest' | 'counts' | 'percentages'>): MdDistRow {
    const el = diagnosis.missing.length > 0 ? diagnosis.missing[0] : diagnosis.weakest;
    return {
        el,
        hanja: MD_EL_HANJA[el],
        count: diagnosis.counts[el] ?? 0,
        pct: diagnosis.percentages[el] ?? 0,
    };
}

/** 가격 정책 — 작명/개명 29,000원(정가 290,000원), 감명 9,900원(정가 120,000원) */
export interface MdPricing {
    headline: string;
    bullets: string[];
    price: number;
    original: number;
    cta: string;
}

export function mdPricing(
    serviceType: NamingServiceType,
    lackingEl: Ohaeng,
    currentName?: string | null
): MdPricing {
    const el = lackingEl;
    const elH = MD_EL_HANJA[el];
    if (serviceType === 'evaluation') {
        const name = currentName || '';
        return {
            headline: `'${name}' 감명 결과 전체 리포트`,
            bullets: [
                '수리 4격(원형이정) 길흉 정밀 판정',
                '동명 인명용 한자 후보별 오행 대조',
                `부족한 ${el}(${elH}) 기운 보완 후보 3선`,
                '평생 소장 가능한 감명 결과서(PDF) 즉시 발급',
            ],
            price: 9900, original: 120000,
            cta: `'${name}' 감명 결과 전체 확인하기`,
        };
    }
    const who = serviceType === 'newborn' ? '아이' : '나';
    return {
        headline: `부족한 '${el}(${elH})'의 기운을 완벽히 채워줄 최상위 프리미엄 이름 10선`,
        bullets: [
            // 개명은 현재 이름 진단(수리 4격 판정)까지 포함 — 감명의 상위 상품
            ...(serviceType === 'rename' ? ['현재 이름의 수리 4격 정밀 진단 포함'] : []),
            '정통 성명학 수리 4격 조건 100% 만족',
            '대법원 지정 인명용 한자 완벽 매칭 · 상세 해설',
            '평생 소장 가능한 명명증서(命名證書) PDF 즉시 발급',
        ],
        price: 29000, original: 290000,
        cta: `${who === '아이' ? '내 아이' : '내'} 사주를 완벽히 보완할 이름 10개 확인하기`,
    };
}

/** 원화 표기 */
export const mdWon = (n: number) => n.toLocaleString('ko-KR') + '원';

/**
 * 이름 후보 표시용 MATCH 점수 (84~99)
 * 내부 score는 정렬용 원점수라 표시용으로 보기 좋게 변환한다. (결정론적)
 */
export function mdMatchScore(candidate: NameCandidate, idx: number): number {
    const grades = [
        candidate.sagyeok.won.grade,
        candidate.sagyeok.hyeong.grade,
        candidate.sagyeok.i.grade,
        candidate.sagyeok.jeong.grade,
    ];
    const daegil = grades.filter((g) => g === '대길').length;
    return Math.max(84, Math.min(99, 92 + daegil * 2 - idx));
}
