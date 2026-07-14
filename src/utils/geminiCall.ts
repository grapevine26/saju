import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

/**
 * JSON 문자열 리터럴 내부에 모델이 실수로 넣은 raw 개행/탭 등 제어문자를
 * 올바른 이스케이프 시퀀스(\n, \r, \t)로 치환. 문자열 바깥의 포맷팅용
 * 공백/개행은 건드리지 않는다.
 */
const escapeControlCharsInStrings = (text: string): string => {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (inString) {
      if (escaped) {
        result += ch;
        escaped = false;
      } else if (ch === "\\") {
        result += ch;
        escaped = true;
      } else if (ch === '"') {
        result += ch;
        inString = false;
      } else if (ch === "\n") {
        result += "\\n";
      } else if (ch === "\r") {
        result += "\\r";
      } else if (ch === "\t") {
        result += "\\t";
      } else {
        result += ch;
      }
    } else {
      if (ch === '"') inString = true;
      result += ch;
    }
  }

  return result;
};

/**
 * 모델이 JSON 앞뒤에 덧붙이는 코드펜스/잡텍스트를 제거하고 첫 '{' ~ 마지막 '}' 구간만 파싱
 */
export const parseJsonResponse = (raw: string): any => {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("응답에서 JSON 객체를 찾을 수 없습니다.");
  }
  const jsonSlice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    // raw 개행 등으로 파싱 실패 시 문자열 내부만 이스케이프해서 재시도
    return JSON.parse(escapeControlCharsInStrings(jsonSlice));
  }
};

/**
 * 재시도 포함 Gemini AI 호출 헬퍼
 * @param model - Gemini 모델 인스턴스
 * @param prompt - 프롬프트 문자열
 * @param maxRetries - 최대 재시도 횟수 (기본 2)
 * @returns 파싱된 JSON 응답
 */
export const callGemini = async (
  model: GenerativeModel,
  prompt: string,
  maxRetries = 2
): Promise<any> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const finishReason = res.response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[Gemini] 비정상 종료 사유: ${finishReason} (응답 길이 ${text.length}자)`);
        // MAX_TOKENS = 출력이 중간에 잘린 상태 — JSON이 파싱돼도 유료 리포트 섹션이
        // 문장 중간에 끊겨 있으므로 정상 응답으로 통과시키면 안 된다. 재시도 유도.
        if (finishReason === "MAX_TOKENS") {
          throw new Error(`Gemini 출력이 토큰 한도에서 잘림 (${text.length}자)`);
        }
      }
      return parseJsonResponse(text);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) {
        console.error(`Gemini 호출 최종 실패 (${maxRetries + 1}회 시도):`, e);
        throw e;
      }
      // 점진적 대기 (1초, 2초, ...)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
