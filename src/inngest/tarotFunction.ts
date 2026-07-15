import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase';
import { genAI, callGemini } from '@/utils/geminiCall';
import { buildPaidReadingPrompt } from '@/features/tarot/tarotPrompt';
import { TarotInput, TarotFreeResult } from '@/features/tarot/types';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

export const processTarotReading = inngest.createFunction(
    {
        id: 'process-tarot-reading',
        triggers: [{ event: 'tarot.reading.requested' }],
        onFailure: async ({ event, error }) => {
            const { jobId, paymentKey } = event.data.event.data;
            console.error(`[Tarot Inngest Failure] jobId: ${jobId}`, error);

            await supabaseAdmin
                .from('tarot_reading_jobs')
                .update({ status: 'failed' })
                .eq('id', jobId);

            if (paymentKey && process.env.TOSS_SECRET_KEY) {
                try {
                    const secretKey = process.env.TOSS_SECRET_KEY;
                    const encoded = Buffer.from(`${secretKey}:`).toString('base64');
                    await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Basic ${encoded}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ cancelReason: 'AI 타로 리딩 서버 오류로 인한 자동 환불' }),
                    });
                } catch (refundErr) {
                    console.error('[Tarot] 자동 환불 실패:', refundErr);
                }
            }
        },
    },
    async ({ event, step }) => {
        const { jobId, input, rounds, freeResult, customerEmail } = event.data as {
            jobId: string;
            input: TarotInput;
            rounds: [number[], number[], number[]];
            freeResult: TarotFreeResult;
            customerEmail?: string;
        };

        await step.run('update-status-processing', async () => {
            await supabaseAdmin
                .from('tarot_reading_jobs')
                .update({ status: 'processing' })
                .eq('id', jobId);
        });

        const aiResult = await step.run('generate-paid-reading', async () => {
            const model = genAI.getGenerativeModel({
                model: 'gemini-3.5-flash',
                generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
            });

            const prompt = buildPaidReadingPrompt(input, rounds, freeResult);
            const result = await callGemini(model, prompt);

            // 핵심 콘텐츠(round2/round3) 검증 — 비면 throw하여 재시도, 최종 실패 시 onFailure가 자동 환불.
            // (불량 결과를 done으로 저장해 유료 고객에게 빈 화면을 보여주는 것을 방지)
            const r2 = result?.round2?.cards;
            const r3 = result?.round3?.cards;
            if (!Array.isArray(r2) || r2.length === 0 || !Array.isArray(r3) || r3.length === 0) {
                throw new Error('타로 유료 해석 생성 실패(round2/round3 누락) — 자동 환불 대상');
            }
            return result;
        });

        await step.run('save-result', async () => {
            await supabaseAdmin
                .from('tarot_reading_jobs')
                .update({ status: 'done', ai_result: aiResult })
                .eq('id', jobId);
        });

        await step.run('send-completion-email', async () => {
            if (!customerEmail) {
                console.log('[Tarot] 이메일이 없습니다. 발송 생략.');
                return { success: true, message: 'No email, skipped.' };
            }

            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
                || 'http://localhost:3000';
            const resultUrl = `${baseUrl}/tarot/result/${jobId}`;

            // 헤어진 사이 리딩이면 재회사주 브릿지 P.S. 첨부 (타로=지금 마음 → 사주=재회 타이밍)
            const sajuPs = input.situation === 'breakup' ? `
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0 16px;"/>
                <p style="font-size:13px; color:#4b5563; line-height:1.7;">
                    <strong>P.S.</strong> 카드가 보여준 건 ${input.partnerName}씨의 '지금'입니다.<br/>
                    다시 만날 '때'가 궁금하다면 — 두 사람의 사주로 재회 가능성과 연락 최적기(골든 윈도우)를 확인해 보세요.
                </p>
                <a href="${baseUrl}/saju" style="font-size:13px; color:#D8485E; font-weight:bold;">→ 재회 가능성과 타이밍 확인하기 (무료 분석부터)</a>
            ` : '';

            const htmlMessage = `
                <h2>[ODD TAROT] 타로 리딩 완료 안내</h2>
                <p>${input.myName}님, 일곱 장의 카드 전체 해석이 완성되었습니다.</p>
                <p>${input.partnerName}씨의 현재 마음과 두 사람의 앞날, 그리고 카드가 전하는 최종 메시지를 지금 확인해 보세요.</p>
                <br/>
                <a href="${resultUrl}" style="display:inline-block; padding:12px 24px; background-color:#6B3FA8; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">🔮 전체 해석 확인하기</a>
                <br/><br/>
                <p style="font-size:12px; color:#6b7280;">본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다.</p>
                <p style="font-size:13px; color:#4b5563; line-height:1.7; margin-top:16px;">
                    리딩이 도움이 되셨다면, 결과 페이지 맨 아래에서 별점 하나만 남겨주세요.<br/>
                    감사의 마음으로 <strong>다음 이용 시 쓸 수 있는 20% 할인 코드</strong>를 바로 드립니다 🙏
                </p>
                ${sajuPs}
            `;

            if (process.env.NODE_ENV === 'development') {
                console.log('[로컬 개발 모드] 타로 완료 메일 발송 생략:', customerEmail);
                return { success: true, jobId };
            }

            try {
                await resend.emails.send({
                    from: 'ODD TAROT <support@dasisaju.com>',
                    to: customerEmail,
                    subject: '🔮 타로 카드 전체 해석이 도착했습니다!',
                    html: htmlMessage,
                });
                console.log(`[Tarot] 이메일 발송 성공: ${customerEmail}`);
            } catch (error: any) {
                console.error('[Tarot] Resend 이메일 발송 에러:', error);
            }
        });

        return { jobId, status: 'done' };
    }
);
