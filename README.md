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

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정 (`.env.local`)

```env
# Gemini API Key (재회 분석 AI 리포트 생성용)
GEMINI_API_KEY=your_gemini_api_key_here
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
│   └── LocationSearch.tsx        # 출생지 검색 (시차 자동 보정)
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
    └── sajuTime.ts           # 시주 시간 테이블
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

---

## 🌐 API 명세

### `POST /api/reunion`
두 사람의 사주 데이터를 받아 궁합 분석 + AI 재회 전략 리포트 반환

### `POST /api/golden-window`
두 사람의 일주(일간/일지)를 기반으로 향후 6개월 최적 연락 타이밍 반환

### `POST /api/saju`
단일 사용자 정보로 만세력(사주 8자) 계산 결과 반환
