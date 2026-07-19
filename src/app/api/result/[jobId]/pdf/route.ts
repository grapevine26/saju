import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { existsSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Chromium 기동 + 렌더 + 변환에 여유 확보

/**
 * 프리미엄 리포트 PDF 다운로드.
 * /result/[jobId]/pdf 문서 페이지를 headless Chrome으로 열어 A4 PDF로 변환해 내려준다.
 * - 로컬 개발: 시스템에 설치된 Chrome/Edge 사용
 * - Vercel: @sparticuz/chromium (서버리스용 Chromium 바이너리)
 */

const LOCAL_CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
].filter(Boolean) as string[];

async function launchBrowser() {
    const puppeteer = await import("puppeteer-core");

    if (process.env.VERCEL) {
        const chromium = (await import("@sparticuz/chromium")).default;
        return puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    }

    const executablePath = LOCAL_CHROME_CANDIDATES.find(p => existsSync(p));
    if (!executablePath) {
        throw new Error("로컬 Chrome/Edge 실행 파일을 찾을 수 없습니다. CHROME_PATH 환경변수를 설정하세요.");
    }
    return puppeteer.launch({ executablePath, headless: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    // 존재/완료 여부를 먼저 확인해 불필요한 Chromium 기동을 막는다
    const { data: job } = await supabaseAdmin
        .from("premium_analysis_jobs")
        .select("id, status, created_at")
        .eq("id", jobId)
        .single();

    if (!job || job.status !== "completed") {
        return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
    }

    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        const origin = req.nextUrl.origin;
        await page.goto(`${origin}/result/${jobId}/pdf`, {
            waitUntil: "networkidle2",
            timeout: 45_000,
        });
        // 문서 마커 + 웹폰트(Pretendard·Noto Serif KR·이모지) 로딩 완료까지 대기
        await page.waitForSelector("#pdf-root", { timeout: 15_000 });
        await page.evaluateHandle("document.fonts.ready");

        const pdf = await page.pdf({
            format: "a4",
            printBackground: true,
            margin: { top: "12mm", bottom: "15mm", left: "12mm", right: "12mm" },
            displayHeaderFooter: true,
            headerTemplate: "<div></div>",
            // footerTemplate은 페이지 폰트와 분리된 컨텍스트라 한글이 깨질 수 있어 라틴 문자만 사용
            footerTemplate: `
                <div style="width:100%; font-size:7px; color:#A08D96; text-align:center; font-family:Arial, sans-serif; padding:0 12mm;">
                    MYOYEON &middot; dasisaju.com &nbsp;&mdash;&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div>`,
        });

        const created = job.created_at ? new Date(job.created_at) : new Date();
        const ymd = `${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, "0")}${String(created.getDate()).padStart(2, "0")}`;
        const filename = `다시우리_재회분석리포트_${ymd}.pdf`;

        return new NextResponse(Buffer.from(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                // 한글 파일명(RFC 5987) + ASCII 폴백
                "Content-Disposition": `attachment; filename="myoyeon-report-${ymd}.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
                // 캐시 금지 — 문서 레이아웃이 개선돼도 브라우저가 예전 PDF를 재사용하는 문제 방지
                "Cache-Control": "no-store",
            },
        });
    } catch (e) {
        console.error("PDF generation error:", e);
        // 임시 디버그: ?debug=1 이면 에러 메시지 문자열만 노출 (원인 파악 후 제거 예정)
        const detail = req.nextUrl.searchParams.get("debug") === "1"
            ? String(e instanceof Error ? e.message : e).slice(0, 500)
            : undefined;
        return NextResponse.json({ error: "PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.", ...(detail ? { detail } : {}) }, { status: 500 });
    } finally {
        await browser?.close().catch(() => {});
    }
}
