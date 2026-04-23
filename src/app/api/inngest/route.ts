import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processPremiumAnalysis } from "@/inngest/functions";

// Vercel Pro 등에서 함수 타임아웃을 연장하기 위한 설정
// 만약 Hobby 요금제라면 효과가 없을 수 있으나 Pro 요금제를 위해 미리 추가해 둡니다.
export const maxDuration = 300; 

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPremiumAnalysis,
  ],
});
