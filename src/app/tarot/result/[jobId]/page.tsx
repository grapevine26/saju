import { supabaseAdmin } from "@/lib/supabase";
import TarotResultClient from "./ResultClient";

export const dynamic = 'force-dynamic';

export default async function TarotResultJobPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    const { data: job } = await supabaseAdmin
        .from('tarot_reading_jobs')
        .select('id, status, raw_data, ai_result, created_at, user_id')
        .eq('id', jobId)
        .single();

    // 렌더링에 불필요한 민감정보(paymentKey, customerEmail, user_id)는 클라이언트로 내려보내지 않는다.
    let safeJob: any = job;
    if (job) {
        const { user_id, ...rest } = job as Record<string, unknown>;
        safeJob = rest;
        if (job.raw_data) {
            const { paymentKey, customerEmail, ...safeRaw } = job.raw_data as Record<string, unknown>;
            safeJob = { ...safeJob, raw_data: safeRaw };
        }
    }

    return <TarotResultClient job={safeJob as any} hasOwner={!!job?.user_id} />;
}
