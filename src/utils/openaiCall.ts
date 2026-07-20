import { parseJsonResponse, fixLiteralNewlines } from "./geminiCall";

/**
 * GPT-5.6 Terra 호출 헬퍼 — 사주 파이프라인용.
 * 시스템 지시문·프롬프트는 기존 Gemini 경로와 동일 문자열을 그대로 사용한다.
 * (Gemini의 responseSchema 대신 json_object 모드 — 프롬프트에 JSON 포맷이 명시돼 있고,
 *  구조 검증은 호출부(inngest 등)의 개수·필수 필드 검사가 담당)
 */
export const callTerra = async (
    systemInstruction: string,
    prompt: string,
    maxTokens = 16384,
    maxRetries = 2,
): Promise<any> => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }
    let attempt = 0;
    while (true) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-5.6-terra",
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: prompt },
                    ],
                    response_format: { type: "json_object" },
                    max_completion_tokens: maxTokens,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`OpenAI 오류: ${data?.error?.message || res.status}`);
            }
            const choice = data.choices?.[0];
            // length = 출력이 토큰 한도에서 잘림 — 유료 리포트가 중간에 끊기므로 재시도 대상
            if (choice?.finish_reason === "length") {
                throw new Error(`Terra 출력이 토큰 한도에서 잘림 (${data.usage?.completion_tokens} tokens)`);
            }
            return fixLiteralNewlines(parseJsonResponse(choice?.message?.content || ""));
        } catch (e) {
            attempt++;
            if (attempt > maxRetries) {
                console.error(`Terra 호출 최종 실패 (${maxRetries + 1}회 시도):`, e);
                throw e;
            }
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
};
