import { HanjaEntry, Ohaeng } from '../types';

// ─────────────────────────────────────────────
// 인명용 한자 사전 (대법원 인명용 한자 범위 내 선별)
// 획수는 성명학 원획법(강희자전 부수 환원) 기준.
//   예) 삼수변(氵)은 水 4획, 구슬옥변(王)은 玉 5획으로 계산.
// element는 자원오행(글자의 뿌리가 가진 오행) 기준.
// ─────────────────────────────────────────────

export const HANJA_DICT: HanjaEntry[] = [
    // ── 목(木) ──────────────────────────────
    { char: '木', reading: '목', strokes: 4, element: '목', meaning: '나무 목, 곧게 자람', gender: 'both' },
    // 5획
    { char: '玄', reading: '현', strokes: 5, element: '목', meaning: '검을 현, 깊고 오묘한 이치', gender: 'both' },
    // 6획
    { char: '聿', reading: '율', strokes: 6, element: '목', meaning: '붓 율, 스스로 세움', gender: 'both' },
    // 7획
    { char: '材', reading: '재', strokes: 7, element: '목', meaning: '재목 재, 쓸모 있는 인재', gender: 'male' },
    { char: '杏', reading: '행', strokes: 7, element: '목', meaning: '살구나무 행, 학문의 터전', gender: 'female' },
    { char: '志', reading: '지', strokes: 7, element: '목', meaning: '뜻 지, 굳은 의지', gender: 'both' },
    { char: '希', reading: '희', strokes: 7, element: '목', meaning: '바랄 희, 희망과 기대', gender: 'both' },
    // 8획
    { char: '杰', reading: '걸', strokes: 8, element: '목', meaning: '뛰어날 걸, 호걸', gender: 'male' },
    { char: '東', reading: '동', strokes: 8, element: '목', meaning: '동녘 동, 떠오르는 기운', gender: 'male' },
    { char: '林', reading: '림', strokes: 8, element: '목', meaning: '수풀 림, 무성한 번영', gender: 'both' },
    { char: '松', reading: '송', strokes: 8, element: '목', meaning: '소나무 송, 변치 않는 절개', gender: 'both' },
    { char: '昌', reading: '창', strokes: 8, element: '목', meaning: '창성할 창, 번영하고 융성함', gender: 'both' },
    // 9획
    { char: '柏', reading: '백', strokes: 9, element: '목', meaning: '측백나무 백, 푸른 지조', gender: 'male' },
    { char: '柱', reading: '주', strokes: 9, element: '목', meaning: '기둥 주, 집안의 동량', gender: 'male' },
    { char: '柔', reading: '유', strokes: 9, element: '목', meaning: '부드러울 유, 온화함', gender: 'female' },
    { char: '柳', reading: '류', strokes: 9, element: '목', meaning: '버드나무 류, 유연함', gender: 'female' },
    { char: '建', reading: '건', strokes: 9, element: '목', meaning: '세울 건, 기틀을 세움', gender: 'male' },
    { char: '紀', reading: '기', strokes: 9, element: '목', meaning: '벼리 기, 질서와 법도', gender: 'both' },
    { char: '泰', reading: '태', strokes: 9, element: '목', meaning: '클 태, 크고 편안함', gender: 'both' },
    // 10획
    { char: '桓', reading: '환', strokes: 10, element: '목', meaning: '굳셀 환, 큰 나무', gender: 'male' },
    { char: '根', reading: '근', strokes: 10, element: '목', meaning: '뿌리 근, 흔들리지 않는 근본', gender: 'male' },
    { char: '桂', reading: '계', strokes: 10, element: '목', meaning: '계수나무 계, 귀한 향기', gender: 'female' },
    { char: '芸', reading: '운', strokes: 10, element: '목', meaning: '향풀 운, 학문의 향기', gender: 'female' },
    { char: '芳', reading: '방', strokes: 10, element: '목', meaning: '꽃다울 방, 향기로움', gender: 'female' },
    { char: '娟', reading: '연', strokes: 10, element: '목', meaning: '예쁠 연, 유연하고 아름다움', gender: 'female' },
    // 11획
    { char: '梅', reading: '매', strokes: 11, element: '목', meaning: '매화 매, 맑은 기품', gender: 'female' },
    { char: '彬', reading: '빈', strokes: 11, element: '목', meaning: '빛날 빈, 문질이 겸비됨', gender: 'both' },
    { char: '梧', reading: '오', strokes: 11, element: '목', meaning: '오동나무 오, 봉황이 깃듦', gender: 'male' },
    { char: '健', reading: '건', strokes: 11, element: '목', meaning: '굳셀 건, 건강함', gender: 'male' },
    { char: '若', reading: '약', strokes: 11, element: '목', meaning: '같을 약, 순응하는 지혜', gender: 'female' },
    { char: '率', reading: '솔', strokes: 11, element: '목', meaning: '거느릴 솔, 솔선수범', gender: 'both' },
    { char: '彩', reading: '채', strokes: 11, element: '목', meaning: '채색 채, 빛나고 아름다움', gender: 'female' },
    // 12획
    { char: '雅', reading: '아', strokes: 12, element: '목', meaning: '바를 아, 맑고 고결함', gender: 'female' },
    { char: '景', reading: '경', strokes: 12, element: '목', meaning: '볕 경, 빛나는 경치', gender: 'both' },
    { char: '棟', reading: '동', strokes: 12, element: '목', meaning: '마룻대 동, 집안의 기둥', gender: 'male' },
    { char: '棲', reading: '서', strokes: 12, element: '목', meaning: '깃들 서, 편안히 자리잡음', gender: 'both' },
    { char: '植', reading: '식', strokes: 12, element: '목', meaning: '심을 식, 뿌리내림', gender: 'male' },
    // 13획
    { char: '楨', reading: '정', strokes: 13, element: '목', meaning: '광나무 정, 단단한 기둥', gender: 'male' },
    { char: '荷', reading: '하', strokes: 13, element: '목', meaning: '연꽃 하, 맑은 기상', gender: 'female' },
    { char: '煖', reading: '훈', strokes: 13, element: '목', meaning: '따뜻할 훈, 따뜻하게 감싸는 덕', gender: 'both' },
    // 14획
    { char: '榮', reading: '영', strokes: 14, element: '목', meaning: '영화 영, 번영과 영광', gender: 'both' },
    { char: '嘉', reading: '가', strokes: 14, element: '목', meaning: '아름다울 가, 훌륭하고 좋음', gender: 'both' },
    // 15획
    { char: '槿', reading: '근', strokes: 15, element: '목', meaning: '무궁화 근, 끈기와 영원', gender: 'female' },
    { char: '樂', reading: '락', strokes: 15, element: '목', meaning: '즐거울 락, 화락함', gender: 'both' },
    { char: '賢', reading: '현', strokes: 15, element: '목', meaning: '어질 현, 지혜롭고 덕스러움', gender: 'both' },
    // 16~
    { char: '樺', reading: '화', strokes: 16, element: '목', meaning: '자작나무 화, 곧고 흼', gender: 'both' },
    { char: '樹', reading: '수', strokes: 16, element: '목', meaning: '나무 수, 크게 세움', gender: 'male' },
    { char: '檀', reading: '단', strokes: 17, element: '목', meaning: '박달나무 단, 단단한 근본', gender: 'both' },
    { char: '蓮', reading: '련', strokes: 17, element: '목', meaning: '연꽃 련, 진흙 속 고결함', gender: 'female' },
    { char: '蘭', reading: '란', strokes: 23, element: '목', meaning: '난초 란, 그윽한 향기', gender: 'female' },
    { char: '藝', reading: '예', strokes: 21, element: '목', meaning: '재주 예, 뛰어난 재능', gender: 'both' },


    // ── 화(火) ──────────────────────────────
    // 4획
    { char: '丹', reading: '단', strokes: 4, element: '화', meaning: '붉을 단, 정성스러운 마음', gender: 'female' },
    // 5획 — 이름에 적합한 글자만
    // 6획
    { char: '旭', reading: '욱', strokes: 6, element: '화', meaning: '아침해 욱, 솟아오르는 빛', gender: 'male' },
    { char: '旨', reading: '지', strokes: 6, element: '화', meaning: '뜻 지, 높고 깊은 뜻', gender: 'both' },
    // 7획
    { char: '佑', reading: '우', strokes: 7, element: '화', meaning: '도울 우, 하늘이 도움', gender: 'both' },
    { char: '希', reading: '희', strokes: 7, element: '화', meaning: '바랄 희, 희망과 빛', gender: 'both' },
    // 8획
    { char: '昇', reading: '승', strokes: 8, element: '화', meaning: '오를 승, 상승하는 기운', gender: 'male' },
    { char: '旼', reading: '민', strokes: 8, element: '화', meaning: '화할 민, 온화한 하늘', gender: 'both' },
    { char: '昀', reading: '윤', strokes: 8, element: '화', meaning: '햇빛 윤, 고루 비추는 빛', gender: 'both' },
    { char: '明', reading: '명', strokes: 8, element: '화', meaning: '밝을 명, 총명함', gender: 'both' },
    { char: '昊', reading: '호', strokes: 8, element: '화', meaning: '하늘 호, 넓은 여름 하늘', gender: 'male' },
    { char: '昕', reading: '흔', strokes: 8, element: '화', meaning: '새벽 흔, 동트는 아침', gender: 'both' },
    { char: '炅', reading: '경', strokes: 8, element: '화', meaning: '빛날 경, 환한 광채', gender: 'both' },
    // 9획
    { char: '映', reading: '영', strokes: 9, element: '화', meaning: '비칠 영, 빛나는 모습', gender: 'female' },
    { char: '星', reading: '성', strokes: 9, element: '화', meaning: '별 성, 빛나는 존재', gender: 'both' },
    { char: '昭', reading: '소', strokes: 9, element: '화', meaning: '밝을 소, 환히 빛남', gender: 'female' },
    { char: '炫', reading: '현', strokes: 9, element: '화', meaning: '빛날 현, 눈부신 광채', gender: 'male' },
    { char: '炯', reading: '형', strokes: 9, element: '화', meaning: '빛날 형, 형형한 눈빛', gender: 'male' },
    { char: '南', reading: '남', strokes: 9, element: '화', meaning: '남녘 남, 따뜻한 방향', gender: 'both' },
    { char: '度', reading: '도', strokes: 9, element: '화', meaning: '법도 도, 도량과 깊이', gender: 'male' },
    { char: '俊', reading: '준', strokes: 9, element: '화', meaning: '준걸 준, 뛰어나고 영리함', gender: 'male' },
    { char: '敍', reading: '서', strokes: 9, element: '화', meaning: '차례 서, 정돈된 삶', gender: 'both' },
    { char: '律', reading: '율', strokes: 9, element: '화', meaning: '법칙 율, 질서와 지혜', gender: 'both' },
    // 10획
    { char: '時', reading: '시', strokes: 10, element: '화', meaning: '때 시, 때를 아는 지혜', gender: 'male' },
    { char: '夏', reading: '하', strokes: 10, element: '화', meaning: '여름 하, 왕성한 생명력', gender: 'female' },
    { char: '晏', reading: '안', strokes: 10, element: '화', meaning: '늦을 안, 편안하고 맑음', gender: 'both' },
    { char: '朗', reading: '랑', strokes: 10, element: '화', meaning: '밝을 랑, 밝고 상쾌함', gender: 'both' },
    { char: '烱', reading: '형', strokes: 10, element: '화', meaning: '빛날 형, 반짝이는 빛', gender: 'male' },
    // 11획
    { char: '晙', reading: '준', strokes: 11, element: '화', meaning: '밝을 준, 이른 아침 해', gender: 'male' },
    { char: '晟', reading: '성', strokes: 11, element: '화', meaning: '밝을 성, 융성한 빛', gender: 'male' },
    { char: '晨', reading: '신', strokes: 11, element: '화', meaning: '새벽 신, 부지런한 시작', gender: 'both' },
    { char: '焄', reading: '훈', strokes: 11, element: '화', meaning: '향내 훈, 피어오르는 향', gender: 'both' },
    { char: '焌', reading: '준', strokes: 11, element: '화', meaning: '불태울 준, 타오르는 열정', gender: 'male' },
    // 12획
    { char: '景', reading: '경', strokes: 12, element: '화', meaning: '볕 경, 큰 경치와 우러름', gender: 'both' },
    { char: '晶', reading: '정', strokes: 12, element: '화', meaning: '수정 정, 맑게 빛남', gender: 'female' },
    { char: '智', reading: '지', strokes: 12, element: '화', meaning: '지혜 지, 슬기로움', gender: 'both' },
    { char: '晴', reading: '청', strokes: 12, element: '화', meaning: '갤 청, 맑게 갠 하늘', gender: 'female' },
    { char: '勝', reading: '승', strokes: 12, element: '화', meaning: '이길 승, 뛰어난 승리', gender: 'male' },
    // 13획
    { char: '煐', reading: '영', strokes: 13, element: '화', meaning: '빛날 영, 환한 광채', gender: 'female' },
    { char: '煜', reading: '욱', strokes: 13, element: '화', meaning: '빛날 욱, 찬란한 불꽃', gender: 'male' },
    { char: '煥', reading: '환', strokes: 13, element: '화', meaning: '빛날 환, 밝게 빛남', gender: 'male' },
    { char: '照', reading: '조', strokes: 13, element: '화', meaning: '비칠 조, 세상을 비춤', gender: 'both' },
    { char: '暉', reading: '휘', strokes: 13, element: '화', meaning: '빛 휘, 햇빛의 광채', gender: 'male' },
    { char: '熙', reading: '희', strokes: 13, element: '화', meaning: '빛날 희, 화락하고 밝음', gender: 'both' },
    // 14획
    { char: '熏', reading: '훈', strokes: 14, element: '화', meaning: '향풀 훈, 감화시키는 덕', gender: 'male' },
    { char: '熙', reading: '희', strokes: 14, element: '화', meaning: '빛날 희, 넓고 밝음', gender: 'both' },
    // 15획
    { char: '瑩', reading: '형', strokes: 15, element: '화', meaning: '밝을 형, 옥처럼 맑음', gender: 'female' },
    { char: '禛', reading: '진', strokes: 15, element: '화', meaning: '복받을 진, 진실한 복', gender: 'both' },
    // 16획~
    { char: '曉', reading: '효', strokes: 16, element: '화', meaning: '새벽 효, 밝아오는 새벽', gender: 'female' },
    { char: '燕', reading: '연', strokes: 16, element: '화', meaning: '제비 연, 경쾌하고 화목함', gender: 'female' },
    { char: '燁', reading: '엽', strokes: 16, element: '화', meaning: '빛날 엽, 번쩍이는 빛', gender: 'male' },
    { char: '曄', reading: '엽', strokes: 16, element: '화', meaning: '빛날 엽, 성한 광채', gender: 'male' },
    { char: '暻', reading: '경', strokes: 16, element: '화', meaning: '밝을 경, 환한 햇살', gender: 'male' },
    { char: '燦', reading: '찬', strokes: 17, element: '화', meaning: '빛날 찬, 찬란함', gender: 'male' },
    { char: '燮', reading: '섭', strokes: 17, element: '화', meaning: '불꽃 섭, 조화시키는 힘', gender: 'male' },


    // ── 토(土) ──────────────────────────────
    { char: '土', reading: '토', strokes: 3, element: '토', meaning: '흙 토, 만물의 바탕', gender: 'both' },
    { char: '山', reading: '산', strokes: 3, element: '토', meaning: '뫼 산, 듬직한 기상', gender: 'male' },
    { char: '允', reading: '윤', strokes: 4, element: '토', meaning: '진실로 윤, 미쁘고 어짊', gender: 'both' },
    { char: '宇', reading: '우', strokes: 6, element: '토', meaning: '집 우, 넓은 기개', gender: 'both' },
    { char: '圭', reading: '규', strokes: 6, element: '토', meaning: '홀 규, 결백한 인품', gender: 'both' },
    { char: '在', reading: '재', strokes: 6, element: '토', meaning: '있을 재, 든든히 존재함', gender: 'male' },
    { char: '均', reading: '균', strokes: 7, element: '토', meaning: '고를 균, 균형과 공평', gender: 'male' },
    { char: '坤', reading: '곤', strokes: 8, element: '토', meaning: '땅 곤, 포용하는 대지', gender: 'both' },
    { char: '岡', reading: '강', strokes: 8, element: '토', meaning: '산등성이 강, 굳건함', gender: 'male' },
    { char: '岳', reading: '악', strokes: 8, element: '토', meaning: '큰산 악, 웅장한 기개', gender: 'male' },
    { char: '垠', reading: '은', strokes: 9, element: '토', meaning: '지경 은, 넓은 경계', gender: 'both' },
    { char: '城', reading: '성', strokes: 10, element: '토', meaning: '재 성, 든든한 성곽', gender: 'male' },
    { char: '峰', reading: '봉', strokes: 10, element: '토', meaning: '봉우리 봉, 우뚝 솟음', gender: 'male' },
    { char: '埈', reading: '준', strokes: 10, element: '토', meaning: '높을 준, 가파르게 높음', gender: 'male' },
    { char: '基', reading: '기', strokes: 11, element: '토', meaning: '터 기, 단단한 기초', gender: 'male' },
    { char: '培', reading: '배', strokes: 11, element: '토', meaning: '북돋울 배, 길러냄', gender: 'both' },
    { char: '堅', reading: '견', strokes: 11, element: '토', meaning: '굳을 견, 굳건한 의지', gender: 'male' },
    { char: '崙', reading: '륜', strokes: 11, element: '토', meaning: '곤륜산 륜, 높은 이상', gender: 'male' },
    { char: '崇', reading: '숭', strokes: 11, element: '토', meaning: '높을 숭, 숭고함', gender: 'male' },

    { char: '嵐', reading: '람', strokes: 12, element: '토', meaning: '산바람 람, 맑은 산기운', gender: 'female' },
    { char: '嵩', reading: '숭', strokes: 13, element: '토', meaning: '높을 숭, 우뚝한 산', gender: 'male' },
    { char: '境', reading: '경', strokes: 14, element: '토', meaning: '지경 경, 새 경지를 엶', gender: 'male' },
    { char: '墉', reading: '용', strokes: 14, element: '토', meaning: '담 용, 지켜주는 울타리', gender: 'male' },
    { char: '增', reading: '증', strokes: 15, element: '토', meaning: '더할 증, 늘어나는 복', gender: 'both' },
    { char: '壇', reading: '단', strokes: 16, element: '토', meaning: '단 단, 높은 자리', gender: 'both' },
    { char: '壎', reading: '훈', strokes: 17, element: '토', meaning: '질나발 훈, 어울리는 소리', gender: 'male' },
    { char: '嶺', reading: '령', strokes: 17, element: '토', meaning: '고개 령, 넘어서는 힘', gender: 'male' },
    { char: '睿', reading: '예', strokes: 16, element: '토', meaning: '밝을 예, 지혜롭고 깊음', gender: 'both' },
    { char: '穩', reading: '온', strokes: 19, element: '토', meaning: '평온할 온, 온화하고 평안함', gender: 'both' },
    { char: '延', reading: '연', strokes: 7, element: '토', meaning: '늘일 연, 널리 뻗어감', gender: 'both' },
    { char: '賢', reading: '현', strokes: 15, element: '토', meaning: '어질 현, 덕망과 지혜', gender: 'both' },


    // ── 금(金) ──────────────────────────────
    { char: '玉', reading: '옥', strokes: 5, element: '금', meaning: '구슬 옥, 귀한 보배', gender: 'female' },
    { char: '兌', reading: '태', strokes: 7, element: '금', meaning: '기쁠 태, 기쁨과 윤택', gender: 'both' },
    { char: '庚', reading: '경', strokes: 8, element: '금', meaning: '일곱째천간 경, 단단한 결실', gender: 'male' },
    { char: '金', reading: '금', strokes: 8, element: '금', meaning: '쇠 금, 귀한 가치', gender: 'both' },
    { char: '珉', reading: '민', strokes: 10, element: '금', meaning: '옥돌 민, 맑은 옥돌', gender: 'both' },
    { char: '珍', reading: '진', strokes: 10, element: '금', meaning: '보배 진, 진귀함', gender: 'female' },
    { char: '珠', reading: '주', strokes: 11, element: '금', meaning: '구슬 주, 빛나는 진주', gender: 'female' },
    { char: '珪', reading: '규', strokes: 11, element: '금', meaning: '홀 규, 옥으로 된 신표', gender: 'male' },
    { char: '現', reading: '현', strokes: 12, element: '금', meaning: '나타날 현, 드러나는 빛', gender: 'both' },
    { char: '球', reading: '구', strokes: 12, element: '금', meaning: '옥경쇠 구, 아름다운 옥', gender: 'male' },
    { char: '理', reading: '리', strokes: 12, element: '금', meaning: '다스릴 리, 이치에 밝음', gender: 'female' },
    { char: '琇', reading: '수', strokes: 12, element: '금', meaning: '옥돌 수, 빛나는 옥돌', gender: 'female' },
    { char: '鈺', reading: '옥', strokes: 13, element: '금', meaning: '보배 옥, 단단한 보물', gender: 'both' },
    { char: '鉉', reading: '현', strokes: 13, element: '금', meaning: '솥귀 현, 재상의 그릇', gender: 'male' },
    { char: '琳', reading: '림', strokes: 13, element: '금', meaning: '아름다운옥 림', gender: 'female' },
    { char: '琴', reading: '금', strokes: 13, element: '금', meaning: '거문고 금, 조화로운 소리', gender: 'female' },
    { char: '瑛', reading: '영', strokes: 14, element: '금', meaning: '옥빛 영, 옥의 광채', gender: 'female' },
    { char: '瑞', reading: '서', strokes: 14, element: '금', meaning: '상서 서, 길한 조짐', gender: 'both' },
    { char: '瑟', reading: '슬', strokes: 14, element: '금', meaning: '큰거문고 슬, 단아한 소리', gender: 'female' },
    { char: '銀', reading: '은', strokes: 14, element: '금', meaning: '은 은, 맑게 빛나는 은', gender: 'female' },
    { char: '銘', reading: '명', strokes: 14, element: '금', meaning: '새길 명, 마음에 새김', gender: 'male' },
    { char: '鋒', reading: '봉', strokes: 15, element: '금', meaning: '칼끝 봉, 예리한 기상', gender: 'male' },
    { char: '鋼', reading: '강', strokes: 16, element: '금', meaning: '강철 강, 단단한 심지', gender: 'male' },
    { char: '錫', reading: '석', strokes: 16, element: '금', meaning: '주석 석, 내려주는 복', gender: 'male' },
    { char: '錦', reading: '금', strokes: 16, element: '금', meaning: '비단 금, 화려한 결', gender: 'female' },
    { char: '璇', reading: '선', strokes: 16, element: '금', meaning: '옥 선, 북두의 별옥', gender: 'female' },
    { char: '鍵', reading: '건', strokes: 17, element: '금', meaning: '열쇠 건, 핵심을 쥠', gender: 'male' },
    { char: '鍾', reading: '종', strokes: 17, element: '금', meaning: '쇠북 종, 모이는 복', gender: 'male' },
    { char: '璟', reading: '경', strokes: 17, element: '금', meaning: '옥빛 경, 옥의 광채', gender: 'both' },
    { char: '鎬', reading: '호', strokes: 18, element: '금', meaning: '호경 호, 빛나는 도읍', gender: 'male' },
    { char: '璨', reading: '찬', strokes: 18, element: '금', meaning: '옥빛 찬, 찬란한 구슬', gender: 'both' },
    { char: '鏞', reading: '용', strokes: 19, element: '금', meaning: '큰쇠북 용, 웅장한 울림', gender: 'male' },
    { char: '瓊', reading: '경', strokes: 20, element: '금', meaning: '붉은옥 경, 귀한 옥', gender: 'female' },
    { char: '准', reading: '준', strokes: 10, element: '금', meaning: '평평할 준, 정확하고 올곧음', gender: 'male' },
    { char: '舒', reading: '서', strokes: 12, element: '금', meaning: '펼 서, 여유롭고 넓은 마음', gender: 'both' },
    { char: '妸', reading: '아', strokes: 8, element: '금', meaning: '아름다울 아, 우아한 자태', gender: 'female' },
    { char: '璡', reading: '진', strokes: 16, element: '금', meaning: '옥돌 진, 맑고 투명함', gender: 'both' },
    { char: '秀', reading: '수', strokes: 7, element: '금', meaning: '빼어날 수, 총명함과 아름다움', gender: 'both' },


    // ── 수(水) ──────────────────────────────
    { char: '水', reading: '수', strokes: 4, element: '수', meaning: '물 수, 흐르는 지혜', gender: 'both' },
    { char: '永', reading: '영', strokes: 5, element: '수', meaning: '길 영, 영원히 이어짐', gender: 'both' },
    { char: '汀', reading: '정', strokes: 6, element: '수', meaning: '물가 정, 잔잔한 물가', gender: 'female' },
    { char: '江', reading: '강', strokes: 7, element: '수', meaning: '강 강, 유유히 흐름', gender: 'male' },
    { char: '池', reading: '지', strokes: 7, element: '수', meaning: '못 지, 고요한 연못', gender: 'female' },
    { char: '求', reading: '구', strokes: 7, element: '수', meaning: '구할 구, 뜻을 구함', gender: 'male' },
    { char: '汎', reading: '범', strokes: 7, element: '수', meaning: '넓을 범, 두루 미침', gender: 'male' },
    { char: '沅', reading: '원', strokes: 8, element: '수', meaning: '강이름 원, 맑은 강물', gender: 'both' },
    { char: '河', reading: '하', strokes: 9, element: '수', meaning: '물 하, 큰 강의 흐름', gender: 'both' },
    { char: '泉', reading: '천', strokes: 9, element: '수', meaning: '샘 천, 솟아나는 근원', gender: 'both' },
    { char: '沼', reading: '소', strokes: 9, element: '수', meaning: '늪 소, 깊고 고요함', gender: 'female' },
    { char: '泫', reading: '현', strokes: 9, element: '수', meaning: '이슬빛날 현, 반짝이는 물', gender: 'female' },
    { char: '洙', reading: '수', strokes: 10, element: '수', meaning: '물가 수, 학문의 물가', gender: 'male' },
    { char: '洪', reading: '홍', strokes: 10, element: '수', meaning: '넓을 홍, 큰물의 기세', gender: 'male' },
    { char: '洋', reading: '양', strokes: 10, element: '수', meaning: '큰바다 양, 드넓음', gender: 'both' },
    { char: '洹', reading: '원', strokes: 10, element: '수', meaning: '물이름 원, 쉼없이 흐름', gender: 'male' },
    { char: '泰', reading: '태', strokes: 9, element: '수', meaning: '클 태, 크고 편안함', gender: 'male' },
    { char: '浩', reading: '호', strokes: 11, element: '수', meaning: '넓을 호, 호연지기', gender: 'male' },
    { char: '海', reading: '해', strokes: 11, element: '수', meaning: '바다 해, 모든 물을 품음', gender: 'both' },
    { char: '浚', reading: '준', strokes: 11, element: '수', meaning: '깊을 준, 깊은 통찰', gender: 'male' },
    { char: '雪', reading: '설', strokes: 11, element: '수', meaning: '눈 설, 순백의 결정', gender: 'female' },
    { char: '淡', reading: '담', strokes: 12, element: '수', meaning: '맑을 담, 담백한 성품', gender: 'both' },
    { char: '淳', reading: '순', strokes: 12, element: '수', meaning: '순박할 순, 도타운 인정', gender: 'both' },
    { char: '淵', reading: '연', strokes: 12, element: '수', meaning: '못 연, 깊은 연못', gender: 'male' },
    { char: '深', reading: '심', strokes: 12, element: '수', meaning: '깊을 심, 깊은 사려', gender: 'both' },
    { char: '雲', reading: '운', strokes: 12, element: '수', meaning: '구름 운, 높이 떠오름', gender: 'both' },
    { char: '湧', reading: '용', strokes: 13, element: '수', meaning: '샘솟을 용, 솟구치는 힘', gender: 'male' },
    { char: '源', reading: '원', strokes: 14, element: '수', meaning: '근원 원, 마르지 않는 샘', gender: 'male' },
    { char: '溫', reading: '온', strokes: 14, element: '수', meaning: '따뜻할 온, 온화한 덕', gender: 'female' },
    { char: '漢', reading: '한', strokes: 15, element: '수', meaning: '한수 한, 큰 강의 이름', gender: 'male' },
    { char: '潤', reading: '윤', strokes: 16, element: '수', meaning: '윤택할 윤, 풍요로움', gender: 'both' },
    { char: '澈', reading: '철', strokes: 16, element: '수', meaning: '맑을 철, 물이 맑음', gender: 'male' },
    { char: '霖', reading: '림', strokes: 16, element: '수', meaning: '장마 림, 단비의 은혜', gender: 'both' },
    { char: '澤', reading: '택', strokes: 17, element: '수', meaning: '못 택, 베푸는 은택', gender: 'male' },
    { char: '濟', reading: '제', strokes: 18, element: '수', meaning: '건널 제, 세상을 구제함', gender: 'male' },
    { char: '瀚', reading: '한', strokes: 20, element: '수', meaning: '넓고클 한, 드넓은 바다', gender: 'male' },
    { char: '漣', reading: '연', strokes: 15, element: '수', meaning: '물결 연, 유연한 흐름', gender: 'both' },
    { char: '汶', reading: '민', strokes: 8, element: '수', meaning: '물 이름 민, 맑고 깨끗함', gender: 'both' },

];

/** 특정 획수 + 오행에 해당하는 한자 후보 조회 */
export function findHanja(strokes: number, element: Ohaeng, gender: 'male' | 'female'): HanjaEntry[] {
    return HANJA_DICT.filter(
        h => h.strokes === strokes
            && h.element === element
            && (h.gender === 'both' || h.gender === gender)
    );
}

/** 사전에 존재하는 (획수, 오행) 조합 집합 — 수리 탐색 최적화용 */
export function availableStrokesByElement(element: Ohaeng, gender: 'male' | 'female'): number[] {
    const set = new Set<number>();
    HANJA_DICT.forEach(h => {
        if (h.element === element && (h.gender === 'both' || h.gender === gender)) {
            set.add(h.strokes);
        }
    });
    return Array.from(set).sort((a, b) => a - b);
}
