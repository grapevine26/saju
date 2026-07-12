-- ─────────────────────────────────────────────
-- 유입 퍼널 이벤트 (UTM 추적)
-- Supabase SQL Editor에서 1회 실행
-- visit: UTM 달고 들어온 방문 (세션당 1회)
-- free : 무료 분석 시작 (사주/타로/작명)
-- paid : 유료 잡 생성 (order_key = job id, 멱등)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funnel_events (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  event        TEXT        NOT NULL CHECK (event IN ('visit', 'free', 'paid')),
  service      TEXT,                -- saju | tarot | naming | hub
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  visitor_id   TEXT,                -- 익명 방문자 uuid (localStorage)
  order_key    TEXT UNIQUE,         -- paid 멱등용 (jobId), 그 외 NULL
  amount       INTEGER              -- paid일 때 정가 (원)
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_source ON funnel_events (utm_source, event);

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON funnel_events FOR ALL USING (true);
