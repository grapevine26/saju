// ─────────────────────────────────────────────
// DM 웰컴 쿠폰 발급 스크립트
// 인스타 댓글 리드에게 DM으로 보낼 1회용 할인 코드를 미리 뽑아둔다.
// 후기 쿠폰(20%)과 같은 discount_codes 테이블을 쓰므로
// 결제 검증·소진 로직이 그대로 적용된다 (review_id만 NULL).
//
// 사용:
//   1회용 여러 개: node --env-file=.env.local scripts/mint-dm-codes.js [개수=20] [할인율=10] [유효일=30]
//   공유 코드 1개: node --env-file=.env.local scripts/mint-dm-codes.js --shared <코드명> [할인율=10] [유효일=30] [최대횟수=200]
//     예: node --env-file=.env.local scripts/mint-dm-codes.js --shared 묘연10 10 30 200
// ─────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');

const shared = process.argv[2] === '--shared';
const count = shared ? 1 : (Number(process.argv[2]) || 20);
const sharedName = shared ? String(process.argv[3] || '').trim() : null;
const percent = Number(process.argv[shared ? 4 : 3]) || 10;
const days = Number(process.argv[shared ? 5 : 4]) || 30;
const maxUses = shared ? (Number(process.argv[6]) || 200) : null;

if (shared && !sharedName) { console.error('공유 코드명을 입력하세요: --shared 묘연10'); process.exit(1); }

if (percent < 1 || percent > 90) { console.error('할인율은 1~90 사이'); process.exit(1); }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// lib/discount.ts의 generateCode와 동일한 규칙 (혼동 문자 제외), 프리픽스만 할인율 반영
function generateCode() {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  let body = '';
  for (let i = 0; i < 6; i++) body += chars[bytes[i] % chars.length];
  return `RE${percent}-${body}`;
}

(async () => {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const expiry = expiresAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  if (shared) {
    // 공유 코드 — 대소문자 정규화(결제 검증이 대문자로 비교)
    const code = sharedName.toUpperCase();
    const { error } = await sb.from('discount_codes').insert({
      code, percent, expires_at: expiresAt.toISOString(), max_uses: maxUses,
    });
    if (error) { console.error('발급 실패:', error.message); process.exit(1); }
    console.log(`# 공유 쿠폰 발급 · ${percent}% · ${expiry}까지 · 최대 ${maxUses}회\n`);
    console.log(code);
    console.log(`\n사용 현황: SELECT code, use_count, max_uses FROM discount_codes WHERE code = '${code}';`);
    return;
  }

  const codes = [];
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode();
      const { error } = await sb.from('discount_codes').insert({
        code, percent, expires_at: expiresAt.toISOString(),
      });
      if (!error) { codes.push(code); break; }
      if (attempt === 2) console.error('발급 실패(3회 충돌):', error.message);
    }
  }
  console.log(`# DM 웰컴 쿠폰 ${codes.length}개 · ${percent}% · ${expiry}까지\n`);
  codes.forEach(c => console.log(c));
  console.log(`\n남은 미사용 코드 확인: SELECT code FROM discount_codes WHERE used_at IS NULL AND review_id IS NULL;`);
})();
