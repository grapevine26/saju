// ─────────────────────────────────────────────
// 작명 서비스 공용 상수
// ─────────────────────────────────────────────

/**
 * 결제 기능 활성화 여부
 * false면 페이월 대신 무료로 전체 리포트를 즉시 발급한다. (PG 연동 보류 중)
 * true로 바꾸면 기존 토스 결제 퍼널이 그대로 복원된다.
 */
export const NAMING_PAYMENT_ENABLED = false;

/** 프리미엄 작명/개명 리포트 정가 (원) */
export const NAMING_PRICE = 29000;

/** 감명(이름 검증) 리포트 정가 (원) — 윤명 가격 정책 */
export const NAMING_PRICE_EVALUATION = 9900;

/** 토스 결제 주문명 */
export const NAMING_ORDER_NAME = '프리미엄 성명학 작명 리포트';

/** 결제 펜딩 정보 sessionStorage 키 */
export const NAMING_PENDING_KEY = 'naming_pending_payment';

/** 무료 진단 입력/결과 sessionStorage 키 */
export const NAMING_INPUT_KEY = 'naming_input';
export const NAMING_LITE_RESULT_KEY = 'naming_lite_result';

/** 발급된 리포트 히스토리 localStorage 키 */
export const NAMING_HISTORY_KEY = 'naming_history';
