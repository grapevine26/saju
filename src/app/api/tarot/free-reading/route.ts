import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { genAI, callGemini } from '@/utils/geminiCall';
import { buildFreeReadingPrompt } from '@/features/tarot/tarotPrompt';
import { TarotInput } from '@/features/tarot/types';
import { supabaseAdmin } from '@/lib/supabase';

const DAILY_LIMIT = 3;
const ANON_COOKIE = 'tarot_anon_id';

export async function POST(req: Request) {
    try {
        const { input, round1CardIds }: { input: TarotInput; round1CardIds: number[] } = await req.json();

        if (!input?.myName || !input?.partnerName || !Array.isArray(round1CardIds) || round1CardIds.length !== 2) {
            return NextResponse.json({ success: false, error: '입력 데이터가 올바르지 않습니다.' }, { status: 400 });
        }

        const isDev = process.env.NODE_ENV === 'development';

        // 쿠키 기반 익명 ID
        const cookieStore = await cookies();
        let anonId = cookieStore.get(ANON_COOKIE)?.value;
        const isNewAnon = !anonId;
        if (!anonId) anonId = randomUUID();

        const today = new Date().toISOString().split('T')[0];
        let currentCount = 0;

        if (!isDev) {
            // 오늘 사용량 조회
            const { data: usage } = await supabaseAdmin
                .from('anon_tarot_usage')
                .select('count')
                .eq('anon_id', anonId)
                .eq('date', today)
                .maybeSingle();

            currentCount = usage?.count ?? 0;

            if (currentCount >= DAILY_LIMIT) {
                return NextResponse.json(
                    { success: false, error: 'DAILY_LIMIT_EXCEEDED' },
                    { status: 429 }
                );
            }
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-3.1-flash-lite',
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 3072 },
        });

        const prompt = buildFreeReadingPrompt(input, round1CardIds);
        const aiResult = await callGemini(model, prompt);
        const { directAnswer, ...round1 } = aiResult || {};

        // 응답 스키마 최소 검증 — 카드 해석이 비었으면 실패로 간주(횟수 차감 없이 재시도 유도)
        if (!round1 || !Array.isArray((round1 as any).cards) || (round1 as any).cards.length === 0) {
            console.error('[tarot/free-reading] AI 응답 스키마 불량:', JSON.stringify(aiResult)?.slice(0, 300));
            return NextResponse.json({ success: false, error: '카드 해석 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
        }

        // 성공했을 때만 사용량 증가 (AI 실패 시 무료 횟수를 소진시키지 않음)
        if (!isDev) {
            await supabaseAdmin
                .from('anon_tarot_usage')
                .upsert(
                    { anon_id: anonId, date: today, count: currentCount + 1 },
                    { onConflict: 'anon_id,date' }
                );
        }

        const response = NextResponse.json({ success: true, result: { round1, directAnswer } });

        if (isNewAnon) {
            response.cookies.set(ANON_COOKIE, anonId, {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
                path: '/',
            });
        }

        return response;
    } catch (err: any) {
        console.error('[tarot/free-reading] error:', err);
        return NextResponse.json({ success: false, error: '카드 해석 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
