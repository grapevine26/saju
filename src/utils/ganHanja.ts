/** 천간 한글 → 한자 (운명의 합 인장 표기용) */
const GAN_HANJA: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

export const ganToHanja = (gan?: string | null): string => {
    if (!gan) return '?';
    return GAN_HANJA[gan.charAt(0)] || gan.charAt(0);
};
