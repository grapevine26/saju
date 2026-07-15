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
  code          TEXT        PRIMARY KEY,             -- 예: RE20-A3F9K2
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  percent       INTEGER     NOT NULL DEFAULT 20 CHECK (percent BETWEEN 1 AND 90),
  review_id     UUID        REFERENCES reviews(id),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,                          -- NULL = 미사용
  used_order_id TEXT                                  -- 사용된 주문 (감사용)
);

-- RLS 활성화 + 정책 없음 = anon/authenticated 완전 차단, service role만 접근
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
