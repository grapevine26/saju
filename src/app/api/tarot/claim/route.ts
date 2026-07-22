import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

/**
 * 타로 리딩을 로그인 계정에 연결 (결제 후 "계정에 저장하기").
 * 세션 쿠키 기준으로만 user를 읽으므로 위조 불가. 이미 다른 계정에
 * 연결된 리딩은 뺏어올 수 없다 (user_id IS NULL 조건부 업데이트).
 */
export async function POST(req: Request) {
    try {
        const { jobId } = await req.json();
        if (!jobId || typeof jobId !== "string") {
            return NextResponse.json({ success: false, error: "jobId가 필요합니다." }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { data: job } = await supabaseAdmin
            .from("tarot_reading_jobs")
            .select("id, user_id")
            .eq("id", jobId)
            .maybeSingle();
        if (!job) {
            return NextResponse.json({ success: false, error: "리딩을 찾을 수 없습니다." }, { status: 404 });
        }
        if (job.user_id) {
            // 이미 내 계정이면 성공으로 간주 (멱등), 남의 계정이면 거절
            return NextResponse.json({ success: job.user_id === user.id, alreadyClaimed: true });
        }

        const { error } = await supabaseAdmin
            .from("tarot_reading_jobs")
            .update({ user_id: user.id })
            .eq("id", jobId)
            .is("user_id", null);
        if (error) {
            console.error("[tarot/claim] 연결 실패:", error.message);
            return NextResponse.json({ success: false, error: "저장에 실패했습니다." }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "요청 처리에 실패했습니다." }, { status: 400 });
    }
}

/** 로그인 계정에 연결된 타로 리딩 목록 (히스토리 병합용) */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: true, readings: [] });

    const { data } = await supabaseAdmin
        .from("tarot_reading_jobs")
        .select("id, raw_data, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    const readings = (data || []).map((j) => {
        const input = (j.raw_data as any)?.input || {};
        return {
            jobId: j.id,
            myName: input.myName || "",
            partnerName: input.partnerName || "",
            question: input.question || "",
            createdAt: j.created_at ? new Date(j.created_at).getTime() : null,
        };
    });
    return NextResponse.json({ success: true, readings });
}
