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
            return await callGemini(model, prompt);
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

            const htmlMessage = `
                <h2>[ODD TAROT] 타로 리딩 완료 안내</h2>
                <p>${input.myName}님, 일곱 장의 카드 전체 해석이 완성되었습니다.</p>
                <p>${input.partnerName}씨의 현재 마음과 두 사람의 앞날, 그리고 카드가 전하는 최종 메시지를 지금 확인해 보세요.</p>
                <br/>
                <a href="${resultUrl}" style="display:inline-block; padding:12px 24px; background-color:#6B3FA8; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">🔮 전체 해석 확인하기</a>
                <br/><br/>
                <p style="font-size:12px; color:#6b7280;">본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다.</p>
            `;

            if (process.env.NODE_ENV === 'development') {
                console.log('[로컬 개발 모드] 타로 완료 메일 발송 생략:', customerEmail);
                return { success: true, jobId };
            }

            try {
                await resend.emails.send({
                    from: '다시,우리 <support@dasisaju.com>',
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
