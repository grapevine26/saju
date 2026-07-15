/**
 * 보유기간 만료 파기(retentionPurge) 검증 스크립트
 * 실행: npx tsx scripts/test-retention-purge.ts
 *
 * 6년 전 날짜의 테스트 잡(재회·타로) + 후기 + 할인코드 + 퍼널 이벤트를 심은 뒤
 * purgeExpiredResults()를 돌려 ①만료 데이터는 삭제되고 ②최근 데이터는 그대로인지 확인한다.
 */
import { readFileSync } from 'fs';

// supabase 모듈 import 전에 .env.local 주입
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const OLD_DATE = '2020-06-01T00:00:00.000Z'; // 6년 전 (보유기간 5년 초과)

async function main() {
    const { supabaseAdmin } = await import('../src/lib/supabase');
    const { purgeExpiredResults } = await import('../src/lib/retentionPurge');

    const results: string[] = [];
    const ok = (m: string) => results.push('  ✓ ' + m);
    const fail = (m: string) => results.push('  ❌ ' + m);

    // ── 1. 만료 테스트 데이터 심기 ──
    const { data: oldPremium, error: e1 } = await supabaseAdmin
        .from('premium_analysis_jobs')
        .insert({ phone_number: 'retention-test', status: 'completed', raw_data: { retentionTest: true }, created_at: OLD_DATE })
        .select('id').single();
    const { data: oldTarot, error: e2 } = await supabaseAdmin
        .from('tarot_reading_jobs')
        .insert({ status: 'done', raw_data: { retentionTest: true }, created_at: OLD_DATE })
        .select('id').single();
    if (e1 || e2 || !oldPremium || !oldTarot) {
        console.error('테스트 데이터 생성 실패:', e1?.message, e2?.message);
        process.exit(1);
    }

    const { data: review } = await supabaseAdmin
        .from('reviews')
        .insert({ job_id: oldPremium.id, service: 'saju', rating: 5, comment: 'retention 테스트 후기' })
        .select('id').single();
    if (review) {
        await supabaseAdmin.from('discount_codes')
            .insert({ code: 'RE20-RETTEST', percent: 20, review_id: review.id, expires_at: OLD_DATE });
    }
    await supabaseAdmin.from('funnel_events')
        .insert({ event: 'paid', service: 'saju', order_key: oldPremium.id });

    // ── 2. 최근 데이터 기준선 (파기 대상이 아니어야 함) ──
    const countAll = async (table: string) => {
        const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
        return count ?? 0;
    };
    const beforePremium = await countAll('premium_analysis_jobs');
    const beforeTarot = await countAll('tarot_reading_jobs');

    // ── 3. 파기 실행 ──
    const purge = await purgeExpiredResults();
    console.log('파기 결과:', JSON.stringify(purge));

    // ── 4. 검증 ──
    const { data: p } = await supabaseAdmin.from('premium_analysis_jobs').select('id').eq('id', oldPremium.id).maybeSingle();
    const { data: t } = await supabaseAdmin.from('tarot_reading_jobs').select('id').eq('id', oldTarot.id).maybeSingle();
    const { data: r } = await supabaseAdmin.from('reviews').select('id').eq('job_id', oldPremium.id).maybeSingle();
    const { data: c } = await supabaseAdmin.from('discount_codes').select('code').eq('code', 'RE20-RETTEST').maybeSingle();
    const { data: f } = await supabaseAdmin.from('funnel_events').select('id').eq('order_key', oldPremium.id);

    !p ? ok('만료된 재회 잡 삭제됨') : fail('만료 재회 잡이 남아있음');
    !t ? ok('만료된 타로 잡 삭제됨') : fail('만료 타로 잡이 남아있음');
    !r ? ok('만료 잡의 후기 삭제됨') : fail('후기가 남아있음');
    !c ? ok('후기 발급 할인코드 삭제됨') : fail('할인코드가 남아있음');
    (!f || f.length === 0) ? ok('만료 잡의 퍼널 이벤트 삭제됨') : fail('퍼널 이벤트가 남아있음');

    const afterPremium = await countAll('premium_analysis_jobs');
    const afterTarot = await countAll('tarot_reading_jobs');
    afterPremium === beforePremium - 1 ? ok(`최근 재회 잡 보존 (${afterPremium}건 유지)`) : fail(`재회 잡 수 이상: ${beforePremium - 1} 기대, ${afterPremium} 실제`);
    afterTarot === beforeTarot - 1 ? ok(`최근 타로 잡 보존 (${afterTarot}건 유지)`) : fail(`타로 잡 수 이상: ${beforeTarot - 1} 기대, ${afterTarot} 실제`);

    console.log('\n══ 검증 결과 ══');
    results.forEach((m) => console.log(m));
    const failed = results.some((m) => m.includes('❌'));
    console.log(failed ? '\n실패' : '\n전부 통과');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
