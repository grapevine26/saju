import { inngest } from "./client";
import { purgeExpiredResults, RETENTION_YEARS } from "@/lib/retentionPurge";

/**
 * 보유기간(5년) 만료 데이터 자동 파기 — 매일 새벽 4시(KST) 실행.
 * 개인정보처리방침의 "결제일로부터 최대 5년 보유 후 파기" 조항을 집행한다.
 * 서비스 초기에는 대상이 0건이지만, 방침과 실제 데이터 상태를 항상 일치시킨다.
 */
export const purgeExpiredData = inngest.createFunction(
    { id: "purge-expired-data", retries: 2, triggers: [{ cron: "TZ=Asia/Seoul 0 4 * * *" }] },
    async ({ step }: { step: any }) => {
        const result = await step.run("purge-expired-results", () => purgeExpiredResults());

        const total = result.premiumJobs + result.tarotJobs;
        if (total > 0) {
            console.log(
                `[retention] ${RETENTION_YEARS}년 경과 데이터 파기 완료 —`,
                `재회/작명 잡 ${result.premiumJobs}건, 타로 잡 ${result.tarotJobs}건,`,
                `후기 ${result.reviews}건, 할인코드 ${result.discountCodes}건, 퍼널 ${result.funnelEvents}건 (기준: ${result.cutoff})`,
            );
        }
        return result;
    },
);
