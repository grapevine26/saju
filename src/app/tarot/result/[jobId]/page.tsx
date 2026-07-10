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

    return <TarotResultClient job={job} />;
}
