import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processPremiumAnalysis } from "@/inngest/functions";
import { processNamingReport } from "@/features/naming/inngestFunction";
import { processTarotReading } from "@/inngest/tarotFunction";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPremiumAnalysis,
    processNamingReport,
    processTarotReading,
  ],
});
