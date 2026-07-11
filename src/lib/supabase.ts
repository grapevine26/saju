import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저 및 클라이언트 접근용 기본 클라이언트 (RLS 적용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 백그라운드 서버 전용 어드민 클라이언트 (RLS 무시, 백엔드에서만 사용)
// SERVICE_ROLE_KEY 누락 시 anon key로 조용히 폴백하면 RLS가 걸린 채 반쯤 동작해
// 원인 파악이 매우 어려워진다. 프로덕션 서버에서는 명확히 경고를 남긴다.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  console.error('[supabase] SUPABASE_SERVICE_ROLE_KEY 미설정 — anon key로 폴백합니다. 서버 작업(잡 생성/갱신)이 RLS로 실패할 수 있습니다.');
}
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || supabaseAnonKey
);
