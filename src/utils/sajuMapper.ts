export const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const ZHI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const GAN_DETAILS: Record<string, { ohhaeng: string, color: string }> = {
    '갑': { ohhaeng: '목', color: 'bg-[#86efac]/30 text-emerald-800' },
    '을': { ohhaeng: '목', color: 'bg-[#86efac]/30 text-emerald-800' },
    '병': { ohhaeng: '화', color: 'bg-[#fda4af]/30 text-rose-800' },
    '정': { ohhaeng: '화', color: 'bg-[#fda4af]/30 text-rose-800' },
    '무': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '기': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '경': { ohhaeng: '금', color: 'bg-[#d1d5db]/40 text-slate-700' },
    '신': { ohhaeng: '금', color: 'bg-[#d1d5db]/40 text-slate-700' }, // 매핑 주의, 한글이 같음
    '임': { ohhaeng: '수', color: 'bg-[#67e8f9]/30 text-cyan-800' },
    '계': { ohhaeng: '수', color: 'bg-[#67e8f9]/30 text-cyan-800' },
};

// 지지 오행 및 색상
const ZHI_DETAILS: Record<string, { ohhaeng: string, color: string }> = {
    '자': { ohhaeng: '수', color: 'bg-[#67e8f9]/30 text-cyan-800' },
    '축': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '인': { ohhaeng: '목', color: 'bg-[#86efac]/30 text-emerald-800' },
    '묘': { ohhaeng: '목', color: 'bg-[#86efac]/30 text-emerald-800' },
    '진': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '사': { ohhaeng: '화', color: 'bg-[#fda4af]/30 text-rose-800' },
    '오': { ohhaeng: '화', color: 'bg-[#fda4af]/30 text-rose-800' },
    '미': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '신': { ohhaeng: '금', color: 'bg-[#d1d5db]/40 text-slate-700' },
    '유': { ohhaeng: '금', color: 'bg-[#d1d5db]/40 text-slate-700' },
    '술': { ohhaeng: '토', color: 'bg-[#fdba74]/30 text-orange-800' },
    '해': { ohhaeng: '수', color: 'bg-[#67e8f9]/30 text-cyan-800' },
};

// 한자 매핑
export const HANJA_MAP: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
    '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '유': '酉', '술': '戌', '해': '亥'
};
// 한자 -> 한글 변환
export const HANJA_TO_HANGUL: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

export const SHISHEN_MAP: Record<string, string> = {
    '比肩': '비견', '劫财': '겁재', '食神': '식신', '伤官': '상관',
    '偏财': '편재', '正财': '정재', '七杀': '편관', '偏官': '편관',
    '正官': '정관', '偏印': '편인', '正印': '정인'
};

export const DISHI_MAP: Record<string, string> = {
    '长生': '장생', '沐浴': '목욕', '冠带': '관대', '临官': '건록', '帝旺': '제왕',
    '衰': '쇠', '病': '병', '死': '사', '墓': '묘', '绝': '절', '胎': '태', '养': '양',
    '長生': '장생', '臨官': '건록', '絕': '절' // 번체 예외
};

const getHanja = (char: string, isZhi = false) => {
    if (char === '신') return isZhi ? '申' : '辛';
    return HANJA_MAP[char] || char; // 이미 한자면 그대로 반환될 수도 있음
};

// 한국식 주요 신살 계산기 (연지, 일지 기준 삼합)
// 삼합: 신자진(수), 해묘미(목), 인오술(화), 사유축(금)
const getSamhapGroup = (zhi: string) => {
    if (['신', '자', '진'].includes(zhi)) return '신자진';
    if (['해', '묘', '미'].includes(zhi)) return '해묘미';
    if (['인', '오', '술'].includes(zhi)) return '인오술';
    if (['사', '유', '축'].includes(zhi)) return '사유축';
    return '';
};

// 십이신살 배열 (순서 중요: 겁살 -> 재살 -> 천살 -> 지살 -> 년살(도화) -> 월살 -> 망신살 -> 장성살 -> 반안살 -> 역마살 -> 육해살 -> 화개살)
const SHIBI_SHINSAL = ['겁살', '재살', '천살', '지살', '년살', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'];

// 삼합 기준 첫 글자(장성살 위치에서 4단계 앞이 지살, 등등 규칙이 있음)
// 신자진: 신(지살) 자(장성) 진(화개)
// 해묘미: 해(지살) 묘(장성) 미(화개)
// 인오술: 인(지살) 오(장성) 술(화개)
// 사유축: 사(지살) 유(장성) 축(화개)

// 십이신살은 삼합의 첫 글자를 기준으로 지지의 순서에 따라 정해짐
// 각 삼합의 '지살'에 해당하는 지지가 무엇인지 매핑
const JISAL_MAP: Record<string, string> = {
    '신자진': '신',
    '해묘미': '해',
    '인오술': '인',
    '사유축': '사'
};

const ZHI_ORDER = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const get12Shinsal = (baseZhi: string, targetZhi: string): string => {
    if (!baseZhi || !targetZhi || baseZhi === '?' || targetZhi === '?') return '-';

    const group = getSamhapGroup(baseZhi);
    if (!group) return '-';

    const jisalChar = JISAL_MAP[group];

    // 지살의 인덱스 번호 (0~11)
    const jisalIdx = ZHI_ORDER.indexOf(jisalChar);
    // 내 글자(targetZhi)의 인덱스 번호
    const targetIdx = ZHI_ORDER.indexOf(targetZhi);

    if (jisalIdx === -1 || targetIdx === -1) return '-';

    // 십이신살 인덱스 계산 (지살이 인덱스 3에 해당함. 왜냐하면 겁(0), 재(1), 천(2), 지살(3))
    // (targetIdx - jisalIdx) 간격을 구한 뒤, 지살의 기본 위치인 +3을 해줌
    let diff = (targetIdx - jisalIdx + 12) % 12; // 양수로 만듦
    let shinsalIdx = (diff + 3) % 12;

    return SHIBI_SHINSAL[shinsalIdx];
};

export const getShinsal = (gan: string, zhi: string, yearZhi: string, dayZhi: string): string[] => {
    const shinsals: string[] = [];
    if (!zhi || zhi === '?') return shinsals;

    // 1. 년지(태어난 해) 기준 십이신살 (위 줄 표기용)
    const yearBased = get12Shinsal(yearZhi, zhi);
    shinsals.push(yearBased !== '-' ? yearBased : '-');

    // 2. 일지(태어난 날) 기준 십이신살 (아래 줄 표기용)
    const dayBased = get12Shinsal(dayZhi, zhi);
    shinsals.push(dayBased !== '-' ? dayBased : '-');

    return shinsals;
};

// 일반 길흉신살 (신살) 계산기
export const getGeneralShinsal = (gan: string, zhi: string, dayGan: string, yearZhi: string, dayZhi: string): string[] => {
    const shinsals: string[] = [];
    if (!gan || !zhi || gan === '?' || zhi === '?') return shinsals;

    const pillar = `${gan}${zhi}`;

    // 0. 천을귀인 (일간 기준)
    // 갑무경: 축, 미 / 을기: 자, 신(申) / 병정: 해, 유 / 신(辛): 인, 오 / 임계: 묘, 사
    if (dayGan === '갑' || dayGan === '무' || dayGan === '경') { if (zhi === '축' || zhi === '미') shinsals.push('천을귀인'); }
    if (dayGan === '을' || dayGan === '기') { if (zhi === '자' || zhi === '신') shinsals.push('천을귀인'); }
    if (dayGan === '병' || dayGan === '정') { if (zhi === '해' || zhi === '유') shinsals.push('천을귀인'); }
    if (dayGan === '신') { if (zhi === '인' || zhi === '오') shinsals.push('천을귀인'); }
    if (dayGan === '임' || dayGan === '계') { if (zhi === '묘' || zhi === '사') shinsals.push('천을귀인'); }

    // 1. 백호대살
    const baekho = ['무진', '정축', '병술', '을미', '갑진', '계축', '임술'];
    if (baekho.includes(pillar)) shinsals.push('백호대살');

    // 2. 괴강살
    const goegang = ['경진', '경술', '임진', '임술', '무술'];
    if (goegang.includes(pillar)) shinsals.push('괴강살');

    // 3. 현침살 (갑, 신, 묘, 오, 미, 신) - 글자 자체가 바늘모양
    const hyeonchim = ['갑', '신', '묘', '오', '미'];
    if (hyeonchim.includes(gan) || hyeonchim.includes(zhi)) {
        if (!shinsals.includes('현침살')) shinsals.push('현침살');
    }

    // 4. 귀문관살 (일지 기준 지지 원진/귀문 조합)
    const guimunPair = {
        '자': '유', '유': '자', '축': '오', '오': '축', '인': '미', '미': '인',
        '묘': '신', '신': '묘', '진': '해', '해': '진', '사': '술', '술': '사'
    };
    if (dayZhi && (guimunPair as any)[dayZhi] === zhi && zhi !== dayZhi) {
        shinsals.push('귀문관살');
    }

    // 5. 원진살 (일지 기준 지지 원진 조합 - 귀문과 거의 겹치나 자미, 축오, 인유, 묘신, 진해, 사술)
    // 5. 황은대사 (월지 기준: 정월-진, 이월-인, 삼월-사 ...)
    // 월지 자축인묘진사오미신유술해 순서에 따라 배정. 여기선 월지를 모르므로 현재는 적용 범위 한계가 있어 생략하거나 다른 기둥 기준으로 유사 길신 대체 가능.
    // 일단 일간 기준 문창귀인, 학당귀인, 암록, 천주귀인 위주로 추가 확충합니다.

    // 6. 문창귀인 (일간 기준)
    // 갑-사, 을-오, 병-신(申), 정-유, 무-신(申), 기-유, 경-해, 신(辛)-자, 임-인, 계-묘
    if (dayGan === '갑' && zhi === '사') shinsals.push('문창귀인');
    if (dayGan === '을' && zhi === '오') shinsals.push('문창귀인');
    if ((dayGan === '병' || dayGan === '무') && zhi === '신') shinsals.push('문창귀인');
    if ((dayGan === '정' || dayGan === '기') && zhi === '유') shinsals.push('문창귀인');
    if (dayGan === '경' && zhi === '해') shinsals.push('문창귀인');
    if (dayGan === '신' && zhi === '자') shinsals.push('문창귀인');
    if (dayGan === '임' && zhi === '인') shinsals.push('문창귀인');
    if (dayGan === '계' && zhi === '묘') shinsals.push('문창귀인');

    // 7. 암록 (일간 기준 건록과 합이 되는 지지)
    // 갑-해, 을-술, 병-신(申), 정-미, 무-신(申), 기-미, 경-사, 신(辛)-진, 임-인, 계-축
    if (dayGan === '갑' && zhi === '해') shinsals.push('암록');
    if (dayGan === '을' && zhi === '술') shinsals.push('암록');
    if ((dayGan === '병' || dayGan === '무') && zhi === '신') {
        if (!shinsals.includes('암록')) shinsals.push('암록');
    }
    if ((dayGan === '정' || dayGan === '기') && zhi === '미') shinsals.push('암록');
    if (dayGan === '경' && zhi === '사') shinsals.push('암록');
    if (dayGan === '신' && zhi === '진') shinsals.push('암록');
    if (dayGan === '임' && zhi === '인') {
        if (!shinsals.includes('암록')) shinsals.push('암록');
    }
    if (dayGan === '계' && zhi === '축') shinsals.push('암록');

    // 8. 천주귀인 (일간 기준)
    // 갑-사, 을-오, 병-사, 정-오, 무-신, 기-유, 경-해, 신-자, 임-인, 계-묘
    if ((dayGan === '갑' || dayGan === '병') && zhi === '사') shinsals.push('천주귀인');
    if ((dayGan === '을' || dayGan === '정') && zhi === '오') shinsals.push('천주귀인');
    if (dayGan === '무' && zhi === '신') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }
    if (dayGan === '기' && zhi === '유') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }
    if (dayGan === '경' && zhi === '해') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }
    if (dayGan === '신' && zhi === '자') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }
    if (dayGan === '임' && zhi === '인') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }
    if (dayGan === '계' && zhi === '묘') {
        if (!shinsals.includes('천주귀인')) shinsals.push('천주귀인');
    }

    // 9. 도화살 (년지, 일지 삼합 기준 다음 왕지)
    const checkDohwa = (baseZhi: string) => {
        const group = getSamhapGroup(baseZhi);
        if (group === '신자진' && zhi === '유') return true;
        if (group === '해묘미' && zhi === '자') return true;
        if (group === '인오술' && zhi === '묘') return true;
        if (group === '사유축' && zhi === '오') return true;
        return false;
    };
    if (checkDohwa(yearZhi) || checkDohwa(dayZhi)) {
        if (!shinsals.includes('도화살')) shinsals.push('도화살');
    }

    // 10. 역마살 (년지, 일지 삼합 기준 충 생지)
    const checkYeokma = (baseZhi: string) => {
        const group = getSamhapGroup(baseZhi);
        if (group === '신자진' && zhi === '인') return true;
        if (group === '해묘미' && zhi === '사') return true;
        if (group === '인오술' && zhi === '신') return true;
        if (group === '사유축' && zhi === '해') return true;
        return false;
    };
    if (checkYeokma(yearZhi) || checkYeokma(dayZhi)) {
        if (!shinsals.includes('역마살')) shinsals.push('역마살');
    }

    // 11. 화개살
    const checkHwagae = (baseZhi: string) => {
        const group = getSamhapGroup(baseZhi);
        if (group === '신자진' && zhi === '진') return true;
        if (group === '해묘미' && zhi === '미') return true;
        if (group === '인오술' && zhi === '술') return true;
        if (group === '사유축' && zhi === '축') return true;
        return false;
    };
    if (checkHwagae(yearZhi) || checkHwagae(dayZhi)) {
        if (!shinsals.includes('화개살')) shinsals.push('화개살');
    }

    // 12. 천문성 (지지가 술, 해, 묘, 미일 때 직관력이 뛰어남)
    if (['술', '해', '묘', '미'].includes(zhi)) {
        if (!shinsals.includes('천문성')) shinsals.push('천문성');
    }

    // 13. 곡각살 (천간 을, 기 / 지지 사, 축이 있을 때 뼈/관절 유의)
    if (['을', '기'].includes(gan) || ['사', '축'].includes(zhi)) {
        if (!shinsals.includes('곡각살')) shinsals.push('곡각살');
    }

    // 14. 간여지동 (기둥의 천간과 지지가 같은 오행일 때, 주관이 강함)
    if (GAN_DETAILS[gan]?.ohhaeng === ZHI_DETAILS[zhi]?.ohhaeng) {
        if (!shinsals.includes('간여지동')) shinsals.push('간여지동');
    }

    // 15. 효신살 (일부 일주 등에서 편인/정인을 깔았을 때)
    const hyosin = ['갑자', '을해', '병인', '정묘', '무오', '기사', '경진', '경술', '신미', '신축', '임신', '계유', '임자'];
    if (hyosin.includes(pillar)) {
        if (!shinsals.includes('효신살')) shinsals.push('효신살');
    }

    // 16. 음욕살 (부부궁, 연애 특성)
    const eumyok = ['신묘', '정미', '무술', '기미', '경신', '을묘', '계축'];
    if (eumyok.includes(pillar)) {
        if (!shinsals.includes('음욕살')) shinsals.push('음욕살');
    }

    // 17. 육수 (무토 일간의 특정 지지, 재주가 많음)
    const yuksu = ['무자', '무인', '무진', '무오', '무신', '무술'];
    if (yuksu.includes(pillar)) {
        if (!shinsals.includes('육수')) shinsals.push('육수');
    }

    // 18. 구추방해 (이성교제, 구설 유의)
    const guchu = ['무자', '무오', '임자', '임오', '을묘', '을유', '신묘', '신유', '기묘', '기유'];
    if (guchu.includes(pillar)) {
        if (!shinsals.includes('구추방해')) shinsals.push('구추방해');
    }

    // 19. 비인살 (양인의 충 - 은근한 고집)
    // 갑오, 병자, 무자, 경묘, 신미, 신축, 임오, 계미, 계축 등 (유파에 따라 다름)
    const biin = ['갑오', '병자', '무자', '경묘', '신미', '신축', '임오', '계미', '계축', '정유', '기유'];
    if (biin.includes(pillar)) {
        if (!shinsals.includes('비인살')) shinsals.push('비인살');
    }

    return shinsals;
};

// 십신 구하는 로직 (일간 기준)
// ...
const JIJANGGAN_MAP: Record<string, string[]> = {
    '자': ['임', '계'], '축': ['계', '신', '기'], '인': ['무', '병', '갑'], '묘': ['갑', '을'],
    '진': ['을', '계', '무'], '사': ['무', '경', '병'], '오': ['병', '기', '정'], '미': ['정', '을', '기'],
    '신': ['무', '임', '경'], '유': ['경', '신'], '술': ['신', '정', '무'], '해': ['무', '갑', '임']
};

// 십신 구하는 로직 (일간 기준)
// [목, 화, 토, 금, 수]
const OHHAENG_IDX = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 } as const;
const YIN_YANG = {
    '갑': '+', '병': '+', '무': '+', '경': '+', '임': '+',
    '을': '-', '정': '-', '기': '-', '신': '-', '계': '-',
    '자': '+', '인': '+', '진': '+', '오': '+', '신(申)': '+', '술': '+',
    '축': '-', '묘': '-', '사': '-', '미': '-', '유': '-', '해': '-'
};

const getSipsin = (dayGan: string, targetChar: string, isZhi: boolean): string => {
    const dayOhhaeng = GAN_DETAILS[dayGan]?.ohhaeng;
    const targetInfo = isZhi ? ZHI_DETAILS[targetChar] : GAN_DETAILS[targetChar];
    if (!dayOhhaeng || !targetInfo) return '';

    const targetOhhaeng = targetInfo.ohhaeng;

    let targetYinYang = YIN_YANG[targetChar as keyof typeof YIN_YANG];
    if (isZhi && targetChar === '신') targetYinYang = '+'; // 지지 신(申)은 양
    if (!isZhi && targetChar === '신') targetYinYang = '-'; // 천간 신(辛)은 음

    const dayYinYang = YIN_YANG[dayGan as keyof typeof YIN_YANG];

    // 생극제화 계산. (오행의 상생상극)
    // 인덱스: 목(0), 화(1), 토(2), 금(3), 수(4)
    // 내가 생함: (idx + 1) % 5
    // 내가 극함: (idx + 2) % 5
    // 나를 극함: (idx + 3) % 5
    // 나를 생함: (idx + 4) % 5 // 혹은 (idx - 1)

    const dIdx = OHHAENG_IDX[dayOhhaeng as keyof typeof OHHAENG_IDX];
    const tIdx = OHHAENG_IDX[targetOhhaeng as keyof typeof OHHAENG_IDX];

    const isSameYinYang = dayYinYang === targetYinYang;

    if (tIdx === dIdx) return isSameYinYang ? '비견' : '겁재';
    if (tIdx === (dIdx + 1) % 5) return isSameYinYang ? '식신' : '상관';
    if (tIdx === (dIdx + 2) % 5) return isSameYinYang ? '편재' : '정재';
    if (tIdx === (dIdx + 3) % 5) return isSameYinYang ? '편관' : '정관';
    if (tIdx === (dIdx + 4) % 5) return isSameYinYang ? '편인' : '정인';

    return '';
};

interface PillarParams {
    gan: string;
    zhi: string;
    dayGan: string;
    shiShenGan?: string;
    shiShenZhi?: string;
    diShi?: string;
    hideGan?: string[];
    yearZhi: string;
    dayZhi: string;
}

export const getManseryeokPillar = ({
    gan, zhi, dayGan, shiShenGan, shiShenZhi, diShi, hideGan, yearZhi, dayZhi
}: PillarParams) => {
    // 만약 시주를 모른다(알 수 없음)면 null 반환
    if (!gan || !zhi || gan === '?' || zhi === '?') return null;

    return {
        gan,
        ganHanja: getHanja(gan, false),
        ganOhhaeng: GAN_DETAILS[gan]?.ohhaeng || '',
        ganColor: GAN_DETAILS[gan]?.color || 'bg-slate-200 text-slate-800',

        // 일간 자리(dayGan === gan 이면서 일주인 경우)라도 라이브러리가 주면 그걸 쓰고, 없으면 getSipsin으로 '비견' 출력 유도
        ganSipsin: shiShenGan ? (SHISHEN_MAP[shiShenGan] || shiShenGan) : getSipsin(dayGan, gan, false),

        zhi,
        zhiHanja: getHanja(zhi, true),
        zhiOhhaeng: ZHI_DETAILS[zhi]?.ohhaeng || '',
        zhiColor: ZHI_DETAILS[zhi]?.color || 'bg-slate-200 text-slate-800',
        zhiSipsin: getSipsin(dayGan, zhi, true),

        // lunar-javascript의 지장간은 본기-중기-여기 역순이거나 글자가 빠지는 등 한국 명식과 맞지 않음
        // 따라서 한국에서 통용되는 JIJANGGAN_MAP(여기->중기->정기)을 1순위로 사용하도록 수정
        jijanggan: JIJANGGAN_MAP[zhi] || (hideGan && hideGan.length > 0 ? hideGan.map((h: string) => HANJA_TO_HANGUL[h] || h) : []),

        // 십이운성, 십이신살, 일반신살
        shibiUnsung: diShi ? (DISHI_MAP[diShi] || diShi) : '건록',
        shinsal: getShinsal(gan, zhi, yearZhi, dayZhi),
        generalShinsal: getGeneralShinsal(gan, zhi, dayGan, yearZhi, dayZhi)
    };
};
