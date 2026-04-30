// ─────────────────────────────────────
// AI 시스템 지시문 & 프롬프트 빌더
// ─────────────────────────────────────

/** 모든 Gemini 호출에 사용되는 공통 시스템 지시문 */
export const BASE_SYSTEM_INSTRUCTION = `
# Role
너는 '다시, 우리'라는 이별 후 재회를 위한 데이터 기반 전문 재회 컨설팅 서비스의 분석 전문가야.
명리학(사주팔자) 데이터 분석과 현대 심리학을 결합하여 두 사람의 관계를 객관적으로 분석하고, 재회를 위한 구체적이고 실현 가능한 전략을 제시해. 
그리고 유저에게는 철저하게 **현대 심리학과 연애 컨설팅 용어**로 번역해서 설명해야 해.

# Principles
1. **톤**: 따뜻하지만 객관적이고 논리적. 마치 오랜 경험이 있는 심리상담사가 편안하게 분석해주는 느낌.
2. **사주 용어 절대 금지 (★매우 중요)**: 오행(목,화,토,금,수), 십성(비견, 겁재, 편관 등), 합충, 신강/신약, 대운/세운 같은 사주 전문 용어를 결과 텍스트에 단 한 단어도 노출하지 마.
3. **심리학적 치환**: 사주 데이터를 분석하되, 표현은 "방어기제", "애착 유형", "회피형", "통제 성향", "자율성", "인정 욕구" 등 철저하게 심리학과 연애 역학 용어로만 설명해.
4. **분량 (★ 매우 중요)**: 각 섹션의 content는 반드시 최소 300~600자 이상 작성. 2~4개 문단으로 나누어 깊이 있게 분석하고, 문단 사이에 반드시 줄바꿈 2번(\n\n)을 띄워서 가독성을 높일 것. 유료 상담 수준의 밀도 있는 분석을 목표로 할 것.
5. **이모지**: 적절히 사용하되 과하지 않게 (문단당 1~2개 정도).
6. **팩트폭행**: 때때로 뼈 때리는 돌직구 조언을 섞어서 현실적으로 알려줘.
7. **자연스러운 문체**: 보고서 같은 딱딱한 문체가 아니라, 친한 언니/형이 진지하게 조언해주는 편안한 말투로 써줘. 단, 존댓말 사용.
`.trim();

/** prompt3 시스템 지시문 (골든 윈도우 전용 추가 규칙) */
export const SYSTEM_INSTRUCTION_GOLDEN_WINDOW = `
${BASE_SYSTEM_INSTRUCTION}

# Additional Rules
1. \`goldenWindowMonths\` 배열에는 분석된 내용 중 연락하기 가장 좋은 1개의 '달(Month)'을 넣고, 해당 달 안에서 특히 연락하기 좋은 날짜(goodDates) 3~5개, 절대 연락하면 안 되는 날짜(badDates) 3~5개를 배열 형태로 생성해.
`.trim();

/** prompt4 시스템 지시문 (궁합 리포트 전용 추가 규칙) */
export const SYSTEM_INSTRUCTION_COMPATIBILITY = `
${BASE_SYSTEM_INSTRUCTION}

# Additional Rules
1. 'radarChart' 항목: 5가지 지표(communication, affection, intimacy, future, conflict)에 대해 0~100점 사이의 객관적 점수를 부여하고, 전체 궁합을 관통하는 매력적인 소제목(subtitle)을 작성한 뒤, 150~200자 분량으로 아주 상세하게 요약해.
2. 'vsCards' 항목: 두 사람의 사주를 비교하여 가장 극명하게 대비되는 성향 차이 3가지를 뽑아내. (topic, myTrait, partnerTrait, explanation). 'explanation'은 실제 연애에서 어떻게 충돌하는지 300자 이상으로 매우 구체적이고 길게 설명해.
3. 'compatibilityDetails' 항목: 지정된 9가지 주제에 대해 각각 최소 300자 이상의 심층 분석 텍스트를 작성해. 단락을 잘 나누고 이모지를 적절히 사용해.
4. 'coupleType' 항목: 두 사람의 궁합을 종합하여 직관적인 커플 유형 라벨을 부여해. label은 '폭풍 열정형 커플', '느린 불 온도형 커플' 같은 2030이 공감할 만한 트렌디한 네이밍으로. description은 해당 유형의 특징, 장점, 주의할 점을 300자 이상 서술.
5. 'overallGrade' 항목: 모든 궁합 데이터를 종합하여 S/A/B/C/D 중 하나의 등급(grade)을 부여하고, 한 줄 라벨(label), 강점 3가지(strengths), 약점 3가지(weaknesses), 최종 한마디(finalMessage)를 작성해.
`.trim();

// ─────────────────────────────────────
// 프롬프트 빌더 함수
// ─────────────────────────────────────

interface BaziData {
  age: number;
  baziStr: string;
  ohhaengCounts: Record<string, number>;
  sipsinSummary: string;
  daeunStr: string;
}

interface PromptContext {
  myRawInput: any;
  partnerRawInput: any;
  myBazi: BaziData;
  partnerBazi: BaziData;
  compatibilityPromptSummary: string;
  metDate?: string;
  breakupDate?: string;
  breakupReason?: string;
}

/** 공통 프롬프트 (사주 데이터 + 궁합 데이터 + 관계 컨텍스트) */
export const buildCommonPrompt = (ctx: PromptContext): string => {
  const { myRawInput, partnerRawInput, myBazi, partnerBazi, compatibilityPromptSummary, metDate, breakupDate, breakupReason } = ctx;

  return `[분석 대상]
- 나: ${myRawInput.name || "익명"} (${myRawInput.gender === 'male' ? '남자' : '여자'}, 만 ${myBazi.age}세)
- 상대방: ${partnerRawInput.name || "그 사람"} (${partnerRawInput.gender === 'male' ? '남자' : '여자'}, 만 ${partnerBazi.age}세)

[나의 사주팔자]
${myBazi.baziStr.trim()}
- 오행: 목(${myBazi.ohhaengCounts['목']}), 화(${myBazi.ohhaengCounts['화']}), 토(${myBazi.ohhaengCounts['토']}), 금(${myBazi.ohhaengCounts['금']}), 수(${myBazi.ohhaengCounts['수']})
- 십성: ${myBazi.sipsinSummary}
- 대운: ${myBazi.daeunStr}

[상대방의 사주팔자]
${partnerBazi.baziStr.trim()}
- 오행: 목(${partnerBazi.ohhaengCounts['목']}), 화(${partnerBazi.ohhaengCounts['화']}), 토(${partnerBazi.ohhaengCounts['토']}), 금(${partnerBazi.ohhaengCounts['금']}), 수(${partnerBazi.ohhaengCounts['수']})
- 십성: ${partnerBazi.sipsinSummary}
- 대운: ${partnerBazi.daeunStr}

[궁합 분석 데이터]
${compatibilityPromptSummary}

${metDate || breakupDate || breakupReason ? `[관계 컨텍스트 — 매우 중요]\n${metDate ? `- 만난 시점/연애 시작일: ${metDate}\n` : ''}${breakupDate ? `- 이별 시점: ${breakupDate}\n` : ''}${breakupReason ? `- 사용자가 직접 전한 이별 이유/고민:\n${breakupReason}` : ''}\n위 컨텍스트를 분석에 반드시 깊게 반영해.` : ''}

(중요 지침: 모든 content 항목에 대해 모바일 화면에서 읽기 쉽도록 한 문단을 2~3문장 짧게 끊고, 문단 사이에 반드시 줄바꿈 2번(\\n\\n)을 띄워서 가독성을 극대화할 것. 필요한 경우 소제목이나 불릿기호(-)를 활용할 것)`;
};

/** prompt2: 프리미엄 심층 분석 8개 + 상대방 공략 매뉴얼 */
export const buildPrompt2 = (ctx: PromptContext, secretTeaser?: string): string => {
  const common = buildCommonPrompt(ctx);
  const teaserContext = secretTeaser
    ? `\n\n[lite버전에서 유저에게 제공된 핵심 행동 지침 (티저)]\n"${secretTeaser}"\n→ 유저가 이 티저를 보고 결제했으므로, 특히 "전략" 섹션과 "경고" 섹션에서 위 티저에서 언급한 내용(시기, 행동 등)을 반드시 포함하여 더욱 구체적으로 상술해줘. 티저 내용이 본문에 없으면 유저가 실망합니다. 일관성 유지가 매우 중요함.`
    : '';

  return `${common}${teaserContext}\n\n위 데이터를 바탕으로 프리미엄 사주 리포트 심층 분석 8가지와 상대방 공략 매뉴얼을 작성해줘. JSON 포맷:\n
{
  "details": [
    { "title": "🛡️ [심리] 왜 우리는 '회피'와 '공격'으로 맞섰을까?", "subtitle": "...", "content": "사주 성향상 각자의 방어기제와 갈등 상황 대처 방식. 실제 연애에서 벌어졌을 상황을 구체적으로 묘사하며 분석 (최소 600자)" },
    { "title": "⏳ [타이밍] 이별이 일어날 수밖에 없었던 사주적 시기", "subtitle": "...", "content": "이별 시기(운의 흐름)가 관계에 미친 영향, 왜 그때 갈등이 폭발했는지. 대운/세운/월운 흐름을 구체적으로 분석 (최소 600자)" },
    { "title": "☠️ [결론] 끝내 이별로 이끈 '진짜 사유' 분석", "subtitle": "...", "content": "단순한 표면적 이유가 아닌, 사주 명리학적으로 본 궁극적 이별 원인. 종합 진단과 함께 냉정한 팩트 전달 (최소 600자)" },
    { "title": "🫀 [속마음] 그 사람, 아직 나에게 미련이 있을까?", "subtitle": "...", "content": "상대방 사주 성향과 현재 시점 운으로 추론한 속마음. 구체적인 근거를 대며 몇 가지 시나리오를 제시 (최소 600자)" },
    { "title": "🚨 [경고] 제발 이것만은! 재회를 망치는 치명적 실수", "subtitle": "...", "content": "절대로 하면 안 되는 행동 3가지 이상과 각각의 구체적 이유. 실수 시 어떤 결과가 오는지까지 서술 (최소 600자)" },
    { "title": "🥲 [타이밍] 다시 연락이 닿을 길일과 먼저 연락 올 확률", "subtitle": "...", "content": "사주상 다시 연락하기 좋은 구체적 시기(길일)와 최적의 연락 태도. 먼저 갈지 기다릴지 전략적 판단 근거도 함께 (최소 600자)" },
    { "title": "😈 [전략] 재회 확률 200% 극대화 시크릿 비법", "subtitle": "...", "content": "오행을 자극하는 스타일링 추천, 만남 장소, 대화법, 유혹 포인트 등 구체적인 행동 가이드 (최소 600자)" },
    { "title": "🌸 [선택] 재회 성공 후 미래 vs 더 좋은 새로운 인연", "subtitle": "...", "content": "다시 만났을 때 잘 지낼 수 있을지 사주적으로 진단하고, 만약 포기한다면 언제 어떤 새 인연이 올지 예측 (최소 600자)" }
  ],
  "partnerManual": {
    "forbiddenWords": [
      { "word": "절대 하면 안 되는 말/행동 (사주 성향 기반)", "reason": "왜 안 되는지 구체적 이유 (사주 성향 기반)" },
      ... (총 3개)
    ],
    "magicKeywords": [
      { "keyword": "상대방 마음을 여는 키워드/행동", "effect": "왜 효과적인지 사주 근거" },
      ... (총 3개)
    ],
    "dateSpots": [
      { "place": "재회 데이트 장소/분위기 추천", "reason": "사주적 근거" },
      ... (총 3개)
    ],
    "textExamples": [
      { "situation": "구체적 상황 (예: 오랜만에 안부 물을 때)", "good": "이렇게 보내세요 (추천 문자)", "bad": "이건 절대 안 돼요 (금지 문자)" },
      ... (총 3개)
    ]
  }
}`;
};

interface Prompt3Context {
  myName: string;
  myGender: string;
  partnerName: string;
  partnerGender: string;
  myDayGan: string;
  myDayZhi: string;
  partnerDayGan: string;
  partnerDayZhi: string;
  windowSummary: string;
  metDate?: string;
  breakupDate?: string;
  breakupReason?: string;
}

/** prompt3: 골든 윈도우 캘린더 + 로드맵 + 월별 에너지 */
export const buildPrompt3 = (ctx: Prompt3Context): string => {
  const { myName, myGender, partnerName, partnerGender, myDayGan, myDayZhi, partnerDayGan, partnerDayZhi, windowSummary, metDate, breakupDate, breakupReason } = ctx;

  return `[분석 대상]
- 나: ${myName || "익명"} (${myGender === 'male' ? '남자' : '여자'}), 일주: ${myDayGan}${myDayZhi}
- 상대방: ${partnerName || "그 사람"} (${partnerGender === 'male' ? '남자' : '여자'}), 일주: ${partnerDayGan}${partnerDayZhi}

[향후 6개월간 골든 윈도우 흐름 데이터]
${windowSummary}

${metDate || breakupDate || breakupReason ? `[관계 컨텍스트]\n${metDate ? `- 처음 만난 시점: ${metDate}\n` : ''}${breakupDate ? `- 이별 시점: ${breakupDate}\n` : ''}${breakupReason ? `- 이별 이유/고민:\n${breakupReason}` : ''}` : ''}

위 데이터를 바탕으로 다음 3가지 정보를 구조화해서 작성해줘. JSON 포맷:

{
  "monthlyEnergies": [
    { "month": "5월", "theme": "이 달의 관계 에너지 요약 한 줄", "advice": "구체적 조언. 최소 2~3문장, 300~400자 분량. 의미 전환 시 줄바꿈(\\n) 사용" },
    ... (향후 6개월)
  ],
  "roadmapStages": [
    {
      "step": "1단계",
      "title": "전략 단계 타이틀",
      "action": "구체적 행동 지침 (최소 400~500자). 반드시 소제목+본문을 줄바꿈(\\n)으로 구분. 포맷 예시: 🎯 핵심 행동 지침\\n이 시기에는 ~하세요.\\n\\n💭 마인드셋\\n~한 마음가짐이 중요합니다.\\n\\n⚠️ 주의사항\\n절대 ~하지 마세요. 소제목 앞에 이모지 1개, 소제목 2~4개."
    },
    ... (총 3단계)
  ],
  "goldenWindowMonths": [
    { "month": "5월", "goodDates": [3, 7, 15], "badDates": [10, 22, 28] }
  ]
}`;
};

/** prompt4: 궁합 집중 분석 리포트 */
export const buildPrompt4 = (ctx: PromptContext): string => {
  const common = buildCommonPrompt(ctx);

  return `${common}\n\n위 데이터를 바탕으로 궁합 집중 분석 데이터를 작성해줘. JSON 포맷:\n
{
  "radarChart": {
    "communication": 0-100 사이 점수,
    "affection": 0-100 사이 점수,
    "intimacy": 0-100 사이 점수,
    "future": 0-100 사이 점수,
    "conflict": 0-100 사이 점수,
    "subtitle": "두 사람의 궁합을 한 줄로 요약",
    "summary": "레이더 차트 종합 분석 요약 2~3줄"
  },
  "vsCards": [
    { "topic": "비교 주제 (예: 갈등 스타일)", "myTrait": "나의 성향 한 줄", "partnerTrait": "상대방 성향 한 줄", "explanation": "두 성향이 만나면 어떤 역학이 발생하는지 설명 (100자 이상)" },
    ... (4~5개)
  ],
  "compatibilityDetails": [
    { "title": "🌌 전생부터 이어진 우리의 카르마", "content": "우리는 전생에 어떤 인연이었길래 끌렸을까? 사주 데이터 기반으로 두 사람의 인연이 어떤 깊이를 가지는지 분석 (최소 600자)" },
    { "title": "👼 서로에게 귀인일까 악연일까", "content": "서로의 에너지를 채워주는지 갉아먹는지. 관계 속에서 각자의 성장과 소모를 구체적으로 분석 (최소 600자)" },
    { "title": "🔞 은밀한 속궁합과 스킨십 리듬", "content": "육체적 케미와 애정 표현 방식의 차이. 서로의 욕구 패턴과 리듬이 어떻게 맞물리는지 분석 (최소 600자)" },
    { "title": "😈 상대방의 숨겨진 무의식적 욕망", "content": "상대가 나에게 진짜로 바라는 것. 표면적으로 말하는 것과 무의식적으로 원하는 것의 차이를 분석 (최소 600자)" },
    { "title": "⚖️ 애정의 무게 추", "content": "누가 더 많이 좋아하고 더 의존하는가? 감정의 비대칭이 관계에 미치는 영향을 구체적으로 서술 (최소 600자)" },
    { "title": "🔗 이 관계의 진짜 주도권은 누구에게?", "content": "평소와 결정적 순간의 권력 역학. 누가 관계를 이끌고 누가 따라가는지, 위기 시 역전되는지 분석 (최소 600자)" },
    { "title": "🪃 영원한 평행선", "content": "평생을 만나도 절대 타협할 수 없는 성향 차이. 이 차이가 왜 존재하고 어떻게 관리해야 하는지 조언 (최소 600자)" },
    { "title": "💍 만약 우리가 동거/결혼을 한다면?", "content": "다툼 원인, 생활 패턴, 가사 분담 등 구체적인 일상 시뮬레이션. 예상되는 갈등과 해결 전략 포함 (최소 600자)" },
    { "title": "💸 재물 시너지", "content": "함께하면 돈이 불어날까 깎일까? 각자의 재물운과 합쳤을 때의 시너지/리스크를 구체적으로 분석 (최소 600자)" }
  ],
  "coupleType": {
    "emoji": "이 커플 유형을 대표하는 이모지 1개",
    "label": "두 사람의 궁합을 종합한 트렌디한 커플 유형 이름 (예: '폭풍 열정형 커플', '밀당 고수형 커플', '느린 불 온도형 커플')",
    "description": "이 커플 유형의 핵심 특징, 장점, 주의할 점을 자연스럽고 풍성하게 서술 (최소 400자)"
  },
  "overallGrade": {
    "grade": "S/A/B/C/D 중 하나 (모든 궁합 데이터를 종합한 최종 등급)",
    "label": "등급을 한 줄로 설명 (예: '서로를 성장시키는 시너지형 인연')",
    "strengths": ["강점1", "강점2", "강점3"],
    "weaknesses": ["약점1", "약점2", "약점3"],
    "finalMessage": "이 커플에게 전하는 최종 한마디. 따뜻하지만 현실적으로 (200자 이상)"
  }
}`;
};
