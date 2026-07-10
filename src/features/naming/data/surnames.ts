import { SurnameEntry } from '../types';

// ─────────────────────────────────────────────
// 주요 성씨 한자 데이터 (원획법 기준 획수)
// 동일 한글 성씨에 복수 본관 한자가 있는 경우 가장 인구가 많은 대표 한자를 사용한다.
// ─────────────────────────────────────────────

export const SURNAMES: Record<string, SurnameEntry> = {
    '김': { hangul: '김', hanja: '金', strokes: 8, element: '금' },
    '이': { hangul: '이', hanja: '李', strokes: 7, element: '목' },
    '박': { hangul: '박', hanja: '朴', strokes: 6, element: '목' },
    '최': { hangul: '최', hanja: '崔', strokes: 11, element: '토' },
    '정': { hangul: '정', hanja: '鄭', strokes: 19, element: '토' },
    '강': { hangul: '강', hanja: '姜', strokes: 9, element: '토' },
    '조': { hangul: '조', hanja: '趙', strokes: 14, element: '화' },
    '윤': { hangul: '윤', hanja: '尹', strokes: 4, element: '수' },
    '장': { hangul: '장', hanja: '張', strokes: 11, element: '금' },
    '임': { hangul: '임', hanja: '林', strokes: 8, element: '목' },
    '한': { hangul: '한', hanja: '韓', strokes: 17, element: '금' },
    '오': { hangul: '오', hanja: '吳', strokes: 7, element: '목' },
    '서': { hangul: '서', hanja: '徐', strokes: 10, element: '화' },
    '신': { hangul: '신', hanja: '申', strokes: 5, element: '금' },
    '권': { hangul: '권', hanja: '權', strokes: 22, element: '목' },
    '황': { hangul: '황', hanja: '黃', strokes: 12, element: '토' },
    '안': { hangul: '안', hanja: '安', strokes: 6, element: '목' },
    '송': { hangul: '송', hanja: '宋', strokes: 7, element: '목' },
    '류': { hangul: '류', hanja: '柳', strokes: 9, element: '목' },
    '전': { hangul: '전', hanja: '全', strokes: 6, element: '토' },
    '홍': { hangul: '홍', hanja: '洪', strokes: 10, element: '수' },
    '고': { hangul: '고', hanja: '高', strokes: 10, element: '화' },
    '문': { hangul: '문', hanja: '文', strokes: 4, element: '목' },
    '양': { hangul: '양', hanja: '梁', strokes: 11, element: '목' },
    '손': { hangul: '손', hanja: '孫', strokes: 10, element: '수' },
    '배': { hangul: '배', hanja: '裵', strokes: 14, element: '목' },
    '백': { hangul: '백', hanja: '白', strokes: 5, element: '금' },
    '허': { hangul: '허', hanja: '許', strokes: 11, element: '금' },
    '유': { hangul: '유', hanja: '劉', strokes: 15, element: '금' },
    '남': { hangul: '남', hanja: '南', strokes: 9, element: '화' },
    '심': { hangul: '심', hanja: '沈', strokes: 8, element: '수' },
    '노': { hangul: '노', hanja: '盧', strokes: 16, element: '화' },
    '하': { hangul: '하', hanja: '河', strokes: 9, element: '수' },
    '곽': { hangul: '곽', hanja: '郭', strokes: 15, element: '토' },
    '성': { hangul: '성', hanja: '成', strokes: 7, element: '화' },
    '차': { hangul: '차', hanja: '車', strokes: 7, element: '화' },
    '주': { hangul: '주', hanja: '朱', strokes: 6, element: '목' },
    '우': { hangul: '우', hanja: '禹', strokes: 9, element: '토' },
    '구': { hangul: '구', hanja: '具', strokes: 8, element: '금' },
    '민': { hangul: '민', hanja: '閔', strokes: 12, element: '목' },
    '진': { hangul: '진', hanja: '陳', strokes: 16, element: '토' },
    '지': { hangul: '지', hanja: '池', strokes: 7, element: '수' },
    '엄': { hangul: '엄', hanja: '嚴', strokes: 20, element: '목' },
    '채': { hangul: '채', hanja: '蔡', strokes: 17, element: '목' },
    '원': { hangul: '원', hanja: '元', strokes: 4, element: '목' },
    '천': { hangul: '천', hanja: '千', strokes: 3, element: '수' },
    '방': { hangul: '방', hanja: '方', strokes: 4, element: '토' },
    '공': { hangul: '공', hanja: '孔', strokes: 4, element: '수' },
    '현': { hangul: '현', hanja: '玄', strokes: 5, element: '화' },
    '함': { hangul: '함', hanja: '咸', strokes: 9, element: '수' },
    '변': { hangul: '변', hanja: '卞', strokes: 4, element: '토' },
    '염': { hangul: '염', hanja: '廉', strokes: 13, element: '목' },
    '여': { hangul: '여', hanja: '呂', strokes: 7, element: '수' },
    '추': { hangul: '추', hanja: '秋', strokes: 9, element: '금' },
    '도': { hangul: '도', hanja: '都', strokes: 16, element: '토' },
    '석': { hangul: '석', hanja: '石', strokes: 5, element: '금' },
    '소': { hangul: '소', hanja: '蘇', strokes: 22, element: '목' },
    '선': { hangul: '선', hanja: '宣', strokes: 9, element: '목' },
    '설': { hangul: '설', hanja: '薛', strokes: 19, element: '목' },
    '마': { hangul: '마', hanja: '馬', strokes: 10, element: '화' },
    '길': { hangul: '길', hanja: '吉', strokes: 6, element: '수' },
    '연': { hangul: '연', hanja: '延', strokes: 7, element: '토' },
    '표': { hangul: '표', hanja: '表', strokes: 9, element: '목' },
    '명': { hangul: '명', hanja: '明', strokes: 8, element: '화' },
    '기': { hangul: '기', hanja: '奇', strokes: 8, element: '토' },
    '반': { hangul: '반', hanja: '潘', strokes: 16, element: '수' },
    '왕': { hangul: '왕', hanja: '王', strokes: 5, element: '금' },
    '금': { hangul: '금', hanja: '琴', strokes: 13, element: '금' },
    '육': { hangul: '육', hanja: '陸', strokes: 16, element: '토' },
    '인': { hangul: '인', hanja: '印', strokes: 6, element: '목' },
    '맹': { hangul: '맹', hanja: '孟', strokes: 8, element: '수' },
    '제': { hangul: '제', hanja: '諸', strokes: 16, element: '금' },
    '탁': { hangul: '탁', hanja: '卓', strokes: 8, element: '목' },
    '국': { hangul: '국', hanja: '鞠', strokes: 17, element: '금' },
    '어': { hangul: '어', hanja: '魚', strokes: 11, element: '수' },
    '은': { hangul: '은', hanja: '殷', strokes: 10, element: '금' },
    '편': { hangul: '편', hanja: '片', strokes: 4, element: '목' },
    '용': { hangul: '용', hanja: '龍', strokes: 16, element: '토' },
    '예': { hangul: '예', hanja: '芮', strokes: 10, element: '목' },
    '경': { hangul: '경', hanja: '慶', strokes: 15, element: '화' },
    '봉': { hangul: '봉', hanja: '奉', strokes: 8, element: '목' },
    '사': { hangul: '사', hanja: '史', strokes: 5, element: '수' },
    '부': { hangul: '부', hanja: '夫', strokes: 4, element: '목' },
    // ── 특이(희귀) 성씨 — 인구는 적지만 미등록 시 퍼널이 끊기므로 수록 ──
    '당': { hangul: '당', hanja: '唐', strokes: 10, element: '토' },
    '견': { hangul: '견', hanja: '甄', strokes: 14, element: '토' },
    '단': { hangul: '단', hanja: '段', strokes: 9, element: '금' },
    '갈': { hangul: '갈', hanja: '葛', strokes: 15, element: '목' },
    '상': { hangul: '상', hanja: '尙', strokes: 8, element: '금' },
    '간': { hangul: '간', hanja: '簡', strokes: 18, element: '목' },
    '승': { hangul: '승', hanja: '承', strokes: 8, element: '목' },
    '팽': { hangul: '팽', hanja: '彭', strokes: 12, element: '화' },
    '좌': { hangul: '좌', hanja: '左', strokes: 5, element: '화' },
    '범': { hangul: '범', hanja: '范', strokes: 11, element: '목' },
    '시': { hangul: '시', hanja: '施', strokes: 9, element: '토' },
    // ── 복성 ──
    '황보': { hangul: '황보', hanja: '皇甫', strokes: 16, element: '토' },
    '남궁': { hangul: '남궁', hanja: '南宮', strokes: 19, element: '화' },
    '선우': { hangul: '선우', hanja: '鮮于', strokes: 20, element: '수' },
    '독고': { hangul: '독고', hanja: '獨孤', strokes: 25, element: '토' },
    '제갈': { hangul: '제갈', hanja: '諸葛', strokes: 31, element: '금' },
    '서문': { hangul: '서문', hanja: '西門', strokes: 14, element: '금' },
    '사공': { hangul: '사공', hanja: '司空', strokes: 13, element: '금' },
};

// ─────────────────────────────────────────────
// 동음이성(同音異姓) 변형 한자 테이블
// 같은 한글 성씨라도 본관에 따라 한자·원획수가 달라 수리 사격이 완전히
// 달라지므로, 인구가 유의미한 2순위 이하 한자를 별도 수록한다.
// (2015 인구총조사 기준 비대표 한자 인구 약 170만 명 커버)
// 첫 번째 항목은 반드시 SURNAMES의 대표 한자와 동일해야 한다.
// ─────────────────────────────────────────────

export const SURNAME_VARIANTS: Record<string, SurnameEntry[]> = {
    '정': [
        { hangul: '정', hanja: '鄭', strokes: 19, element: '토' },
        { hangul: '정', hanja: '丁', strokes: 2, element: '화' },
        { hangul: '정', hanja: '程', strokes: 12, element: '목' },
    ],
    '강': [
        { hangul: '강', hanja: '姜', strokes: 9, element: '토' },
        { hangul: '강', hanja: '康', strokes: 11, element: '목' },
    ],
    '조': [
        { hangul: '조', hanja: '趙', strokes: 14, element: '화' },
        { hangul: '조', hanja: '曺', strokes: 10, element: '토' },
    ],
    '유': [
        { hangul: '유', hanja: '劉', strokes: 15, element: '금' },
        { hangul: '유', hanja: '兪', strokes: 9, element: '목' },
        { hangul: '유', hanja: '庾', strokes: 12, element: '목' },
    ],
    '장': [
        { hangul: '장', hanja: '張', strokes: 11, element: '금' },
        { hangul: '장', hanja: '蔣', strokes: 17, element: '목' },
        { hangul: '장', hanja: '章', strokes: 11, element: '금' },
    ],
    '임': [
        { hangul: '임', hanja: '林', strokes: 8, element: '목' },
        { hangul: '임', hanja: '任', strokes: 6, element: '화' },
    ],
    '신': [
        { hangul: '신', hanja: '申', strokes: 5, element: '금' },
        { hangul: '신', hanja: '辛', strokes: 7, element: '금' },
        { hangul: '신', hanja: '愼', strokes: 14, element: '화' },
    ],
    '전': [
        { hangul: '전', hanja: '全', strokes: 6, element: '토' },
        { hangul: '전', hanja: '田', strokes: 5, element: '토' },
        { hangul: '전', hanja: '錢', strokes: 16, element: '금' },
    ],
    '양': [
        { hangul: '양', hanja: '梁', strokes: 11, element: '목' },
        { hangul: '양', hanja: '楊', strokes: 13, element: '목' },
    ],
    '주': [
        { hangul: '주', hanja: '朱', strokes: 6, element: '목' },
        { hangul: '주', hanja: '周', strokes: 8, element: '수' },
    ],
    '노': [
        { hangul: '노', hanja: '盧', strokes: 16, element: '화' },
        { hangul: '노', hanja: '魯', strokes: 15, element: '수' },
    ],
    '하': [
        { hangul: '하', hanja: '河', strokes: 9, element: '수' },
        { hangul: '하', hanja: '夏', strokes: 10, element: '화' },
    ],
    '성': [
        { hangul: '성', hanja: '成', strokes: 7, element: '화' },
        { hangul: '성', hanja: '星', strokes: 9, element: '화' },
    ],
    '구': [
        { hangul: '구', hanja: '具', strokes: 8, element: '금' },
        { hangul: '구', hanja: '丘', strokes: 5, element: '토' },
    ],
    '진': [
        { hangul: '진', hanja: '陳', strokes: 16, element: '토' },
        { hangul: '진', hanja: '秦', strokes: 10, element: '목' },
    ],
    '변': [
        { hangul: '변', hanja: '卞', strokes: 4, element: '토' },
        { hangul: '변', hanja: '邊', strokes: 22, element: '토' },
    ],
    '방': [
        { hangul: '방', hanja: '方', strokes: 4, element: '토' },
        { hangul: '방', hanja: '房', strokes: 8, element: '목' },
    ],
    '석': [
        { hangul: '석', hanja: '石', strokes: 5, element: '금' },
        { hangul: '석', hanja: '昔', strokes: 8, element: '화' },
    ],
};

/** 한글 성씨로 대표 성씨 정보 조회 (미등록 성씨는 null) */
export function findSurname(hangul: string): SurnameEntry | null {
    return SURNAMES[hangul.trim()] || null;
}

/** 한글 성씨의 한자 변형 목록 (동음이성 미등록이면 대표 한자 1개) */
export function findSurnameVariants(hangul: string): SurnameEntry[] {
    const key = hangul.trim();
    if (SURNAME_VARIANTS[key]) return SURNAME_VARIANTS[key];
    const single = SURNAMES[key];
    return single ? [single] : [];
}

/**
 * 한글 성씨 + 선택한 한자로 성씨 정보 확정
 * 한자 미지정/불일치 시 대표 한자로 폴백한다. (구버전 입력 호환)
 */
export function resolveSurname(hangul: string, hanja?: string | null): SurnameEntry | null {
    const variants = findSurnameVariants(hangul);
    if (variants.length === 0) return null;
    if (hanja) {
        const hit = variants.find((v) => v.hanja === hanja);
        if (hit) return hit;
    }
    return variants[0];
}

/** 지원하는 성씨 한글 목록 */
export const SURNAME_LIST = Object.keys(SURNAMES);
