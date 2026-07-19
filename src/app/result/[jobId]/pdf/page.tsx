import { supabaseAdmin } from "@/lib/supabase";
import ReportPdfDocument from "@/components/pdf/ReportPdfDocument";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PDF 변환용 문서 페이지 — /api/result/[jobId]/pdf 가 headless Chrome으로
 * 이 페이지를 열어 A4 PDF로 변환한다. 브라우저로 직접 열어도 동일한 문서가 보인다.
 */
export default async function ResultPdfPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    // 결과 페이지와 동일하게 렌더링에 필요한 컬럼만 조회 (개인정보 raw_data 제외)
    const { data: job, error } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id, status, ai_result, created_at")
        .eq("id", jobId)
        .single();

    if (error || !job || job.status !== "completed" || !job.ai_result) {
        return (
            <div style={{ padding: 40, color: "#26181E", background: "#fff", minHeight: "100vh" }}>
                <p>리포트를 찾을 수 없거나 아직 분석이 완료되지 않았습니다.</p>
            </div>
        );
    }

    return <ReportPdfDocument job={job} />;
}
