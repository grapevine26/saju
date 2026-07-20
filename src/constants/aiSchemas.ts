// ─────────────────────────────────────
// AI 응답 스키마 정의 (Gemini responseSchema)
// ─────────────────────────────────────

/** 공통: 상세 분석 아이템 스키마 */
const detailItemSchema = {
  type: "object" as any,
  properties: {
    title: { type: "string" as any },
    subtitle: { type: "string" as any },
    content: { type: "string" as any }
  },
  required: ["title", "subtitle", "content"]
};

/** prompt1 스키마: 무료 라이트 분석 (reunion 라우트·Inngest 폴백 공유) */
export const schema1 = {
  type: "object" as any,
  properties: {
    reunionKeyword: { type: "string" as any },
    reunionScore: { type: "integer" as any },
    summary: { type: "string" as any },
    // 이 필드가 빠지면 클라이언트가 하드코딩 폴백("1개월 내")을 노출해 캘린더와 모순된다
    secretTeaser: { type: "string" as any },
    details: { type: "array" as any, items: detailItemSchema }
  },
  required: ["reunionKeyword", "reunionScore", "summary", "secretTeaser", "details"]
};

/** prompt2 스키마: 프리미엄 심층 분석 8개 + 상대방 공략 매뉴얼 */
export const schema2 = {
  type: "object" as any,
  properties: {
    details: { type: "array" as any, items: detailItemSchema },
    partnerManual: {
      type: "object" as any,
      properties: {
        forbiddenWords: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              word: { type: "string" as any },
              reason: { type: "string" as any }
            },
            required: ["word", "reason"]
          }
        },
        magicKeywords: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              keyword: { type: "string" as any },
              effect: { type: "string" as any }
            },
            required: ["keyword", "effect"]
          }
        },
        dateSpots: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              place: { type: "string" as any },
              reason: { type: "string" as any }
            },
            required: ["place", "reason"]
          }
        },
        textExamples: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              situation: { type: "string" as any },
              good: { type: "string" as any },
              bad: { type: "string" as any }
            },
            required: ["situation", "good", "bad"]
          }
        }
      },
      required: ["forbiddenWords", "magicKeywords", "dateSpots", "textExamples"]
    }
  },
  required: ["details", "partnerManual"]
};

/** prompt3 스키마: 골든 윈도우 캘린더 + 로드맵 + 월별 에너지 */
export const schema3 = {
  type: "object" as any,
  properties: {
    monthlyEnergies: {
      type: "array" as any,
      items: {
        type: "object" as any,
        properties: { month: { type: "string" as any }, theme: { type: "string" as any }, advice: { type: "string" as any } },
        required: ["month", "theme", "advice"]
      }
    },
    roadmapStages: {
      type: "array" as any,
      items: {
        type: "object" as any,
        properties: { step: { type: "string" as any }, title: { type: "string" as any }, action: { type: "string" as any } },
        required: ["step", "title", "action"]
      }
    },
    // goldenWindowMonths는 더 이상 AI에 요청하지 않음 — 달·날짜 모두
    // 결정론 계산(calculateGoldenDates)으로 확정한다
  },
  required: ["monthlyEnergies", "roadmapStages"]
};

/** prompt4 스키마: 궁합 집중 분석 리포트 */
export const schema4 = {
  type: "object" as any,
  properties: {
    radarChart: {
      type: "object" as any,
      properties: {
        communication: { type: "number" as any },
        affection: { type: "number" as any },
        intimacy: { type: "number" as any },
        future: { type: "number" as any },
        conflict: { type: "number" as any },
        subtitle: { type: "string" as any },
        summary: { type: "string" as any }
      },
      required: ["communication", "affection", "intimacy", "future", "conflict", "subtitle", "summary"]
    },
    vsCards: {
      type: "array" as any,
      items: {
        type: "object" as any,
        properties: {
          topic: { type: "string" as any },
          myTrait: { type: "string" as any },
          partnerTrait: { type: "string" as any },
          explanation: { type: "string" as any }
        },
        required: ["topic", "myTrait", "partnerTrait", "explanation"]
      }
    },
    compatibilityDetails: {
      type: "array" as any,
      items: {
        type: "object" as any,
        properties: {
          title: { type: "string" as any },
          subtitle: { type: "string" as any },
          content: { type: "string" as any }
        },
        required: ["title", "subtitle", "content"]
      }
    },
    coupleType: {
      type: "object" as any,
      properties: {
        label: { type: "string" as any },
        emoji: { type: "string" as any },
        // 두 기질을 자연물로 의인화한 오프닝 비유 (예: 큰 산과 그 비탈에 피는 꽃)
        natureMetaphor: { type: "string" as any },
        description: { type: "string" as any }
      },
      required: ["label", "emoji", "natureMetaphor", "description"]
    },
    overallGrade: {
      type: "object" as any,
      properties: {
        grade: { type: "string" as any },
        label: { type: "string" as any },
        // 이 인연을 꿰뚫는 한 문장 선언 — 종합 진단 상단 인용 타이포로 노출
        oneLiner: { type: "string" as any },
        // 영역별 등급표 (연애·결혼생활·소통·재물·가정)
        categoryGrades: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              area: { type: "string" as any },
              grade: { type: "string" as any },
              comment: { type: "string" as any }
            },
            required: ["area", "grade", "comment"]
          }
        },
        strengths: { type: "array" as any, items: { type: "string" as any } },
        weaknesses: { type: "array" as any, items: { type: "string" as any } },
        finalMessage: { type: "string" as any }
      },
      required: ["grade", "label", "oneLiner", "categoryGrades", "strengths", "weaknesses", "finalMessage"]
    }
  },
  required: ["radarChart", "vsCards", "compatibilityDetails", "coupleType", "overallGrade"]
};
