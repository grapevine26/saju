import { supabaseAdmin } from "@/lib/supabase";
import HapResultClient from "./HapResultClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HapResultPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    const { data: job } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id, status, ai_result, raw_data, user_id")
        .eq("id", jobId)
        .single();

    // 이름만 추출 — 그 외 개인정보(생년월일·이메일·paymentKey·user_id)는 클라이언트로 내려보내지 않는다
    const myName = (job?.raw_data as any)?.myRawInput?.name || '나';
    const partnerName = (job?.raw_data as any)?.partnerRawInput?.name || '그 사람';

    return (
        <HapResultClient
            job={job ? { id: job.id, status: job.status, ai_result: job.ai_result } : null}
            myName={myName}
            partnerName={partnerName}
            hasOwner={!!job?.user_id}
        />
    );
}
