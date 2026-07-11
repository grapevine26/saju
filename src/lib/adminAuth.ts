import { supabaseAdmin } from "@/lib/supabase";

/**
 * 관리자 인증 — 유효한 Supabase 세션 + 관리자 allowlist(ADMIN_EMAILS) 이중 확인.
 *
 * ⚠️ 예전 구현은 "유효한 로그인 사용자면 통과"였다. 이 앱은 일반 사용자도 카카오/구글로
 *    Supabase 세션을 얻으므로, 그대로 두면 아무 로그인 사용자나 관리자 API(전 고객 개인정보·
 *    문의·통계·설정)에 접근할 수 있었다. 반드시 이메일 allowlist로 관리자를 한정한다.
 *
 * 설정: Vercel 환경변수 ADMIN_EMAILS 에 관리자 이메일을 콤마로 구분해 넣는다.
 *       (예: ADMIN_EMAILS="owner@example.com,ops@example.com")
 *       미설정 시 fail-closed — 아무도 관리자 API를 사용할 수 없다.
 */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const allowlist = getAdminEmails();
  if (allowlist.length === 0) {
    console.error("[adminAuth] ADMIN_EMAILS 미설정 — 관리자 접근을 모두 차단합니다.");
    return false;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error("Admin Auth Error:", error?.message);
      return false;
    }
    const email = user.email?.toLowerCase();
    if (!email || !allowlist.includes(email)) {
      console.error("[adminAuth] 관리자 allowlist 불일치:", email);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return false;
  }
}
