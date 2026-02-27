// 전통 12지시 시간표 (자시~해시) 및 기본 맵핑 분(minute)
// 참고: 지역표준시(경도) 보정은 baziCalc 연산 단에서 추가로 들어갑니다.
export const ZHI_TIME_RANGES = [
    { label: "자시 (야자시)", zhi: "자", period: "23:30 ~ 23:59", hour: 23, minute: 30 },
    { label: "자시 (조자시)", zhi: "자", period: "00:00 ~ 01:29", hour: 0, minute: 30 },
    { label: "축시", zhi: "축", period: "01:30 ~ 03:29", hour: 1, minute: 30 },
    { label: "인시", zhi: "인", period: "03:30 ~ 05:29", hour: 3, minute: 30 },
    { label: "묘시", zhi: "묘", period: "05:30 ~ 07:29", hour: 5, minute: 30 },
    { label: "진시", zhi: "진", period: "07:30 ~ 09:29", hour: 7, minute: 30 },
    { label: "사시", zhi: "사", period: "09:30 ~ 11:29", hour: 9, minute: 30 },
    { label: "오시", zhi: "오", period: "11:30 ~ 13:29", hour: 11, minute: 30 },
    { label: "미시", zhi: "미", period: "13:30 ~ 15:29", hour: 13, minute: 30 },
    { label: "신시", zhi: "신", period: "15:30 ~ 17:29", hour: 15, minute: 30 },
    { label: "유시", zhi: "유", period: "17:30 ~ 19:29", hour: 17, minute: 30 },
    { label: "술시", zhi: "술", period: "19:30 ~ 21:29", hour: 19, minute: 30 },
    { label: "해시", zhi: "해", period: "21:30 ~ 23:29", hour: 21, minute: 30 },
];
