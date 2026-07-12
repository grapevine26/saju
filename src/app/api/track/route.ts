import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────
// 퍼널 이벤트 기록 API (visit / free)
// paid 이벤트는 결제 승인 라우트가 서버에서 직접 기록한다 (여기서 받지 않음).
// 추적용 엔드포인트이므로 실패해도 200을 돌려 클라이언트 흐름에 영향을 주지 않는다.
// ─────────────────────────────────────────────

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set(['visit', 'free']);
const ALLOWED_SERVICES = new Set(['saju', 'tarot', 'naming', 'hub']);

const clip = (v: unknown, max: number) =>
    typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const event = String(body.event || '');
        const service = String(body.service || '');

        if (!ALLOWED_EVENTS.has(event) || !ALLOWED_SERVICES.has(service)) {
            return NextResponse.json({ ok: false });
        }

        await supabaseAdmin.from('funnel_events').insert({
            event,
            service,
            utm_source: clip(body.utm?.source, 80),
            utm_medium: clip(body.utm?.medium, 80),
            utm_campaign: clip(body.utm?.campaign, 120),
            visitor_id: clip(body.visitorId, 64),
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
