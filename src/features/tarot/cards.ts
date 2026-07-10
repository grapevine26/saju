import { TarotCard } from './types';

export const TAROT_CARDS: TarotCard[] = [
    { id: 0,  name: "바보",        symbol: "✦", en: "The Fool",            keywords: "새로운 시작, 순수한 설렘, 예측 불가능한 도약, 두려움 없는 자유" },
    { id: 1,  name: "마법사",      symbol: "⊗", en: "The Magician",        keywords: "강한 의지, 실현 능력, 주도권, 자신감 있는 행동" },
    { id: 2,  name: "여사제",      symbol: "◑", en: "The High Priestess",  keywords: "숨겨진 감정, 직관, 말하지 않은 속마음, 기다림" },
    { id: 3,  name: "여황제",      symbol: "❋", en: "The Empress",         keywords: "풍요로운 감정, 깊은 애정, 감각적 끌림, 보살핌" },
    { id: 4,  name: "황제",        symbol: "⊕", en: "The Emperor",         keywords: "강한 통제욕, 안정 추구, 책임감, 거리를 두는 태도" },
    { id: 5,  name: "교황",        symbol: "✠", en: "The Hierophant",      keywords: "전통과 관습, 사회적 시선, 관계의 공식화, 헌신" },
    { id: 6,  name: "연인",        symbol: "⋈", en: "The Lovers",          keywords: "깊은 연결, 중요한 선택, 상호 끌림, 마음의 일치" },
    { id: 7,  name: "전차",        symbol: "⬡", en: "The Chariot",         keywords: "강한 추진력, 승리 의지, 감정 억제, 목표를 향한 돌진" },
    { id: 8,  name: "힘",          symbol: "∞", en: "Strength",            keywords: "내면의 용기, 부드러운 설득, 감정을 다스리는 힘, 인내" },
    { id: 9,  name: "은둔자",      symbol: "◎", en: "The Hermit",          keywords: "혼자만의 시간, 내면 성찰, 거리두기, 조용한 그리움" },
    { id: 10, name: "운명의 바퀴", symbol: "⊛", en: "Wheel of Fortune",    keywords: "운명적 전환점, 예상치 못한 변화, 인연의 순환, 타이밍" },
    { id: 11, name: "정의",        symbol: "⊖", en: "Justice",             keywords: "냉정한 판단, 균형, 원인과 결과, 솔직한 마음 정리" },
    { id: 12, name: "매달린 사람", symbol: "⌖", en: "The Hanged Man",      keywords: "자발적 정지, 다른 시각, 기다림 속의 내려놓음, 희생" },
    { id: 13, name: "죽음",        symbol: "⟁", en: "Death",               keywords: "완전한 종결, 강제적 변화, 집착으로부터의 해방, 새 국면" },
    { id: 14, name: "절제",        symbol: "⌀", en: "Temperance",          keywords: "균형 잡힌 감정, 천천히 흐르는 인연, 조화, 치유" },
    { id: 15, name: "악마",        symbol: "⌭", en: "The Devil",           keywords: "강렬한 집착, 놓지 못하는 욕망, 속박, 감추고 싶은 감정" },
    { id: 16, name: "탑",          symbol: "⚡", en: "The Tower",           keywords: "충격적 폭로, 갑작스러운 붕괴, 피할 수 없는 진실, 해방" },
    { id: 17, name: "별",          symbol: "✧", en: "The Star",            keywords: "희망, 치유되는 마음, 순수한 기대, 조용한 회복" },
    { id: 18, name: "달",          symbol: "☽", en: "The Moon",            keywords: "불확실한 감정, 숨겨진 두려움, 혼란, 드러나지 않은 속마음" },
    { id: 19, name: "태양",        symbol: "☀", en: "The Sun",             keywords: "기쁨, 확신, 활짝 열린 마음, 긍정적 에너지, 밝은 미래" },
    { id: 20, name: "심판",        symbol: "⊆", en: "Judgement",           keywords: "깨어남, 과거 정리, 결단의 순간, 두 번째 기회" },
    { id: 21, name: "세계",        symbol: "⊙", en: "The World",           keywords: "완성, 원하던 결실, 두 사람의 조화로운 마무리, 충만함" },
];

export function getCardById(id: number): TarotCard | undefined {
    return TAROT_CARDS.find(c => c.id === id);
}

export function getRandomCards(count: number = 12, exclude: number[] = []): number[] {
    const pool = TAROT_CARDS.map(c => c.id).filter(id => !exclude.includes(id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
