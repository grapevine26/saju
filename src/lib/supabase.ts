import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저 및 클라이언트 접근용 기본 클라이언트 (RLS 적용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 백그라운드 서버 전용 어드민 클라이언트 (RLS 무시, 백엔드에서만 사용)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);
