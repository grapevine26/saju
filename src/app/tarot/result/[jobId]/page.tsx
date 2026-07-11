import { supabaseAdmin } from "@/lib/supabase";
import TarotResultClient from "./ResultClient";

export const dynamic = 'force-dynamic';

export default async function TarotResultJobPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    const { data: job } = await supabaseAdmin
        .from('tarot_reading_jobs')
        .select('id, status, raw_data, ai_result, created_at')
        .eq('id', jobId)
        .single();

    // 렌더링에 불필요한 민감정보(paymentKey, customerEmail)는 클라이언트로 내려보내지 않는다.
    let safeJob = job;
    if (job?.raw_data) {
        const { paymentKey, customerEmail, ...safeRaw } = job.raw_data as Record<string, unknown>;
        safeJob = { ...job, raw_data: safeRaw };
    }

    return <TarotResultClient job={safeJob as any} />;
}
