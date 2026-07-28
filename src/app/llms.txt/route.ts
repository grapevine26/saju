import { COLUMNS } from '@/features/guide/columns';
import { TAROT_COLUMNS } from '@/features/guide/tarotColumns';
import { TAROT_PRICE } from '@/features/tarot/constants';
import { REUNION_PREMIUM_PRICE, REUNION_SIGNATURE_PRICE, COMPATIBILITY_PRICE } from '@/lib/adminOrders';
import { getCanonicalPairs, getAllGenderedPairs } from '@/utils/ddiGunghap';
import { ZHI } from '@/utils/sajuMapper';

/**
 * /llms.txt — AI 시스템(ChatGPT·Claude·Perplexity 등)이 사이트를 빠르게 파악하도록 돕는 컨텍스트 파일.
 * 규격: https://llmstxt.org
 *
 * 정적 파일 대신 라우트로 만든 이유: 칼럼이 추가될 때마다 목록이 자동으로 따라오게 하려고.
 * 손으로 관리하면 반드시 드리프트가 생긴다.
 *
 * 참고: 구글은 AI Overviews에 이런 파일이 필요 없다고 명시했다. 이건 구글 외 엔진용이다.
 */
export const dynamic = 'force-static';

export function GET() {
    const line = (c: { heading: string; excerpt: string }, base: string, slug: string) =>
        `- [${c.heading}](https://dasisaju.com${base}/${slug}): ${c.excerpt}`;
    const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

    // 가격·페이지 수는 실제 상수와 계산 결과에서 가져온다.
    // 글로 적어두면 값이 바뀔 때 여기만 옛 정보가 남아 AI에 틀린 가격을 알려주게 된다.
    const ddiCount = ZHI.length;
    const pairCount = getCanonicalPairs().length;
    const genderedCount = getAllGenderedPairs().length;

    const body = `# 묘연 (Myoyeon)

> 헤어진 사람과의 재회 가능성과 연락하기 좋은 시기를 사주로 진단하고, 연애 타로로 상대의 속마음을 읽어주는 한국어 모바일 웹 서비스입니다. 가입 없이 이용하며, 결과는 본인만 볼 수 있습니다.

운영: 인사이트랩 · https://dasisaju.com

## 이 서비스가 하는 일

- **재회 사주 (다시, 우리)**: 두 사람의 생년월일로 만세력을 계산해 재회 가능성 점수(0~100)와 "골든 윈도우"(앞으로 6개월 중 마음이 가장 잘 맞물리는 달, 그 안의 길일 2~3일)를 산출합니다.
- **연애 타로 (ODD TAROT)**: 7장 카드로 상대의 지금 마음과 두 사람의 앞날을 읽습니다. 첫 라운드 2장은 무료입니다.
- **궁합 (운명의 합)**: 두 사람의 사주로 6개 항목 궁합 점수와 등급을 계산합니다.

계산은 결정론적입니다. 같은 생년월일을 넣으면 언제 보아도 같은 결과가 나옵니다. 합·충·형·해와 오행 균형을 코드로 계산하며, 생성 텍스트로 점수를 지어내지 않습니다.

## 가격

- 재회 사주 프리미엄: ${won(REUNION_PREMIUM_PRICE)} (무료 분석으로 점수·핵심 카드 2장 먼저 확인 가능)
- 재회 사주 시그니처: ${won(REUNION_SIGNATURE_PRICE)} (프리미엄 + 궁합 심층 리포트)
- 연애 타로 전체 해석: ${won(TAROT_PRICE)} (1라운드 2장 무료)
- 궁합 리포트: ${won(COMPATIBILITY_PRICE)} (무료 미리보기로 6항목 점수·등급 확인 가능)

가입 불필요, 이메일만 입력, 결제는 토스페이먼츠. 상대방에게는 어떤 알림도 가지 않습니다.

## 다루지 않는 것

- 미래를 보장하거나 확정하지 않습니다. 결과는 참고 자료이며 "반드시 재회" 같은 약속을 하지 않습니다.
- 심리적 위기 상태의 상담은 제공하지 않습니다. 전문 상담이 필요한 경우 해당 기관을 권합니다.
- 타로 카드 개별 의미 사전은 제공하지 않습니다.

## 재회 가이드 (이별 후)

${COLUMNS.map((c) => line(c, '/saju/guide', c.slug)).join('\n')}

## 타로 가이드 (소개팅·썸·짝사랑·연인)

${TAROT_COLUMNS.map((c) => line(c, '/tarot/guide', c.slug)).join('\n')}

## 띠 궁합

- [${ddiCount}띠 궁합 전체보기](https://dasisaju.com/hap/gunghap): ${ddiCount}띠 조합 ${pairCount}가지의 약식 궁합. 태어난 해(년지)만으로 계산하며, 정확한 궁합은 생년월일 전체가 필요하다는 점을 각 페이지에 명시하고 있습니다.
- 띠별 페이지 ${ddiCount}개(/hap/ddi/[띠]), 조합별 ${pairCount}개(/hap/gunghap/[띠-띠]), 남녀 배치별 ${genderedCount}개(/hap/namnyeo/[띠남자-띠여자])로 구성됩니다.

## 주요 페이지

- [재회 사주](https://dasisaju.com/saju)
- [연애 타로](https://dasisaju.com/tarot)
- [궁합](https://dasisaju.com/hap)
- [재회 가이드 목록](https://dasisaju.com/saju/guide)
- [타로 가이드 목록](https://dasisaju.com/tarot/guide)
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
}
