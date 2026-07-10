import { inngest } from "@/inngest/client";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateBazi } from "@/utils/baziCalc";
import { genAI, callGemini } from "@/utils/geminiCall";
import { Resend } from "resend";
import { NamingInput } from "./types";
import { resolveSurname } from "./data/surnames";
import { diagnoseOhaeng } from "./ohaengAnalysis";
import { generateNameCandidates } from "./nameGenerator";
import { appraiseName } from "./appraisal";
import { NAMING_SYSTEM_INSTRUCTION, buildPremiumPrompt, premiumSchema } from "./namingPrompt";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

// ─────────────────────────────────────────────
// 작명 프리미엄 리포트 백그라운드 생성 함수
// 1) 규칙 기반 엔진으로 이름 후보 10개 확정 (Deterministic)
// 2) Gemini가 후보별 해설 작성 (Probabilistic)
// 3) DB 저장 → 완료 메일 발송
// 실패 시: 상태 failed + 토스 자동 환불 + 안내 메일 (기존 재회 플로우와 동일 정책)
// ─────────────────────────────────────────────

export const processNamingReport = inngest.createFunction(
    {
        id: "process-naming-report",
        triggers: [{ event: "naming.premium.requested" }],
        onFailure: async ({ event, error }: { event: any, error: any }) => {
            const originalEvent = event.data.event;
            const { jobId, customerEmail, paymentKey } = originalEvent.data;

            console.error(`[작명 Inngest Failure] JobId: ${jobId}, Error:`, error);

            await supabaseAdmin
                .from("premium_analysis_jobs")
                .update({ status: "failed" })
                .eq("id", jobId);

            // 토스페이먼츠 자동 환불
            if (paymentKey && process.env.TOSS_SECRET_KEY) {
                try {
                    const encryptedSecretKey = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64");
                    const cancelRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
                        method: "POST",
                        headers: {
                            Authorization: `Basic ${encryptedSecretKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cancelReason: "작명 리포트 생성 서버 오류로 인한 자동 환불" }),
                    });
                    if (!cancelRes.ok) {
                        console.error(`[작명 자동환불 실패] JobId: ${jobId}`, await cancelRes.json());
                    } else {
                        console.log(`[작명 자동환불 성공] JobId: ${jobId}`);
                    }
                } catch (err) {
                    console.error(`[작명 자동환불 에러] JobId: ${jobId}`, err);
                }
            }

            if (customerEmail) {
                const htmlMessage = `
                  <h2>[윤명 潤名] 리포트 생성 중단 안내</h2>
                  <p>죄송합니다. 작명 리포트 생성 중 예기치 못한 서버 오류가 발생했습니다.</p>
                  <p>결제하신 금액은 전액 자동 환불 처리되었습니다. (카드사 사정에 따라 영업일 기준 3~5일 소요될 수 있습니다)</p>
                  <br/>
                  <p>잠시 후 다시 시도해 주시기 바랍니다. 불편을 드려 대단히 죄송합니다.</p>
                `;
                if (process.env.NODE_ENV === "development") {
                    console.log("[로컬 개발 모드] 작명 실패 메일 발송 생략\n", htmlMessage);
                } else {
                    try {
                        await resend.emails.send({
                            from: "윤명 潤名 <support@dasisaju.com>",
                            to: customerEmail,
                            subject: "[윤명 潤名] 리포트 오류 및 환불 안내",
                            html: htmlMessage,
                        });
                    } catch (emailErr) {
                        console.error("[작명] 실패 메일 발송 에러:", emailErr);
                    }
                }
            }
        }
    },
    async ({ event, step }: { event: any, step: any }) => {
        const { jobId, customerEmail, raw_data } = event.data;

        // 1. 상태 업데이트
        await step.run("update-status-processing", async () => {
            await supabaseAdmin
                .from("premium_analysis_jobs")
                .update({ status: "processing" })
                .eq("id", jobId);
        });

        // 2. 규칙 기반 연산 + Gemini 해설 생성
        const aiResult = await step.run("generate-naming-report", async () => {
            const input = raw_data.namingInput as NamingInput;

            // 동음이성 성씨는 유저가 선택한 한자로 확정 (미지정 시 대표 한자)
            const surname = resolveSurname(input.surname, input.surnameHanja);
            if (!surname) throw new Error(`지원하지 않는 성씨: ${input.surname}`);

            // ── 2-1. 사주 명식 + 오행 진단 + 이름 후보 (Deterministic) ──
            const bazi = calculateBazi(
                input.gender, input.calendarType,
                input.birthYear, input.birthMonth, input.birthDay,
                'seoul', input.birthHour || '', input.birthMinute || '',
                input.isTimeUnknown
            );
            const diagnosis = diagnoseOhaeng(bazi.ohhaengCounts);

            // 감명(evaluation)은 판정 카드 + 보완 후보 3선, 그 외에는 처방 이름 10선
            const isAppraise = input.serviceType === 'evaluation';
            const candidates = generateNameCandidates(surname, input.gender, diagnosis, isAppraise ? 3 : 10, input.value);
            console.log("=== [DEBUG] generateNameCandidates 결과 ===");
            console.log("보완오행:", diagnosis.complement);
            console.log("선택가치:", input.value);
            console.log("생성된 후보 10선:", candidates.map(c => c.hangul));
            console.log("=========================================");

            if (candidates.length === 0) {
                throw new Error(`이름 후보 생성 실패 (성씨: ${input.surname}, 보완오행: ${diagnosis.complement.join(',')})`);
            }

            // 감명·개명 모드: 현재 이름의 성명학적 판정 (독음 기반 추정 — appraisal.ts 한계 주석 참고)
            // 개명에도 판정을 포함해 '감명(판정+3선) ⊂ 개명(판정+10선)' 상품 구조를 만든다
            const appraisal = (isAppraise || input.serviceType === 'rename') && input.currentName
                ? appraiseName(surname, input.currentName, input.gender, diagnosis)
                : null;

            // ── 2-2. Gemini 해설 생성 (Probabilistic) ──
            const model = genAI.getGenerativeModel({
                model: "gemini-3.5-flash",
                systemInstruction: NAMING_SYSTEM_INSTRUCTION,
                generationConfig: { responseMimeType: "application/json", responseSchema: premiumSchema }
            });

            const aiReport = await callGemini(model, buildPremiumPrompt({
                input, surname, baziStr: bazi.baziStr, diagnosis, candidates
            }));

            // ── 2-3. 규칙 데이터 + AI 해설 병합 ──
            return {
                service: 'naming',
                input: {
                    serviceType: input.serviceType,
                    surname: input.surname,
                    gender: input.gender,
                    value: input.value,
                    currentName: input.currentName || null,
                    // 명명증서 헤더(증서번호) 표시용 생년월일
                    birthYear: input.birthYear,
                    birthMonth: input.birthMonth,
                    birthDay: input.birthDay,
                },
                surname: { hangul: surname.hangul, hanja: surname.hanja, strokes: surname.strokes, element: surname.element },
                baziStr: bazi.baziStr,
                // 리포트 사주 4주 표 렌더링용
                manseryeok: bazi.manseryeok,
                diagnosis,
                candidates,
                appraisal,
                aiReport,
            };
        });

        // 3. 결과 저장
        await step.run("save-result-to-supabase", async () => {
            const { error } = await supabaseAdmin
                .from("premium_analysis_jobs")
                .update({ status: "completed", ai_result: aiResult })
                .eq("id", jobId);

            if (error) {
                console.error("[작명] Supabase 결과 저장 실패:", error);
                throw new Error(error.message);
            }
        });

        // 4. 완료 메일
        await step.run("send-completion-email", async () => {
            if (!customerEmail) {
                console.log("[작명] 이메일 없음. 발송 생략.");
                return { success: true, message: "No email, skipped." };
            }

            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
                || "http://localhost:3000";
            const resultUrl = `${baseUrl}/yunmyeong/result/${jobId}`;

            const htmlMessage = `
              <h2>[윤명 潤名] 프리미엄 작명 리포트 완성 안내</h2>
              <p>사주 명식의 오행 균형을 완벽히 보완하는 이름 후보와 상세 해설이 준비되었습니다.</p>
              <p>수리 사격(원격·형격·이격·정격) 분석과 대법원 인명용 한자 매칭 결과를 지금 확인해 보세요.</p>
              <br/>
              <a href="${resultUrl}" style="display:inline-block; padding:12px 24px; background-color:#c9a96e; color:#1a1408; text-decoration:none; border-radius:8px; font-weight:bold;">👉 작명 리포트 열람하기</a>
              <br/><br/>
              <p style="font-size:12px; color:#6b7280;">본 링크는 개인 정보 보호를 위해 본인만 열람 가능합니다. 리포트는 화면 하단의 [PDF 저장] 버튼으로 평생 소장하실 수 있습니다.</p>
            `;

            if (process.env.NODE_ENV === "development") {
                console.log("=========================================");
                console.log("[로컬 개발 모드] 작명 완료 메일은 발송되지 않습니다.");
                console.log("받는 사람:", customerEmail);
                console.log("결과 링크:", resultUrl);
                console.log("=========================================");
                return { success: true, jobId };
            }

            try {
                await resend.emails.send({
                    from: "윤명 潤名 <support@dasisaju.com>",
                    to: customerEmail,
                    subject: "🪶 [윤명 潤名] 프리미엄 작명 리포트가 완성되었습니다!",
                    html: htmlMessage,
                });
                console.log(`[작명] 완료 메일 발송 성공: ${customerEmail}`);
            } catch (error: any) {
                console.error("[작명] Resend 메일 발송 에러:", error);
            }
        });

        return { success: true, jobId };
    }
);
