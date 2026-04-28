import { supabaseAdmin } from "@/lib/supabase";
import ResultClient from "./ResultClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // 항상 최신 데이터 Fetch (캐시 방지)

export default async function ResultViewerPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    
    // Supabase에서 jobId로 작업 조회
    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

    if (error) {
        console.error("Result fetch error:", error);
    }

    return <ResultClient job={job} />;
}
