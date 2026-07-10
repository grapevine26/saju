# 🌙 다시, 우리 — AI 재회 가능성 분석 서비스

> 사주 데이터 기반으로 재회 가능성 점수, 최적 연락 타이밍(골든 윈도우), 맞춤 전략을 제공하는 프리미엄 모바일 컨설팅 앱

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Zustand](https://img.shields.io/badge/Zustand-상태관리-orange)](https://zustand-demo.pmnd.rs)

---

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# Inngest 로컬 개발 서버 실행 (배경 작업 모니터링)
npx inngest-cli dev -u http://localhost:3000/api/inngest

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정 (`.env.local`)

```env
# Gemini API Key (재회 분석 AI 리포트 생성용)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (데이터베이스 & 인증)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (이메일 발송 및 수신 포워딩)
RESEND_API_KEY=re_your_resend_api_key

# Toss Payments API Keys (테스트 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# Admin Dashboard (관리자 페이지 비밀번호)
ADMIN_PASSWORD=your_admin_password
```

> ⚠️ `.env.local`은 Git에 포함되지 않습니다. 직접 생성하세요.

---

## 📱 주요 기능 & 사용법

### 1. 재회 가능성 분석 (Basic — 무료)

1. **`/input`** 페이지에서 나의 정보 + 상대방 정보 입력
   - 이름, 성별, 생년월일 (음력/양력 선택 가능)
   - 출생 시간 (모를 경우 "시간 모름" 체크)
   - 출생지 (자동 시차 보정 적용)
2. **분석하기** 버튼 클릭
3. **`/result`** 페이지에서 결과 확인
   - 재회 가능성 점수 (0~100) — 원형 게이지 애니메이션
   - 합/충/형/해 관계 분석
   - AI 맞춤형 전략 리포트

### 2. 골든 윈도우 캘린더 (Standard — 1,900원)

- 향후 **6개월** 월별 재회 에너지 점수 시각화
- **골든 윈도우** (점수 ≥ 70): 상대방에게 연락하기 가장 좋은 달
- 최적 달 선택 이유 + 구체적 행동 조언 포함

### 3. 프로필 저장 & 재사용

- **`/profiles`** 페이지에서 자주 쓰는 사람 정보 저장
- 일주(日柱) 자동 추출 → 아바타 아이콘 자동 생성
- 분석 시 프로필 불러오기 가능 (입력 시간 절약)

### 4. 분석 기록 열람

- **`/history`** 페이지에서 이전 분석 결과 모두 확인
- 분석 날짜, 상대방 정보, 점수 요약 표시
- 로컬스토리지 저장 → 앱 재시작 후에도 유지
- 로그인 유저의 경우 Supabase DB와 자동 동기화

### 5. 고객 센터 (Inbound Email Forwarding)

- **`support@dasisaju.com`** 으로 수신된 고객 문의를 관리자의 개인 Gmail로 자동 포워딩
- Resend Inbound Webhook + Next.js API Route 기반 연동
- Gmail에서 답장 시 고객에게 바로 전달되도록 `replyTo` 최적화

### 6. 법적 고지 관리 시스템
- **`/src/constants/policies.tsx`** 에서 개인정보처리방침, 이용약관, 환불정책을 통합 관리
- 랜딩페이지 하단 법적 고지 페이지와 결제 모달 내의 법적 고지 팝업에서 동일한 데이터를 동적 렌더링하여 데이터 일관성 보장

### 7. SEO 및 SNS 공유 최적화 (OpenGraph, Sitemap, Robots)
- **`/public/og-image.png`** (1200×630): 카카오톡, 페이스북, 트위터(X) 등 SNS 공유 시 노출되는 프리미엄 우주/골드 테마 대표 썸네일 이미지 적용
- **`/sitemap.xml` 및 `/robots.txt`**: 검색 엔진 수집 최적화를 위해 Next.js App Router 방식(`sitemap.ts`, `robots.ts`)으로 자동 생성 구현
  - 검색 엔진이 메인, 입력 폼, 메뉴, 법적 고지 페이지만 수집하도록 유도하고, 개인 분석 데이터 및 관리자 영역은 크롤링에서 안전하게 제외
- Google Search Console 소유권 인증 완료 (`google7a7b83c9e215be27.html`)

---

## 🪶 윤명(潤名) — 작명 · 개명 · 감명 서비스 (`/yunmyeong`)

> 정통 성명학(81수리 · 원형이정 사격 · 자원오행)을 100% 규칙 기반으로 연산하고, AI는 프리미엄 리포트 해설만 담당하는 하이브리드 서비스. 기존 재회 서비스 코드와 완전히 격리되어 있습니다.
> 디자인은 `design_handoff_myeongdam` 핸드오프(hi-fi) 기준 — **hybrid 테마**(랜딩·입력=한지 / 로딩 이후=오브시디언), 클리프 Hook, 오행 만다라 로딩 채택.

### 사용 흐름 (전환 퍼널)

1. **`/yunmyeong`** — 랜딩 (모드 선택: 아기 작명 名 / 개명 改 / 감명 鑑 · 가격 미노출)
2. **`/yunmyeong/input?mode=…`** — 단계별 입력 위저드 (원화면 원액션, 칩 선택 시 280ms 자동 진행)
   - 공통: 성씨(한자·원획 실시간 프리뷰) → 성별 → 생년월일 → 12시진 출생 시간
   - 개명: + 현재 이름 → 고민(선택) / 감명: + 검증할 이름 / 마지막: 가치 선택
3. **`/yunmyeong/analysis`** — 오행 만다라 로딩(4.5초, 비선형 진행) → **무료 진단**(사주 4주 표 + 레이더 차트 + 결핍 카피, 100% 결정론 — Gemini 미호출) → 블러 리포트 티저 + 가격 카드
4. **`/yunmyeong/result/[jobId]`** — **명명증서 命名證書** (감명은 감명 결과서)
   - 처방 이름 10선 아코디언 · 한자 풀이 · 수리 4격 그리드 · AI 해설
   - 현재 이름 판정 카드: 감명 = 감명 판정 + 보완 후보 3선 / 개명 = 현재 이름 진단 + 처방 10선 (감명 ⊂ 개명 상품 구조)
   - **[PDF 리포트 다운로드]** = 브라우저 인쇄 기반 / 공유 카드(이미지 생성은 TODO 스텁)

### 🔊 어감 및 발음 필터링 정책 (`nameGenerator.ts`)

성명학적 획수와 자원오행을 만족하더라도 다음과 같이 어색하거나 현대적이지 않은 어감은 자동으로 필터링하여 제외합니다.

- **하드 블록 및 감점**: `삼, 식, 악, 증, 토, 옥, 숭, 배, 렬` 및 **두음법칙 위반(이름 첫 글자 'ㄹ')** 후보 완전 제외(하드 블록) 및 `방`, `봉`과 같이 어감이 투박하고 예스러운 음절 감점 (-10점)
- **자음동화로 인한 발음 꼬임 방지**: 둘째 글자가 초성 **'ㄹ'**로 시작하는 음절(랑, 람, 림, 린, 련, 률, 려 등)이고, 첫째 글자의 받침이 `ㄴ/ㄹ/ㅇ/ㅁ`이면 발음이 꼬이거나 다른 단어로 동화되므로 차단 (예: `현랑`, `연랑`, `신람`, `민림`[밀림], `민린`[밀린], `연림`[열림] 등 차단)
- **성씨 연음 및 어감 필터링**:
  - 성씨와 이름 첫 글자가 동일한 경우 차단 (예: `김김현`, `이이서` 등)
  - 성씨의 초성과 이름 두 글자의 초성이 모두 동일한 자음인 경우 차단 (예: `주준진`, `지준진`, `강건기` 등 3연속 동일 초성 방지)
  - '전'씨 성에 이름 첫 글자가 '온'인 경우 차단 (`전온정`, `전온희` 등 발음 연음 [저논] 및 어색한 단어 연상 방지)
  - '전'씨 성에 이름 첫 글자가 '남'인 경우 차단 (`전남은` 등 '전남' 지역명 연상 방지)
  - '전'씨 성에 이름 첫 글자가 '안'인 경우 차단 (연음 [저난] 및 '저난년(저년)' 비속어 연상 방지)
  - '전'씨 성에 '정온' 이름 조합 차단 (`전정온` -> `전정` 및 '전정기관' 연상 방지)
  - '전'씨 성에 '청온' 이름 조합 차단 (`전청온` -> 어색한 발음 및 특정 단어 연상 방지)
  - '전'씨 성에 '현하' 이름 조합 차단 (`전현하` -> 임금 호칭 '전하' 및 발음 꼬임 방지)
  - '전'씨 성에 '연하' 이름 조합 차단 (`전연하` -> '전 연하(ex-partner)' 단어 연상 방지)
  - '전'씨 성에 '경온' 이름 조합 차단 (`전경온` -> '전경' 단어 연상 방지)
  - '주'씨 성에 '준현' 이름 조합 차단 (`주준현` -> ㅈ 초성 연속 반복 및 둔탁한 발음 방지)
  - '박'씨 성에 '주서' 이름 조합 차단 (`박주서` -> '박쥐' 연상 및 어감/발음 연상 어색함 방지)
- **특정 어색한 조합 차단**: `요율`, `요지`, `지경`, `지율`, `우지`, `지우`, `영시`, `율경`, `영예`, `예영`, `환현`, `율연`, `율영`, `온지`, `온희`, `연신`(부사/지역명 연상), `예민`(부정적/민감 성격 연상 방지), `우배`/`희배`(어색하고 예스러운 조합), `지하`(어두운 단어 연상), `민윤`/`민연`/`윤연`/`연효`(발음 꼬임 및 연음 어색함), `신연`(비속어 및 전신 연상 방지), `연민`(동정 단어 연상), `연배`(나이대 연상), `봉진`(옛스럽고 투박한 어감), `준진`(ㅈ 초성 반복), `배우`(직업 명칭 및 '전 배우' 연상), `안연`(연음 시 비속어 연상), `욱현`(발음이 억세고 부자연스러움), `승성`/`성승`(발음이 둔탁하고 꼬임), `지목`(지목하다 연상), `현휘`(예스럽고 소설 같은 어감), `지휘`(오케스트라 지휘 연상), `수주`(수주하다 연상), `곤연`(비속어 연상), `현온`/`수온`/`온서`(발음 및 단어 연상 어색함), `성단`(우주 성단 연상), `단윤`(발음 뻑뻑함), `온수`(뜨거운 물 연상), `민단`(단체명 연상), `명예`(일반명사 연상), `흔예`(발음 뻑뻑함) 및 **여성으로 작명 시 남성적인 이름 조합**(예: `태진`, `태주`, `태찬`, `민태`, `찬연`, `태성`, `태건`, `태호`, `태환`, `태영`, `태준`, `태재`, `찬우`, `찬율`, `찬혁`, `단성`, `곤성`, `단민`, `규하`, `성곤`, `온현` 및 태/건/찬/혁/욱/철/석/용/동/호/환/웅/종/규/강/봉/범 계열의 확고한 남성적 이름 150여 개 조합) 등

### 아키텍처 (기존 코드와 격리)

```
src/features/naming/          # 핵심 로직 (기존 사주 코드 미접촉)
├── types.ts                  # 작명 전용 타입
├── constants.ts              # 가격(작명·개명 29,000 / 감명 9,900) · 세션 키
├── yunmyeong.ts              # 윤명 디자인 카피 원문 + 가격 정책 + 표시용 매핑
├── appraisal.ts              # 감명 연산 (독음 기반 한자 추정 — 한계 주석 참고)
├── data/
│   ├── suri81.ts             # 81수리 길흉표
│   ├── surnames.ts           # 주요 성씨 한자 · 원획수 (~85개)
│   └── hanjaDict.ts          # 인명용 한자 사전 (원획법 · 자원오행)
├── strokeCalculator.ts       # 원형이정 사격 연산 + 길수 획수쌍 탐색
├── ohaengAnalysis.ts         # 오행 결핍 진단 + 보완 오행 결정 (상생 고려)
├── nameGenerator.ts          # 규칙 기반 이름 후보 생성기
├── namingPrompt.ts           # Gemini 프롬프트 · 스키마 (프리미엄 해설 전담)
└── inngestFunction.ts        # 프리미엄 리포트 백그라운드 생성 (+실패 시 자동 환불)

src/app/yunmyeong/               # 라우팅 (랜딩/입력/분석/결제/결과) + 전용 layout(serif 폰트)
src/app/api/naming/analyze    # 무료 진단 API (5회/일 제한, 결정론 연산만)
src/app/api/naming/confirm    # 토스 결제 승인 + 작업 생성 (서비스별 금액 서버 검증)
src/components/naming/yunmyeong/  # MdCharts · MdSajuPillars · MdLoading · MdHook · MdPaymentSheet · MdReport
```

- **테마 토큰**: `globals.css` 하단 `[data-md-theme="hanji"|"obsidian"]` 스코프 + `--md-*` 변수 — 기존 `:root` 토큰과 완전 격리

- **DB**: 기존 `premium_analysis_jobs` 테이블 재사용 (`raw_data.service = 'naming'`), 추가 마이그레이션 불필요
- **결제**: 기존 토스페이먼츠 MID 재사용, 엔드포인트만 분리 (`/api/naming/confirm`)
- **Inngest 이벤트**: `naming.premium.requested` (기존 `analysis.premium.requested`와 분리)

### 결제 보류 모드 (현재 활성)

`src/features/naming/constants.ts`의 **`NAMING_PAYMENT_ENABLED = false`** 상태에서는:

- 가격 카드 CTA 클릭 시 결제 시트 없이 `/api/naming/start`로 리포트가 즉시 무료 발급됩니다 (IP당 하루 3회 제한)
- `true`로 바꾸면 결제 바텀시트 → 토스 결제 퍼널이 복원되며, `/api/naming/start`는 403으로 자동 봉쇄되어 결제 우회가 불가능합니다

### 💳 로컬 개발 환경 결제 우회 (Bypass)

로컬 개발 환경(`process.env.NODE_ENV === 'development'`)에서는 토스페이먼츠 실결제창을 띄우지 않고 바로 가짜 성공 페이지로 리다이렉트되어 결제 처리가 우회됩니다.

- **우회 플로우**: 결제하기 버튼 클릭 → 토스 결제창 호출 생략 → `/payment/success` 혹은 `/yunmyeong/payment/success`로 즉시 리다이렉트 → `dev_payment_key` 기반으로 백그라운드 작업(Inngest) 시작.
- **적용 영역**: 
  - 다시, 우리 프리미엄 리포트 결제 (`/analysis`, `/history/[id]`)
  - 윤명 프리미엄 리포트 결제 (`/yunmyeong/analysis`)

### 엔진 검증

```bash
# 성씨 × 성별 × 결핍오행 110개 조합 스모크 테스트
npx tsx scripts/test-naming-engine.ts
```

모든 후보가 수리 사격 4격 길수 조건을 만족하는지 자동 검증합니다.

---

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 랜딩 페이지
│   ├── input/                # 정보 입력 (DualInputForm)
│   ├── result/               # 분석 결과
│   ├── analysis/             # 상세 분석 (만세력 테이블 등)
│   ├── history/              # 분석 기록 목록 + 상세
│   ├── profiles/             # 프로필 관리 + 상세
│   ├── legal/                # 법적 고지 페이지 (privacy, terms, refund)
│   └── api/
│       ├── reunion/          # 재회 가능성 점수 + AI 리포트 API
│       ├── golden-window/    # 골든 윈도우 캘린더 API
│       └── saju/             # 만세력(사주) 계산 API
│
├── components/
│   ├── ReunionGauge.tsx      # 재회 점수 원형 게이지 (SVG + 애니메이션)
│   ├── GoldenWindowTimeline.tsx # 월별 에너지 바 차트
│   ├── CompatibilityChart.tsx   # 합/충/형/해 관계 시각화
│   ├── OhhaengRadarChart.tsx    # 오행 균형 레이더 차트
│   ├── DualInputForm.tsx         # 나 + 상대방 동시 입력 폼
│   ├── SingleInputForm.tsx       # 단일 입력 폼
│   ├── ManseryeokTable.tsx       # 만세력 4기둥 테이블
│   ├── SajuAccordion.tsx         # 분석 결과 아코디언
│   ├── AvatarIcon.tsx            # 일주 기반 아바타 아이콘
│   ├── LocationSearch.tsx        # 출생지 검색 (시차 자동 보정)
│   └── PaymentModal.tsx          # 결제 모달 (공통 법적 고지 포함)
│
├── utils/
│   ├── baziCalc.ts           # 만세력 계산 엔진
│   ├── sajuMapper.ts         # 합/충/형/해/오행 매핑 테이블
│   ├── compatibilityCalc.ts  # 궁합 분석 + 재회 점수 산출
│   └── goldenWindowCalc.ts   # 골든 윈도우 타이밍 계산
│
├── store/
│   └── useSajuStore.ts       # Zustand 전역 상태 (로컬 저장 persist)
│
└── constants/
    ├── sajuTime.ts           # 시주 시간 테이블
    └── policies.tsx          # 공통 법적 고지 데이터
```

---

## 🔢 재회 점수 계산 공식

```
재회 가능성 점수 =
  끌림 지수(40%) + 오행 보완도(30%) + (100 - 갈등 지수)(30%)
```

| 지수 | 설명 |
|------|------|
| **끌림 지수** | 천간합 · 지지합 · 일간합 · 부부궁합 기반 |
| **갈등 지수** | 충 · 형 · 해 관계 기반 |
| **오행 보완도** | 두 사람의 오행(목화토금수) 균형도 |

---

## 🛠️ 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 상태 관리 | Zustand + persist 미들웨어 |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 음양력 변환 | lunar-javascript |
| 스타일 | Tailwind CSS + 커스텀 글래스모피즘 |
| AI 리포트 | Google Gemini API |
| 결제 시스템 | Toss Payments (토스페이먼츠) |
| 배경 작업 | Inngest |
| 법적 고지 관리 | Centralized Constants (JSX support) |

---

## 🌐 API 명세

### `POST /api/reunion`
두 사람의 사주 데이터를 받아 궁합 분석 + AI 재회 전략 리포트 반환

### `POST /api/golden-window`
두 사람의 일주(일간/일지)를 기반으로 향후 6개월 최적 연락 타이밍 반환

### `POST /api/saju`
단일 사용자 정보로 만세력(사주 8자) 계산 결과 반환
