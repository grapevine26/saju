/**
 * 타로 유료 리딩 시작 API
 *
 * Supabase 테이블 생성 (최초 1회, Supabase SQL Editor에서 실행):
 * ─────────────────────────────────────────────────────────────
 * CREATE TABLE tarot_reading_jobs (
 *   id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id     UUID        REFERENCES auth.users(id),
 *   status      TEXT        DEFAULT 'pending',
 *   raw_data    JSONB       NOT NULL,
 *   ai_result   JSONB,
 *   payment_key TEXT,
 *   created_at  TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * ALTER TABLE tarot_reading_jobs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON tarot_reading_jobs FOR ALL USING (true);
 * ─────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { genAI, callGemini } from '@/utils/geminiCall';
import { safeSend, markDispatchFailed } from '@/lib/jobDispatch';
import { buildPaidReadingPrompt, paidReadingSchema, normalizeCardIds } from '@/features/tarot/tarotPrompt';
import { TarotInput, TarotFreeResult } from '@/features/tarot/types';
import { TAROT_PRICE } from '@/features/tarot/constants';
import { isFreePassKey, isFreePassSession } from '@/lib/freePass';
import { recordPaidEvent } from '@/lib/funnel';
import { findValidCode, consumeCode, applyDiscount } from '@/lib/discount';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { input, rounds, freeResult, paymentKey, customerEmail, userId } = body;

        if (!input || !rounds || !freeResult) {
            return NextResponse.json({ success: false, error: '필수 데이터 누락' }, { status: 400 });
        }

        const isDev = process.env.NODE_ENV === 'development';

        // 관리자 프리패스 — free_pass_ 키는 세션 이메일이 허용 목록일 때만 결제 검증 우회
        const freePass = isFreePassKey(paymentKey) && (await isFreePassSession());
        if (isFreePassKey(paymentKey) && !freePass) {
            return NextResponse.json({ success: false, error: '결제 정보를 확인할 수 없습니다.' }, { status: 403 });
        }

        // 후기 보상 할인 코드 — 서버가 직접 검증해 할인가를 기대 금액으로 삼는다
        const discountCode: string | null = typeof body.discountCode === 'string' && body.discountCode.trim()
            ? body.discountCode.trim().toUpperCase() : null;
        let expectedAmount = TAROT_PRICE;
        if (discountCode) {
            const validCode = await findValidCode(discountCode);
            if (!validCode) {
                return NextResponse.json({ success: false, error: '할인 코드가 만료되었거나 이미 사용되었습니다.' }, { status: 400 });
            }
            expectedAmount = applyDiscount(TAROT_PRICE, validCode.percent);
        }

        // 100% 쿠폰 — 서버 검증 코드 기준 기대 금액이 0원이면 수납할 돈이 없으므로 토스 검증 생략
        const zeroWonCoupon = !!discountCode && expectedAmount === 0;

        // 결제 검증 — paymentKey 없이 직접 호출해 유료 리딩을 생성하는 우회 차단
        let paidOrderId: string | null = null;
        if (!isDev && !freePass && !zeroWonCoupon) {
            if (!paymentKey || !process.env.TOSS_SECRET_KEY) {
                return NextResponse.json({ success: false, error: '결제 정보가 없습니다.' }, { status: 403 });
            }

            // 동일 paymentKey로 이미 생성된 작업이 있으면 그 작업을 반환 (중복 생성 방지)
            const { data: existing } = await supabaseAdmin
                .from('tarot_reading_jobs')
                .select('id')
                .eq('payment_key', paymentKey)
                .maybeSingle();
            if (existing) {
                return NextResponse.json({ success: true, jobId: existing.id });
            }

            const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64');
            const payRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
                headers: { Authorization: `Basic ${encoded}` },
            });
            const pay = await payRes.json();
            const isValid = payRes.ok
                && pay.status === 'DONE'
                && pay.totalAmount === expectedAmount
                && String(pay.orderId || '').startsWith('tarot_');
            if (!isValid) {
                console.error('[tarot/start] 결제 검증 실패:', pay?.code || pay?.status, pay?.totalAmount);
                return NextResponse.json({ success: false, error: '결제 정보를 확인할 수 없습니다.' }, { status: 403 });
            }
            paidOrderId = pay.orderId || null;
        }

        const rawData = { input, rounds, freeResult, paymentKey, customerEmail };

        const { data: job, error } = await supabaseAdmin
            .from('tarot_reading_jobs')
            .insert({
                user_id: userId || null,
                status: 'pending',
                raw_data: rawData,
                payment_key: paymentKey || null,
            })
            .select()
            .single();

        if (error || !job) {
            console.error('[tarot/start] DB insert 실패:', error);
            return NextResponse.json({ success: false, error: '작업 생성에 실패했습니다.' }, { status: 500 });
        }

        // 할인 코드 소진 (잡 생성 성공 후 — 실제 결제에 쓰인 코드만 소진)
        if (discountCode && !isDev && !freePass) {
            await consumeCode(discountCode, paidOrderId || `tarot_job_${job.id}`);
        }

        await recordPaidEvent({ service: 'tarot', jobId: job.id, amount: expectedAmount, utm: body.utm, visitorId: body.visitorId });

        if (isDev) {
            // 개발 모드: Inngest 없이 직접 처리
            (async () => {
                try {
                    // Inngest 경로(tarotFunction)와 동일 구성 — 스키마 강제 + 16384 + cardId 정규화
                    const model = genAI.getGenerativeModel({
                        model: 'gemini-3.5-flash',
                        generationConfig: { responseMimeType: 'application/json', responseSchema: paidReadingSchema, maxOutputTokens: 16384 },
                    });
                    const prompt = buildPaidReadingPrompt(
                        input as TarotInput,
                        rounds as [number[], number[], number[]],
                        freeResult as TarotFreeResult,
                    );
                    const aiResult = await callGemini(model, prompt);
                    if (aiResult?.round2?.cards) aiResult.round2.cards = normalizeCardIds(aiResult.round2.cards, rounds[1]);
                    if (aiResult?.round3?.cards) aiResult.round3.cards = normalizeCardIds(aiResult.round3.cards, rounds[2]);
                    await supabaseAdmin
                        .from('tarot_reading_jobs')
                        .update({ status: 'done', ai_result: aiResult })
                        .eq('id', job.id);
                } catch (e) {
                    console.error('[tarot/start] dev AI 생성 실패:', e);
                    await supabaseAdmin
                        .from('tarot_reading_jobs')
                        .update({ status: 'failed' })
                        .eq('id', job.id);
                }
            })();
        } else {
            // 발송 실패해도 잡은 살아있으므로 jobId를 반환 — 상태 폴링이 자동 재발송한다.
            const sent = await safeSend({
                name: 'tarot.reading.requested',
                data: { jobId: job.id, input, rounds, freeResult, paymentKey, customerEmail },
            });
            if (!sent) {
                await markDispatchFailed('tarot_reading_jobs', job.id, rawData);
            }
        }

        return NextResponse.json({ success: true, jobId: job.id });
    } catch (err: any) {
        console.error('[tarot/start] error:', err);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
