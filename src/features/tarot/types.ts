export type TarotGender = 'male' | 'female';
export type TarotSituation = 'breakup' | 'crush' | 'dating' | 'unrequited';

export interface TarotInput {
    myName: string;
    myGender: TarotGender;
    partnerName: string;
    partnerGender: TarotGender;
    situation: TarotSituation;
    question: string;
}

export interface TarotCard {
    id: number;
    name: string;
    symbol: string;
    en: string;
    keywords: string;
}

export interface TarotCardReading {
    cardId: number;
    cardName: string;
    keyPhrase: string;
    interpretation: string;
}

export interface TarotRoundResult {
    theme: string;
    cards: TarotCardReading[];
    synthesis: string;
}

export interface TarotFreeResult {
    round1: TarotRoundResult;
    directAnswer: string;
}

/** 유료 스페셜 풀이 — 카드 7장을 근거로 한 토픽형 해석 */
export interface TarotSpecialReading {
    /** 두 사람의 궁합 온도 (0~100) */
    chemistryScore: number;
    /** 온도에 대한 한 줄 코멘트 */
    chemistryComment: string;
    /** 그 사람이 끌리는 나의 모습 */
    charmPoint: string;
    /** 상황별 다가가는 법 */
    approachTip: string;
    /** 앞으로 한 달의 흐름과 주의 신호 */
    monthAhead: string;
}

export interface TarotFullResult {
    round2: TarotRoundResult;
    round3: TarotRoundResult;
    finalMessage: string;
    directAnswer: string;
    /** 구버전 결과에는 없을 수 있음 */
    special?: TarotSpecialReading;
}

export interface TarotPendingData {
    input: TarotInput;
    rounds: [number[], number[], number[]];
    freeResult: TarotFreeResult;
    orderId: string;
    customerEmail: string;
}
