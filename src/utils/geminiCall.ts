import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

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
      const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
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
