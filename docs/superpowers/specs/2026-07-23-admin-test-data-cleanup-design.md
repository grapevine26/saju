# Admin: 결제소스 필터 + 테스트 데이터 일괄 삭제

## 배경

2026-07-23 admin 매출 정확도 작업(`adminOrders.ts`에 `paymentSource` 필드 도입) 이후, 개발모드/관리자 프리패스/0원 쿠폰으로 생성된 테스트 잡이 다수 발견되어 스크립트로 직접 조회·삭제했다. 앞으로 이런 정리가 admin UI 안에서 스크립트 없이 가능하도록 만든다.

## 목표

- admin 주문 탭에서 결제 소스(토스 실결제/개발모드/프리패스/0원쿠폰)로 필터링할 수 있다.
- 토스가 아닌 필터가 선택되면, 해당 조건에 맞는 잡을 한 번에 삭제할 수 있다.
- 삭제 시 연결된 `funnel_events`의 `paid` 이벤트도 함께 정리되어, 매출/유입 퍼널 두 지표가 항상 같이 맞는다.
- 실수로 실결제(토스) 데이터가 삭제되는 경로가 존재하지 않는다 (서버 가드).

## 비목표

- 개별 체크박스 선택 삭제 (범위 밖 — 필터 기준 일괄 삭제만 지원)
- `visit`/`free` 퍼널 이벤트 정리 (실제 마케팅 유입 데이터라 대상 아님)
- 삭제 취소/휴지통 (하드 삭제. 실행 전 확인 모달이 유일한 안전장치)

## 아키텍처

### `GET /api/admin/jobs`

기존 `service`/`status`/`q` 필터에 `paymentSource` 쿼리 파라미터를 추가한다. 응답에 현재 필터로 걸러진 목록의 `sumPrice`(금액 합계)를 추가해, 프론트가 확인 모달에 총액을 보여줄 수 있게 한다.

### `DELETE /api/admin/jobs`

새 핸들러. 요청 body로 `{ service?, status?, q?, paymentSource }`를 받아 GET과 동일한 필터링 로직으로 대상 잡을 계산한다.

**서버 가드**: `paymentSource`가 `'toss'`이거나 누락되면 400을 반환하고 아무것도 지우지 않는다. 이것이 최종 방어선이며, 프론트엔드 버튼 노출 여부와 무관하게 항상 적용된다.

처리 순서:
1. 필터에 맞는 잡 id 목록 계산 (premium/tarot 각각)
2. `funnel_events`에서 `event = 'paid' AND order_key IN (ids)` 삭제 — job 삭제보다 먼저 수행 (참조 정합성보다 "고아 이벤트가 남는 것"을 우선 피하기 위함이며, 이 테이블은 FK가 없어 순서 자체는 안전에 영향 없음)
3. `premium_analysis_jobs`/`tarot_reading_jobs`에서 해당 id 삭제
4. `{ deletedJobs, deletedFunnelEvents, errors? }` 응답

### 분류 로직 재사용

두 핸들러 모두 `adminOrders.ts`의 `classifyPremiumJob`/`classifyTarotJob`을 그대로 사용해 필터링한다. 필터 매칭 자체(주어진 `AdminOrder[]`와 필터 조건으로 대상을 고르고, `paymentSource==='toss'`/빈 값을 거부하는 부분)는 `adminOrders.ts`에 순수 함수 `selectDeletableOrders(orders, filters)`로 분리한다 — 이 함수가 이번 스펙의 핵심 단위 테스트 대상이다.

## 컴포넌트 (프론트엔드)

`OrdersTab.tsx`:
- 필터 바에 결제소스 `TabGroup` 추가: 전체 / 토스 / 개발모드 / 프리패스 / 0원쿠폰
- `paymentSource`가 토스/전체가 아닐 때만, 목록 위에 삭제 버튼(빨간색)을 노출: "이 조건에 해당하는 {total}건 (₩{sumPrice}) 삭제"
- 버튼 클릭 → 확인 모달(별도 컴포넌트, `window.confirm` 아님) → 확인 시 `DELETE /api/admin/jobs` 호출 → 성공 토스트 + 목록 새로고침

## 에러 처리

- `funnel_events` 삭제는 성공, `premium_analysis_jobs`/`tarot_reading_jobs` 삭제가 실패 → 전체 실패로 응답 (job이 안 지워졌으므로)
- job 삭제는 성공, 이후 단계(현재 설계상 job 삭제가 마지막 단계이므로 이 경우는 발생하지 않음 — funnel_events를 먼저 지우기 때문)
- Supabase 클라이언트는 멀티 테이블 트랜잭션을 지원하지 않으므로, 실패 시 부분 삭제 가능성을 응답의 `errors` 필드로 프론트에 알리고 관리자가 재시도하도록 안내한다.

## 테스트

- `src/lib/__tests__/adminOrders.test.ts` (신규): `selectDeletableOrders`에 대해
  - `paymentSource: 'toss'` 요청 시 빈 배열 + 에러 반환 확인
  - `paymentSource` 누락 시 동일하게 거부
  - `paymentSource: 'dev'` 등 정상 필터 시, 해당 소스의 잡만 선택되는지 확인
  - service/status/q와 결합했을 때 교집합이 맞는지 확인
- API route의 실제 Supabase 삭제 동작은 이 프로젝트에 테스트 DB가 없어 자동화 대상에서 제외. 배포 후 `/api/dev/premium-e2e` 등으로 만든 더미 dev 잡 하나를 실제로 필터링→삭제해보고, 목록과 funnel_events 양쪽에서 사라지는지 수동 확인한다.
