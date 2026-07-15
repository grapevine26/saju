/**
 * 결제 파이프라인 E2E 감사 — 배포 전 체크용
 *
 * 무료 분석 → 프리미엄 → 시그니처 → 후기→할인 결제까지 dev 우회로 전 구간을 돌리고
 * 구조·분량·시기 일관성·할인 검증을 자동 검수한다. 생성한 테스트 데이터는 끝나면 삭제.
 *
 * 실행 (dev 서버 + `npx inngest-cli dev -u http://localhost:PORT/api/inngest` 필요):
 *   node scripts/e2e-payment-audit.mjs                # 전체 (프리미엄+시그니처+타로 할인)
 *   node scripts/e2e-payment-audit.mjs --quick        # 프리미엄 + 사주 할인만
 *   BASE=http://localhost:3000 node scripts/e2e-payment-audit.mjs
 *   --keep : 테스트 데이터 삭제 생략
 *
 * 주의: 무료 분석은 IP당 5회/일 제한 — 한도 초과 시 스텁 lite 결과로 자동 폴백된다.
 */
import { readFileSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:3002';
const QUICK = process.argv.includes('--quick');
const KEEP = process.argv.includes('--keep');

// ── 가격 정책 (서버 가격표와 일치해야 함 — 어긋나면 감사가 실패해 불일치를 알려준다) ──
const PRICES = { premium: 19900, signature: 34900, tarot: 3900 };
const DISCOUNT_PERCENT = 20;
const applyDiscount = (price, pct) => Math.round(price * (100 - pct) / 100);

// ── 테스트 대상 커플 ──
const MY = {
    name: '감사용', gender: 'male', calendarType: 'solar',
    birthYear: '1992', birthMonth: '5', birthDay: '14',
    birthCity: '서울', birthHour: '11', birthMinute: '0',
    isTimeUnknown: false, birthTimezone: 'Asia/Seoul', birthLongitude: 126.978,
};
const PARTNER = {
    name: '점검용', gender: 'female', calendarType: 'solar',
    birthYear: '1995', birthMonth: '10', birthDay: '2',
    birthCity: '부산', birthHour: '15', birthMinute: '30',
    isTimeUnknown: false, birthTimezone: 'Asia/Seoul', birthLongitude: 129.075,
};
const CONTEXT = { metDate: '2023-03', breakupDate: '2026-04', breakupReason: 'E2E 감사용 테스트 데이터' };

const FORBIDDEN_TERMS = ['천간', '대운', '세운', '월운', '십성', '편관', '정관', '식신', '상관', '비견', '겁재', '편재', '정재', '편인', '정인'];
const VAGUE_TIMING = ['1개월 내', '1개월내', '한 달 내', '한달 내', '몇 주 내', '조만간'];

const oks = [], warns = [], issues = [];
const ok = (m) => oks.push(m);
const warn = (m) => warns.push('⚠️  ' + m);
const issue = (m) => issues.push('❌ ' + m);
const cleanup = { premiumJobs: [], tarotJobs: [], reviewJobs: [], codes: [] };

function checkText(label, text, { minLen } = {}) {
    if (!text || typeof text !== 'string') { issue(`${label}: 비어있음`); return; }
    if (minLen && text.length < minLen) warn(`${label}: ${text.length}자 (기대 ${minLen}자+)`);
    for (const t of FORBIDDEN_TERMS) if (text.includes(t)) warn(`${label}: 사주 용어 "${t}" 노출 의심 (문맥 확인 필요)`);
    for (const t of VAGUE_TIMING) if (text.includes(t)) issue(`${label}: 임의 시기 표현 "${t}"`);
}
const extractMonths = (t) => [...String(t).matchAll(/(\d{4}년\s*)?(\d{1,2})월/g)].map(m => Number(m[2]));

async function post(path, body) {
    const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => ({})) };
}

async function pollJob(path, jobId, doneStatus, maxSec = 240) {
    for (let i = 0; i < maxSec / 6; i++) {
        await new Promise(r => setTimeout(r, 6000));
        const res = await fetch(`${BASE}${path}?jobId=${jobId}`);
        const s = await res.json();
        if (doneStatus.includes(s.status)) return s;
        if (s.status === 'failed') return s;
    }
    return { status: 'timeout' };
}

async function confirmSaju({ pkg, amount, liteData, discountCode, label }) {
    const paymentKey = `dev_audit_${label}_${Date.now()}`;
    const rawData = {
        myRawInput: MY, partnerRawInput: PARTNER, liteResult: liteData,
        myDayGan: liteData.myManseryeok?.day?.gan, myDayZhi: liteData.myManseryeok?.day?.zhi,
        partnerDayGan: liteData.partnerManseryeok?.day?.gan, partnerDayZhi: liteData.partnerManseryeok?.day?.zhi,
        ...CONTEXT, months: 6,
    };
    const payload = { rawData, packageId: pkg, customerEmail: 'audit@example.com', phoneNumber: null, userId: null };
    if (discountCode) payload.discountCode = discountCode;
    return post('/api/tosspayments/confirm', { paymentKey, orderId: `audit_${label}_${Date.now()}`, amount, payload });
}

function auditPremiumResult(pkg, r, liteData, freeTeaserMonths) {
    const d = r.details || [];
    if (d.length < 8) issue(`[${pkg}] details ${d.length}개`); else ok(`[${pkg}] details ${d.length}개`);
    d.forEach((it, i) => checkText(`[${pkg}] details[${i}]`, it.content, { minLen: 350 }));
    const pm = r.partnerManual;
    if (!pm) issue(`[${pkg}] partnerManual 없음`);
    else for (const k of ['forbiddenWords', 'magicKeywords', 'dateSpots', 'textExamples'])
        (pm[k] || []).length >= 3 ? ok(`[${pkg}] partnerManual.${k} OK`) : warn(`[${pkg}] partnerManual.${k} ${(pm[k] || []).length}개`);

    const gw = r.goldenWindows || {};
    (gw.windows || []).length === 6 ? ok(`[${pkg}] 월별 윈도우 6개`) : warn(`[${pkg}] windows ${gw.windows?.length}개`);
    (gw.monthlyEnergies || []).length === 6 ? ok(`[${pkg}] monthlyEnergies 6개`) : warn(`[${pkg}] monthlyEnergies ${gw.monthlyEnergies?.length}개`);
    (gw.roadmapStages || []).length === 3 ? ok(`[${pkg}] 로드맵 3단계`) : warn(`[${pkg}] roadmap ${gw.roadmapStages?.length}개`);

    const g = (gw.goldenWindowMonths || [])[0];
    if (!g) issue(`[${pkg}] goldenWindowMonths 없음`);
    else {
        const dates = g.goodDates || [];
        (dates.length >= 2 && dates.length <= 3) ? ok(`[${pkg}] 길일 ${dates.length}개 (${g.month}: ${dates.join(',')})`) : warn(`[${pkg}] 길일 ${dates.length}개`);
        const calMonth = extractMonths(g.month)[0];
        calMonth === gw.bestMonth?.month ? ok(`[${pkg}] 캘린더 달 = 계산 최고점 (${calMonth}월)`) : issue(`[${pkg}] 캘린더 ${calMonth}월 ≠ 최고점 ${gw.bestMonth?.month}월`);
        if (freeTeaserMonths.length) {
            freeTeaserMonths.includes(calMonth) ? ok(`[${pkg}] 무료 티저 달 = 캘린더 달`) : issue(`[${pkg}] 티저(${freeTeaserMonths.join(',')}월) ≠ 캘린더(${calMonth}월)`);
        }
        g.dateDetails?.length ? ok(`[${pkg}] 길일 일진 근거 저장됨`) : warn(`[${pkg}] dateDetails 없음`);
    }
    if (pkg === 'signature') {
        const rc = r.compatibilityReport?.radarChart;
        rc && ['communication', 'affection', 'intimacy', 'future'].every(k => typeof rc[k] === 'number')
            ? ok(`[signature] 궁합 레이더 4축 정상`) : issue(`[signature] compatibilityReport/radarChart 이상`);
    } else if (r.compatibilityReport) warn(`[premium] compatibilityReport 포함 (signature 전용이어야 함)`);
    r.reunionScore === liteData.reunionScore ? ok(`[${pkg}] 점수 무료↔유료 일관 (${r.reunionScore})`) : warn(`[${pkg}] 점수 변화 ${liteData.reunionScore}→${r.reunionScore}`);
}

// ── 스텁 lite (무료 한도 초과 시 폴백) ──
// 감사용 커플의 생년월일이 고정이므로 일주도 불변 상수다.
// (감사용 1992-05-14 11:00 서울 = 경인 / 점검용 1995-10-02 15:30 부산 = 정묘 — calculateBazi로 산출)
function stubLite() {
    return {
        reunionScore: 60, details: [], summary: '(스텁)', secretTeaser: null,
        myManseryeok: { day: { gan: '경', zhi: '인' } },
        partnerManseryeok: { day: { gan: '정', zhi: '묘' } },
    };
}

(async () => {
    console.log(`대상: ${BASE} ${QUICK ? '(--quick)' : ''}`);

    // ══════ 1. 무료 분석 ══════
    console.log('\n[1/4] 무료 분석');
    let lite = null, teaserMonths = [];
    const free = await post('/api/reunion', { my: MY, partner: PARTNER, tier: 'lite', ...CONTEXT });
    if (free.json.success) {
        lite = free.json.data;
        checkText('무료 티저', lite.secretTeaser, { minLen: 150 });
        /\[BLUR\].*?\[\/BLUR\]/.test(lite.secretTeaser || '') ? ok('무료: 티저 BLUR 정상') : issue('무료: BLUR 태그 없음');
        lite.myManseryeok?.day?.gan ? ok('무료: 만세력 일주 정상') : issue('무료: 일주 누락');
        teaserMonths = [...new Set(extractMonths(lite.secretTeaser || ''))];
        ok(`무료: 점수 ${lite.reunionScore}점 · 티저 달 ${teaserMonths.join(',') || '-'}월`);
    } else if (free.status === 429) {
        warn('무료: 일일 한도(5회) 초과 — 스텁 lite로 폴백 (티저 일관성 검사 생략)');
        lite = stubLite();
    } else { issue(`무료 분석 실패: ${free.json.error}`); return report(); }

    // ══════ 2. 프리미엄 ══════
    console.log('[2/4] 프리미엄 결제→리포트');
    const wrongAmount = await confirmSaju({ pkg: 'premium', amount: 12345, liteData: lite, label: 'wrongamt' });
    wrongAmount.status === 400 ? ok('결제: 금액 불일치 차단 (400)') : issue(`결제: 잘못된 금액 통과됨 (${wrongAmount.status})`);

    const prem = await confirmSaju({ pkg: 'premium', amount: PRICES.premium, liteData: lite, label: 'prem' });
    if (!prem.json.success) { issue(`프리미엄 승인 실패: ${JSON.stringify(prem.json).slice(0, 120)}`); return report(); }
    cleanup.premiumJobs.push(prem.json.jobId);
    const premStatus = await pollJob('/api/job-status', prem.json.jobId, ['completed']);
    if (premStatus.status !== 'completed') { issue(`프리미엄 ${premStatus.status}`); return report(); }
    ok('프리미엄: 완료');
    auditPremiumResult('premium', premStatus.aiResult, lite, teaserMonths);

    // ══════ 3. 시그니처 ══════
    if (!QUICK) {
        console.log('[3/4] 시그니처 결제→리포트');
        const sig = await confirmSaju({ pkg: 'signature', amount: PRICES.signature, liteData: lite, label: 'sig' });
        if (sig.json.success) {
            cleanup.premiumJobs.push(sig.json.jobId);
            const sigStatus = await pollJob('/api/job-status', sig.json.jobId, ['completed']);
            sigStatus.status === 'completed' ? (ok('시그니처: 완료'), auditPremiumResult('signature', sigStatus.aiResult, lite, teaserMonths)) : issue(`시그니처 ${sigStatus.status}`);
        } else issue(`시그니처 승인 실패`);
    } else console.log('[3/4] 시그니처 — --quick 생략');

    // ══════ 4. 후기 → 할인 결제 ══════
    console.log('[4/4] 후기→할인 코드→할인 결제');
    const doneJobId = cleanup.premiumJobs[0];

    // 4-1. 가짜 잡으로 후기 → 차단돼야 함
    const fakeReview = await post('/api/reviews', { jobId: '00000000-0000-4000-8000-000000000000', service: 'saju', rating: 5 });
    fakeReview.status === 404 ? ok('후기: 존재하지 않는 잡 차단 (404)') : issue(`후기: 가짜 잡 통과 (${fakeReview.status})`);

    // 4-2. 정상 후기 → 코드 발급
    const review = await post('/api/reviews', { jobId: doneJobId, service: 'saju', rating: 5, comment: 'E2E 감사용 후기' });
    if (!review.json.success || !review.json.code) { issue(`후기 제출 실패: ${JSON.stringify(review.json).slice(0, 120)}`); return report(); }
    const code = review.json.code;
    cleanup.reviewJobs.push(doneJobId); cleanup.codes.push(code);
    review.json.percent === DISCOUNT_PERCENT ? ok(`후기: 코드 발급 (${code}, ${review.json.percent}%)`) : warn(`후기: 할인율 ${review.json.percent}%`);

    // 4-3. 중복 후기 → 멱등 (같은 코드)
    const dup = await post('/api/reviews', { jobId: doneJobId, service: 'saju', rating: 4 });
    dup.json.alreadyReviewed && dup.json.code === code ? ok('후기: 중복 제출 멱등 (같은 코드 반환)') : warn(`후기: 멱등 이상 ${JSON.stringify(dup.json).slice(0, 80)}`);

    // 4-4. validate API
    const val = await post('/api/discount/validate', { code });
    val.json.valid && val.json.percent === DISCOUNT_PERCENT ? ok('할인: validate 정상 (20%)') : issue(`할인: validate 이상 ${JSON.stringify(val.json)}`);

    // 4-5. 코드 + 정가(할인 미적용 금액) → 차단돼야 함
    const fullWithCode = await confirmSaju({ pkg: 'premium', amount: PRICES.premium, liteData: lite, discountCode: code, label: 'fullamt' });
    fullWithCode.status === 400 ? ok('할인: 코드 있는데 정가 결제 차단 (400)') : issue(`할인: 정가+코드 통과됨 (${fullWithCode.status})`);

    // 4-6. 할인가 결제 → 성공 + 코드 소진
    const discounted = applyDiscount(PRICES.premium, DISCOUNT_PERCENT);
    const discPay = await confirmSaju({ pkg: 'premium', amount: discounted, liteData: lite, discountCode: code, label: 'disc' });
    if (discPay.json.success) {
        ok(`할인: ${discounted.toLocaleString()}원 결제 승인 + 잡 생성`);
        cleanup.premiumJobs.push(discPay.json.jobId);
    } else issue(`할인 결제 실패: ${JSON.stringify(discPay.json).slice(0, 120)}`);

    // 4-7. 소진된 코드 재사용 → 차단
    const reuse = await confirmSaju({ pkg: 'premium', amount: discounted, liteData: lite, discountCode: code, label: 'reuse' });
    reuse.status === 400 ? ok('할인: 소진 코드 재사용 차단 (400)') : issue(`할인: 코드 재사용 통과됨 (${reuse.status})`);
    const val2 = await post('/api/discount/validate', { code });
    !val2.json.valid ? ok('할인: 소진 후 validate=false') : issue('할인: 소진 코드가 여전히 valid');

    // 타로 할인 경로 (start 라우트의 소진 로직)
    if (!QUICK) {
        const tarotStart = await post('/api/tarot/start', {
            input: { myName: '감사용', myGender: 'male', partnerName: '점검용', partnerGender: 'female', situation: 'crush', question: 'E2E 감사' },
            rounds: [[1, 2], [3, 4, 5], [6, 7]],
            freeResult: { round1: { theme: 't', cards: [{ cardId: 1, cardName: 'c', keyPhrase: 'k', interpretation: 'i' }], synthesis: 's' }, directAnswer: 'a' },
            paymentKey: null, customerEmail: 'audit@example.com', userId: null,
            discountCode: code, // 소진된 코드 → 400이어야 함
        });
        tarotStart.status === 400 ? ok('타로: 소진 코드 차단 (400) — start 라우트 검증 작동') : issue(`타로: 소진 코드 통과 (${tarotStart.status})`);
        if (tarotStart.json?.jobId) cleanup.tarotJobs.push(tarotStart.json.jobId);
    }

    await report();
})();

async function report() {
    console.log('\n══════════ 감사 결과 ══════════');
    console.log(`\n✅ 정상 (${oks.length})`); oks.forEach(m => console.log('  ✓ ' + m));
    console.log(`\n주의 (${warns.length})`); warns.forEach(m => console.log('  ' + m));
    console.log(`\n문제 (${issues.length})`); issues.forEach(m => console.log('  ' + m));

    if (KEEP) { console.log('\n--keep: 테스트 데이터 유지'); process.exit(issues.length ? 1 : 0); }

    // ── 클린업 (.env.local의 서비스 키 사용) ──
    try {
        const env = {};
        for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
            const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
        }
        const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
        const H = { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=representation' };
        const del = async (path) => {
            const r = await fetch(url + path, { method: 'DELETE', headers: H });
            const d = await r.json().catch(() => []);
            console.log('  cleanup', path.split('?')[0].split('/').pop(), '→', Array.isArray(d) ? d.length + '건' : r.status);
        };
        console.log('\n테스트 데이터 정리:');
        if (cleanup.codes.length) await del(`/rest/v1/discount_codes?code=in.(${cleanup.codes.join(',')})`);
        if (cleanup.reviewJobs.length) await del(`/rest/v1/reviews?job_id=in.(${cleanup.reviewJobs.join(',')})`);
        const all = [...cleanup.premiumJobs, ...cleanup.tarotJobs];
        if (cleanup.premiumJobs.length) await del(`/rest/v1/premium_analysis_jobs?id=in.(${cleanup.premiumJobs.join(',')})`);
        if (cleanup.tarotJobs.length) await del(`/rest/v1/tarot_reading_jobs?id=in.(${cleanup.tarotJobs.join(',')})`);
        if (all.length) await del(`/rest/v1/funnel_events?order_key=in.(${all.join(',')})`);
    } catch (e) { console.log('cleanup 실패:', e.message); }

    process.exit(issues.length ? 1 : 0);
}
