import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import ResultClient from "./ResultClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // 항상 최신 데이터 Fetch (캐시 방지)

export default async function ResultViewerPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    
    // Supabase에서 jobId로 작업 조회 — 개인정보(raw_data: 실명·생년월일·이별사연·이메일·전화·paymentKey)는
    // 렌더링에 불필요하므로 절대 클라이언트로 내려보내지 않는다. 필요한 컬럼만 선택.
    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id, status, ai_result")
        .eq("id", jobId)
        .single();

    if (error) {
        console.error("Result fetch error:", error);
    }

    // 운명의 합(궁합 단독) 잡은 전용 뷰로 — 완료 메일 링크 호환
    if ((job?.ai_result as any)?.packageId === 'compatibility') {
        redirect(`/hap/result/${jobId}`);
    }

    return <ResultClient job={job} />;
}
