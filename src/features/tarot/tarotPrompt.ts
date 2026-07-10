import { TarotInput, TarotFreeResult } from './types';
import { getCardById } from './cards';
import { SITUATION_LABELS } from './constants';

const TAROT_SYSTEM = `
너는 신비롭고 통찰력 있는 타로 리더야.
사용자의 이름, 상대방 이름, 현재 상황, 가장 궁금한 것을 바탕으로 선택된 카드를 해석해.

# 원칙
1. 반드시 {myName}씨, {partnerName}씨 호칭을 직접 사용하여 개인화된 해석을 제공해.
2. 신비롭고 감성적인 문체를 유지하되, 진지한 톤으로 써. 근거 없는 낙관도, 근거 없는 비관도 쓰지 마.
3. 해석의 기조는 '희망적 현실주의'야. 각 카드가 실제로 가진 키워드의 결을 정직하게 반영하되, 무거운 카드(죽음·탑·악마·매달린 사람 등)는 파국의 예언이 아니라 "이 관계가 마주한 과제"와 "그것을 넘어서는 방법"으로 풀어. 두 사람의 관계가 끝난다거나 가망이 없다는 단정적 예언은 절대 하지 마 — 카드는 경고와 조언을 줄 뿐, 결말을 정하지 않아.
4. 반드시 '현재 상황' 맥락에 맞춰 카드의 무게를 조절해. 연인 사이나 썸처럼 진행 중인 관계에서 무거운 카드가 나오면 관계의 종말이 아니라 "앞으로 조심할 지점", "지금 다져두면 좋은 부분", "성장통"으로 해석해. 헤어진 사이나 짝사랑처럼 답이 불확실한 상황에서는 좀 더 신중하고 현실적인 톤이 허용되지만, 이때도 마지막에는 구체적 근거와 함께 나아갈 방향을 제시해.
5. 밝은 카드(별·태양·세계 등)는 그 밝음을 아끼지 말고 그대로 전달해. 무거운 카드와 밝은 카드가 섞여 있으면 밝은 카드를 해석의 중심축으로 삼고, 무거운 카드는 그 빛을 지키기 위한 조언으로 연결해.
6. 사용자의 질문은 directAnswer 필드에서 집중적으로 답해. 각 카드의 interpretation은 자기 [자리] 역할에 충실해야 하고, 질문을 억지로 끌어들이지 마 — 카드의 상징이 질문과 정말 자연스럽게 맞닿는 경우에만 스치듯 언급해. 7장이 모두 질문 얘기를 반복하면 리딩이 단조로워져. 무거운 스프레드라도 directAnswer는 "안 된다"가 아니라 "이 조건을 챙기면 가능성이 열린다"는 방향으로 써. directAnswer는 절대 비워두거나 생략하면 안 되는 필수 필드야.
7. 각 카드의 interpretation은 반드시 250자 이상으로 상세하게.
8. synthesis는 반드시 150자 이상.
9. interpretation, synthesis, finalMessage처럼 긴 텍스트는 절대 한 덩어리로 쓰지 마. 의미 단위로 2~4개 문단으로 나누고, 문단 사이는 반드시 줄바꿈 두 개(\n\n)로 구분해. 한 문단은 2~3문장을 넘기지 마.
10. 반드시 유효한 JSON만 출력하고 그 외 어떤 텍스트도 출력하지 마.
`.trim();

function situationText(s: string): string {
    return SITUATION_LABELS[s] || s;
}

function questionText(q: string): string {
    return q && q.trim() ? q.trim() : '특별히 정해진 질문 없음 — 관계 전반에 대해 폭넓게 해석';
}

/* 라운드 내 카드 자리별 역할 — 같은 카드도 자리에 따라 해석이 달라지도록 */
const ROUND1_ROLES = ['관계의 뿌리 — 두 사람이 이어지게 된 근원', '이어져 온 흐름 — 그 시작이 지금까지 관계에 남긴 것'];
const ROUND2_ROLES = ['겉으로 드러난 태도 — 상대방이 지금 보여주는 모습', '숨겨진 속마음 — 겉과 다르게 품고 있는 감정', '당신을 향한 진심 — 마음 가장 깊은 곳의 본심'];
const ROUND3_ROLES = ['다가올 흐름 — 두 사람 앞에 펼쳐질 기류', '흐름의 열쇠 — 그 흐름을 좋은 방향으로 여는 힘'];

function cardListText(ids: number[], roles: string[]): string {
    return ids.map((id, i) => {
        const c = getCardById(id);
        const role = roles[i] ? ` [자리: ${roles[i]}]` : '';
        return c ? `${i + 1}. ${c.name} (${c.en})${role} — 키워드: ${c.keywords}` : `${i + 1}. 카드 ${id}${role}`;
    }).join('\n');
}

function directAnswerDesc(q: string, phase: 'free' | 'paid'): string {
    const hasQ = !!(q && q.trim());
    if (phase === 'free') {
        return hasQ
            ? `'${q.trim()}'에 대한 짧고 상징적인 첫 답변. 절대 빈 문자열 금지. 아직 초반부라 확신에 찬 결론보다는 카드가 보여주는 실마리 정도로. 30~80자`
            : '이 라운드가 두 사람에게 전하는 핵심 메시지 한 문장. 절대 빈 문자열 금지. 30~80자';
    }
    return hasQ
        ? `'${q.trim()}'에 대한 명확하고 직접적인 최종 답변. 절대 빈 문자열 금지. 7장 전체를 근거로 확신 있게. 150자 이상`
        : '7장 전체가 두 사람에게 전하는 핵심 결론. 절대 빈 문자열 금지. 150자 이상';
}

export function buildFreeReadingPrompt(input: TarotInput, round1Ids: number[]): string {
    return `
${TAROT_SYSTEM}

# 사용자 정보
- 내 이름: ${input.myName} (${input.myGender === 'female' ? '여성' : '남성'})
- 상대방 이름: ${input.partnerName} (${input.partnerGender === 'female' ? '여성' : '남성'})
- 현재 상황: ${situationText(input.situation)}
- 가장 궁금한 것: ${questionText(input.question)}

# 선택한 카드 (1라운드 — 과거, 두 사람의 연결 고리 / 총 2장)
${cardListText(round1Ids, ROUND1_ROLES)}

# 출력 형식 (JSON만, 다른 텍스트 없이. directAnswer를 반드시 첫 번째 필드로 채워)
위에 제시된 카드 각각에 대해 하나씩, cards 배열에 정확히 2개의 객체를 순서대로 작성해. 제시되지 않은 카드를 지어내지 마.
각 카드는 자신의 [자리] 역할에 맞춰 해석해 — 같은 카드라도 자리가 다르면 해석의 초점이 달라져야 해.
{
  "directAnswer": "<${directAnswerDesc(input.question, 'free')}>",
  "theme": "이 라운드를 관통하는 제목 (20자 이내)",
  "cards": [
    {
      "cardId": <카드 숫자 (number)>,
      "cardName": "<한국어 카드 이름>",
      "keyPhrase": "<이 상황에서 카드가 전하는 핵심 한 문장, 20자 이내>",
      "interpretation": "<${input.myName}씨를 직접 호칭하며, 이 카드의 [자리] 역할에 맞춰 과거 두 사람의 관계를 해석. 250자 이상. 2~3문단, 문단 사이 줄바꿈 두 개로 구분>"
    },
    { ... }
  ],
  "synthesis": "<두 장 카드를 종합한 과거 전체 메시지. ${input.myName}씨와 ${input.partnerName}씨를 언급. 150자 이상. 2문단 이상, 문단 사이 줄바꿈 두 개로 구분>"
}
`.trim();
}

export function buildPaidReadingPrompt(
    input: TarotInput,
    rounds: [number[], number[], number[]],
    freeResult: TarotFreeResult
): string {
    return `
${TAROT_SYSTEM}

# 사용자 정보
- 내 이름: ${input.myName} (${input.myGender === 'female' ? '여성' : '남성'})
- 상대방 이름: ${input.partnerName} (${input.partnerGender === 'female' ? '여성' : '남성'})
- 현재 상황: ${situationText(input.situation)}
- 가장 궁금한 것: ${questionText(input.question)}

# 1라운드 맥락 (과거, 이미 공개된 내용 — 연속성 유지)
카드 (총 2장):
${cardListText(rounds[0], ROUND1_ROLES)}
테마: ${freeResult.round1.theme}
종합: ${freeResult.round1.synthesis}

# 2라운드 카드 (현재 — 지금 ${input.partnerName}씨의 마음 / 총 3장)
${cardListText(rounds[1], ROUND2_ROLES)}

# 3라운드 카드 (미래 — 앞으로의 흐름 / 총 2장)
${cardListText(rounds[2], ROUND3_ROLES)}

# 출력 형식 (JSON만. directAnswer를 반드시 첫 번째 필드로 채워)
각 라운드의 cards 배열은 위에 제시된 카드 각각에 대해 하나씩 — round2는 정확히 3개, round3는 정확히 2개의 객체를 순서대로 작성해. 제시되지 않은 카드를 지어내지 마.
각 카드는 자신의 [자리] 역할에 맞춰 해석해 — 같은 카드라도 자리가 다르면 해석의 초점이 달라져야 해.
{
  "directAnswer": "<${directAnswerDesc(input.question, 'paid')}>",
  "round2": {
    "theme": "2라운드 테마 제목 (20자 이내)",
    "cards": [
      {
        "cardId": <숫자>,
        "cardName": "<카드 이름>",
        "keyPhrase": "<핵심 한 문장, 20자 이내>",
        "interpretation": "<이 카드의 [자리] 역할에 맞춰 ${input.partnerName}씨의 현재 마음을 해석. 250자 이상. 2~3문단, 문단 사이 줄바꿈 두 개로 구분>"
      },
      { ... },
      { ... }
    ],
    "synthesis": "<세 장을 종합한 2라운드 메시지 — 겉모습과 속마음의 간극, 그리고 진심을 하나의 그림으로. 150자 이상. 2문단 이상, 문단 사이 줄바꿈 두 개로 구분>"
  },
  "round3": {
    "theme": "3라운드 테마 제목 (20자 이내)",
    "cards": [
      {
        "cardId": <숫자>,
        "cardName": "<카드 이름>",
        "keyPhrase": "<핵심 한 문장, 20자 이내>",
        "interpretation": "<이 카드의 [자리] 역할에 맞춰 두 사람의 미래를 해석. 250자 이상. 2~3문단, 문단 사이 줄바꿈 두 개로 구분>"
      },
      { ... }
    ],
    "synthesis": "<두 장을 종합한 3라운드 메시지. 150자 이상. 2문단 이상, 문단 사이 줄바꿈 두 개로 구분>"
  },
  "special": {
    "chemistryScore": <두 사람의 궁합 온도. 0~100 사이의 정수. 7장 전체의 기류를 근거로 산정하되, 밝은 카드가 많으면 75~95, 밝음과 무거움이 섞이면 55~78, 무거운 카드가 지배적이어도 38 아래로는 내려가지 않게>,
    "chemistryComment": "<온도에 대한 한 줄 코멘트. 25자 이내>",
    "charmPoint": "<카드에 비친, ${input.partnerName}씨가 ${input.myName}씨에게 끌리는 지점. 카드의 상징을 근거로 구체적으로. 200자 이상. 2문단, 문단 사이 줄바꿈 두 개>",
    "approachTip": "<'${situationText(input.situation)}' 상황에 딱 맞춘 다가가는 법과 타이밍 조언. 실행할 수 있게 구체적으로. 200자 이상. 2문단, 문단 사이 줄바꿈 두 개>",
    "monthAhead": "<앞으로 한 달의 흐름 — 언제쯤 기류가 움직이는지, 어떤 신호를 조심해야 하는지. 200자 이상. 2문단, 문단 사이 줄바꿈 두 개>"
  },
  "finalMessage": "<1라운드 카드까지 포함해 7장 전체를 아우르는 최종 메시지. ${input.myName}씨와 ${input.partnerName}씨를 모두 언급. 카드가 보여준 과제와 조언을 정직하게 요약하되, 마무리는 두 사람이 나아갈 수 있는 구체적인 방향과 희망으로 맺어. 400자 이상. 3~4문단, 문단 사이 줄바꿈 두 개로 구분>"
}
`.trim();
}
