import { NameCandidate, NamingInput, OhaengDiagnosis } from './types';
import { OHAENG_MEANING } from './ohaengAnalysis';
import { SurnameEntry } from './types';

// ─────────────────────────────────────────────
// 작명 서비스 전용 Gemini 프롬프트 & 응답 스키마
// 수리·오행 연산은 100% 코드로 끝난 상태이며,
// AI는 '해설(스토리텔링)'만 담당한다. 숫자를 새로 만들지 않게 강하게 제약한다.
// ─────────────────────────────────────────────

export const NAMING_SYSTEM_INSTRUCTION = `
너는 30년 경력의 정통 성명학 대가이자, 따뜻하지만 정확한 언어를 쓰는 작명 컨설턴트다.
원칙:
1. 제공된 [연산 데이터](사주 오행 분포, 수리 사격, 한자 정보)는 이미 검증된 계산 결과다. 절대 수치를 바꾸거나 새로 계산하지 마라.
2. 말투는 고급 컨설팅 리포트처럼 정중하고 신뢰감 있게. 미신적·공포 조장 표현 대신 "기운의 균형", "보완", "흐름" 같은 전문 용어를 사용한다.
3. 모바일 가독성을 위해 한 문단은 2~3문장으로 짧게 끊고, 문단 사이는 줄바꿈 2번(\\n\\n)으로 구분한다.
4. 반드시 순수 JSON만 출력한다. 마크다운 백틱이나 부연 설명 금지.
`.trim();

/** 서비스 유형 한글 라벨 */
export const SERVICE_TYPE_LABEL: Record<string, string> = {
    newborn: '신생아 작명',
    evaluation: '이름 감명(검증)',
    rename: '개명',
};

/** 가치 키워드 한글 라벨 */
export const VALUE_LABEL: Record<string, string> = {
    wealth: '재물운',
    career: '커리어와 성공',
    health: '건강과 장수',
    modern: '세련된 어감',
};

/**
 * 분석 대상 안내 — AI가 호칭을 잘못 추측하지 않도록 명시한다.
 * 신생아 작명만 '아기'이고, 감명·개명은 의뢰인 본인이 기본이다.
 */
function subjectLine(input: NamingInput): string {
    const genderLabel = input.gender === 'male' ? '남자' : '여자';
    if (input.serviceType === 'newborn') {
        return `- 분석 대상: 의뢰인의 아기 (${genderLabel})`;
    }
    return `- 분석 대상: 의뢰인 본인 (${genderLabel}) — 자녀가 아니므로 '아드님/따님/아이' 등 자녀 호칭을 절대 쓰지 말고, '귀하'로 지칭할 것`;
}

// ─────────────────────────────────────────────
// 1) 무료 진단(미끼) 프롬프트 — 결핍 자각 단계
// ─────────────────────────────────────────────

export const teaserSchema = {
    type: 'object' as any,
    properties: {
        headline: { type: 'string' as any },
        diagnosis: { type: 'string' as any },
        currentNameComment: { type: 'string' as any },
        solutionTeaser: { type: 'string' as any },
    },
    required: ['headline', 'diagnosis', 'solutionTeaser'],
};

interface TeaserContext {
    input: NamingInput;
    surname: SurnameEntry;
    baziStr: string;
    diagnosis: OhaengDiagnosis;
}

export function buildTeaserPrompt(ctx: TeaserContext): string {
    const { input, surname, baziStr, diagnosis } = ctx;
    const [primary] = diagnosis.complement;
    const meaning = OHAENG_MEANING[primary];

    const ohaengLine = (['목', '화', '토', '금', '수'] as const)
        .map(k => `${k}(${OHAENG_MEANING[k].hanja}) ${diagnosis.counts[k]}개·${diagnosis.percentages[k]}%`)
        .join(', ');

    return `[의뢰 정보]
- 서비스: ${SERVICE_TYPE_LABEL[input.serviceType]}
${subjectLine(input)}
- 성씨: ${surname.hangul}(${surname.hanja}, ${surname.strokes}획, 자원오행 ${surname.element})
- 중시하는 가치: ${VALUE_LABEL[input.value]}
${input.currentName ? `- 현재 이름(성 제외): ${input.currentName}` : ''}
${input.concern ? `- 의뢰인이 직접 적은 고민: ${input.concern}` : ''}

[연산 데이터 — 절대 수치 변경 금지]
- 사주 명식: ${baziStr.trim()}
- 오행 분포: ${ohaengLine}
- 결핍 오행(0개): ${diagnosis.missing.length > 0 ? diagnosis.missing.join(', ') : '없음'}
- 가장 부족한 오행: ${diagnosis.weakest} / 가장 과다한 오행: ${diagnosis.strongest}
- 이름으로 보완해야 할 오행: ${diagnosis.complement.join(' → ')} (${meaning.domain} 영역)

위 데이터를 바탕으로, 결제 전 무료 진단 문구를 작성해라. 의뢰인이 "내 사주(혹은 아이 사주)에 이런 구멍이 있구나"를 강하게 자각하게 만들되, 과장된 공포 대신 전문가의 정밀 진단처럼 서술해야 한다.
${input.concern ? `의뢰인이 적은 고민("${input.concern}")의 표현을 첫 문장에 자연스럽게 녹여서, 자신만을 위한 분석임을 체감하게 하라.` : ''}

JSON 포맷:
{
  "headline": "오행 결핍을 한 줄로 찌르는 헤드라인. 예: 선천 명식에 재물과 지혜를 뜻하는 '물(水)'의 기운이 0%로 고갈되어 있습니다",
  "diagnosis": "결핍 오행이 ${meaning.domain} 영역에서 어떤 흐름의 누수를 만드는지 300자 내외로 정밀 진단. 사주 명식의 실제 글자(천간·지지)를 1~2개 인용해 근거를 보여줄 것",
  ${input.currentName ? `"currentNameComment": "현재 이름 '${input.currentName}'에 대한 성명학적 소견 2~3문장. 보완 오행 관점에서 아쉬운 점을 짚되 단정적 비난은 피할 것",` : ''}
  "solutionTeaser": "이 결핍이 이름의 자원오행과 수리 획수로 후천적으로 보완 가능하다는 희망적 처방 예고 2~3문장. 구체적인 이름은 절대 공개하지 말 것"
}`;
}

// ─────────────────────────────────────────────
// 2) 프리미엄 리포트 프롬프트 — 이름 10개 해설
// ─────────────────────────────────────────────

export const premiumSchema = {
    type: 'object' as any,
    properties: {
        intro: { type: 'string' as any },
        ohaengStory: { type: 'string' as any },
        names: {
            type: 'array' as any,
            items: {
                type: 'object' as any,
                properties: {
                    hangul: { type: 'string' as any },
                    catchphrase: { type: 'string' as any },
                    interpretation: { type: 'string' as any },
                    callingVibe: { type: 'string' as any },
                },
                required: ['hangul', 'catchphrase', 'interpretation'],
            },
        },
        bestPick: {
            type: 'object' as any,
            properties: {
                hangul: { type: 'string' as any },
                reason: { type: 'string' as any },
            },
            required: ['hangul', 'reason'],
        },
        closing: { type: 'string' as any },
    },
    required: ['intro', 'ohaengStory', 'names', 'bestPick', 'closing'],
};

interface PremiumContext {
    input: NamingInput;
    surname: SurnameEntry;
    baziStr: string;
    diagnosis: OhaengDiagnosis;
    candidates: NameCandidate[];
}

export function buildPremiumPrompt(ctx: PremiumContext): string {
    const { input, surname, baziStr, diagnosis, candidates } = ctx;

    const candidateLines = candidates.map((c, idx) => {
        const [h1, h2] = c.hanja;
        return `${idx + 1}. ${surname.hangul}${c.hangul} (${surname.hanja}${h1.char}${h2.char})
   - 한자: ${h1.char}(${h1.reading}, ${h1.strokes}획, ${h1.element}, ${h1.meaning}) + ${h2.char}(${h2.reading}, ${h2.strokes}획, ${h2.element}, ${h2.meaning})
   - 수리 사격: 원격 ${c.sagyeok.won.value}(${c.sagyeok.won.grade}·${c.sagyeok.won.title}) / 형격 ${c.sagyeok.hyeong.value}(${c.sagyeok.hyeong.grade}·${c.sagyeok.hyeong.title}) / 이격 ${c.sagyeok.i.value}(${c.sagyeok.i.grade}·${c.sagyeok.i.title}) / 정격 ${c.sagyeok.jeong.value}(${c.sagyeok.jeong.grade}·${c.sagyeok.jeong.title})
   - 자원오행 배치: ${c.elements.join(' → ')}`;
    }).join('\n\n');

    return `[의뢰 정보]
- 서비스: ${SERVICE_TYPE_LABEL[input.serviceType]}
${subjectLine(input)}
- 성씨: ${surname.hangul}(${surname.hanja})
- 중시하는 가치: ${VALUE_LABEL[input.value]}
${input.currentName ? `- 현재 이름(성 제외): ${input.currentName}` : ''}
${input.concern ? `- 의뢰인의 고민: ${input.concern}` : ''}

[사주 연산 데이터 — 절대 수치 변경 금지]
- 사주 명식: ${baziStr.trim()}
- 오행 분포: ${(['목', '화', '토', '금', '수'] as const).map(k => `${k} ${diagnosis.counts[k]}개`).join(', ')}
- 보완 오행: ${diagnosis.complement.join(' → ')}

[규칙 기반 엔진이 선별한 이름 후보 — 이 목록의 이름만 사용할 것, 새 이름 창작 금지]
${candidateLines}

위 후보 전부에 대해 프리미엄 작명 리포트 해설을 작성해라. names 배열은 후보 순서 그대로, 후보 개수와 동일하게 작성한다.

JSON 포맷:
{
  "intro": "의뢰인을 위한 리포트 서문. ${input.concern ? `고민("${input.concern}")을 첫 문장에 녹여` : '의뢰 배경을 헤아리며'} 정중하게 시작, 300자 내외",
  "ohaengStory": "이 사주의 오행 구조와 보완 전략을 스토리텔링으로 풀어낸 본문 500자 내외. 왜 ${diagnosis.complement[0]} 기운을 1순위로 채워야 하는지 명식 글자를 근거로 설명",
  "names": [
    {
      "hangul": "후보의 한글 이름 (성 제외, 목록과 정확히 일치)",
      "catchphrase": "이 이름의 정체성을 한 줄로 표현. 예: 마르지 않는 샘처럼 재물이 고이는 이름",
      "interpretation": "한자 뜻 + 자원오행 보완 효과 + 수리 사격의 길격 해설을 엮은 300자 내외 해설. 제공된 수리 명칭(예: 공명격)을 반드시 인용",
      "callingVibe": "부를 때의 어감과 현대적 인상 1~2문장"
    }
  ],
  "bestPick": { "hangul": "후보 중 ${VALUE_LABEL[input.value]} 가치에 가장 부합하는 이름 1개 (성 제외, 이름 2글자만 정확히 일치)", "reason": "선정 이유 200자 내외" },
  "closing": "이름을 부르는 행위 자체가 기운을 채우는 과정임을 담은 따뜻한 맺음말 150자 내외"
}`;
}
