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
    goldenWindowMonths: {
      type: "array" as any,
      items: {
        type: "object" as any,
        properties: {
          month: { type: "string" as any },
          goodDates: { type: "array" as any, items: { type: "number" as any } },
          badDates: { type: "array" as any, items: { type: "number" as any } }
        },
        required: ["month", "goodDates", "badDates"]
      }
    }
  },
  required: ["monthlyEnergies", "roadmapStages", "goldenWindowMonths"]
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
          content: { type: "string" as any }
        },
        required: ["title", "content"]
      }
    },
    coupleType: {
      type: "object" as any,
      properties: {
        label: { type: "string" as any },
        emoji: { type: "string" as any },
        description: { type: "string" as any }
      },
      required: ["label", "emoji", "description"]
    },
    overallGrade: {
      type: "object" as any,
      properties: {
        grade: { type: "string" as any },
        label: { type: "string" as any },
        strengths: { type: "array" as any, items: { type: "string" as any } },
        weaknesses: { type: "array" as any, items: { type: "string" as any } },
        finalMessage: { type: "string" as any }
      },
      required: ["grade", "label", "strengths", "weaknesses", "finalMessage"]
    }
  },
  required: ["radarChart", "vsCards", "compatibilityDetails", "coupleType", "overallGrade"]
};
