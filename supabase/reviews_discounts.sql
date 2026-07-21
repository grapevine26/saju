-- ─────────────────────────────────────────────
-- 후기 + 후기 보상 할인 코드
-- Supabase SQL Editor에서 1회 실행
-- reviews        : 결과 페이지 별점/한줄 후기 (잡당 1건)
-- discount_codes : 후기 제출 보상 20% 코드 (1회용 · 30일)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  job_id            UUID        NOT NULL UNIQUE,   -- 잡당 후기 1건
  service           TEXT        NOT NULL CHECK (service IN ('saju', 'tarot')),
  rating            INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  marketing_consent BOOLEAN     NOT NULL DEFAULT FALSE  -- 동의한 후기만 인스타/랜딩에 사용
);

CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews (service, created_at DESC);

CREATE TABLE IF NOT EXISTS discount_codes (
  code          TEXT        PRIMARY KEY,             -- 예: RE20-A3F9K2, 묘연10(공유)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  percent       INTEGER     NOT NULL DEFAULT 20 CHECK (percent BETWEEN 1 AND 100), -- 100 = 0원 쿠폰 (토스 승인 생략 경로)
  review_id     UUID        REFERENCES reviews(id),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,                          -- 1회용: NULL = 미사용
  used_order_id TEXT,                                 -- 마지막 사용 주문 (감사용)
  max_uses      INTEGER,                              -- NULL = 1회용 · 값 있으면 공유 코드(횟수 한도)
  use_count     INTEGER     NOT NULL DEFAULT 0        -- 공유 코드 사용 횟수
);

-- 기존 테이블에 공유 코드 컬럼 추가 (2026-07-21 · 이미 생성된 DB에서 1회 실행)
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- RLS 활성화 + 정책 없음 = anon/authenticated 완전 차단, service role만 접근
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
