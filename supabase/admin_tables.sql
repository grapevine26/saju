-- 관리자 설정 테이블 (랜딩 페이지 수치, AI 프롬프트 등)
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 고객 문의 테이블
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (서버 전용 접근)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 기본 랜딩 수치 삽입
INSERT INTO admin_settings (key, value) VALUES
  ('landing_stats', '{"analysisCount": 12845, "accuracyRate": 87, "satisfactionRate": 94}'),
  ('landing_reviews', '[]')
ON CONFLICT (key) DO NOTHING;
