export const TAROT_INPUT_KEY   = 'tarot_input';
export const TAROT_ROUNDS_KEY  = 'tarot_rounds';
export const TAROT_FREE_KEY    = 'tarot_free_result';
export const TAROT_PENDING_KEY = 'tarot_pending';
export const TAROT_JOB_ID_KEY  = 'tarot_job_id';
export const TAROT_HISTORY_KEY = 'tarot_history';

export const TAROT_PRICE             = 3900;
export const TAROT_CARDS_PER_ROUND   = 12;
export const PICKS_PER_ROUND         = [2, 3, 2] as const;
export const TAROT_TOTAL_ROUNDS      = 3;

export const ROUND_THEMES = [
    { title: "1라운드", subtitle: "과거 — 두 사람의 연결 고리",    desc: "두 사람이 만나게 된 운명의 흔적" },
    { title: "2라운드", subtitle: "현재 — 지금 그 사람의 마음",    desc: "이 순간 그 사람 마음속에 담긴 것들" },
    { title: "3라운드", subtitle: "미래 — 앞으로의 흐름",          desc: "두 사람의 앞날에 펼쳐질 이야기" },
] as const;

export const SITUATION_LABELS: Record<string, string> = {
    breakup:    '헤어진 사이',
    crush:      '썸 타는 중',
    dating:     '연인 사이',
    unrequited: '짝사랑 중',
};
