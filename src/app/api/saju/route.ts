import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateBazi } from "@/utils/baziCalc";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const { name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown } = await request.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "서버에 Gemini API 키가 설정되지 않았습니다." }, { status: 500 });
        }

        // 1. 만세력 변환 및 각종 데이터 추출 (공통 유틸 사용, 경도 보정 포함)
        const baziData = calculateBazi(gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown);
        const { age, baziStr, ohhaengCounts, sipsinSummary, uniqueShinsal, daeunStr, manseryeok } = baziData;

        // 2. Gemini API 호출
        const systemInstruction = `
# Role
너는 MZ세대에게 인기 있는 '사주팝(SajuPop)'이라는 운세/사주 서비스의 30년 경력의 명리학 전문가이자, 현대인의 심리를 치유하는 따뜻한 상담가야. 
고전 명리학의 깊이 있는 분석과 현대적인 라이프스타일 코칭을 결합하여 답변해.

# Principles
1. **말투 필수 사항**: 절대 로봇처럼 딱딱하거나 너무 점잖게 말하지 마. 유튜브나 인스타그램 릴스를 보듯 생생하고 트렌디한 MZ세대 톤(반말과 해요체를 능글맞게 섞어 쓰고, 유행어 및 드립 적극 활용)으로 말해줘.
2. **이모지 필수 사항**: 문장 끝부분이나 강조하고 싶은 내용 앞뒤로 **이모지(✨🔥💸😎💔💪🐸💰🐢 등)를 많이 넣어줘!** 텍스트만 빼곡하면 안 돼.
3. 가끔은 상대방의 뼈를 때리는 '팩트 폭행(돌직구 조언)'을 서슴지 않고 섞어서, 지루하지 않고 흡입력 있게 작성해. (예: "고집 좀 제발 버려라", "그렇게 살면 진짜 텅장 된다" 등)
4. 두루뭉술한 칭찬만 하지 말고, 제공된 오행/십성/신살 등의 명리학적 근거를 들어 "왜 그런 성향이 나타나는지" 조목조목 논리적이면서도 맛깔나게 묘사해.
5. **분량 필수 조건**: 각 섹션의 \`content\`는 아주 깊이 있게 썰을 풀듯이 길게 작성해야 해. 무조건 **최소 400자 이상, 3~4개의 문단**으로 풍성하게 구성해!대충 한두 줄로 끝내면 절대 안 돼.

# Response Rules
1. 반드시 JSON 형식에 정확히 맞춰서 대답해야 해! 다른 부연 설명이나 마크다운 백틱 없이 순수 JSON 데이터만 반환해.
2. 텍스트 본문(content)을 작성할 때 **한자(漢字)는 절대 섞어 쓰지 마!**. (예: '戊토' -> '무토')
3. **이모지를 아끼지 말고 한 문단에 최소 3-4개 이상** 반드시 포함시킬 것.
`.trim();

        const responseSchema = {
            type: "object" as any,
            properties: {
                keyword: { type: "string" as any },
                score: { type: "integer" as any },
                summary: { type: "string" as any },
                details: {
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
                }
            },
            required: ["keyword", "score", "summary", "details"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema
            }
        });
        // 실제 유저 데이터 프롬프트
        const prompt = `[사용자 정보]
- 이름: ${name || "익명"}
- 성별: ${gender === 'male' ? '남자' : '여자'}
- 만나이: ${age}세
- 사주팔자(간지): ${baziStr.trim()}
- 오행 구성: 목(${ohhaengCounts['목']}개), 화(${ohhaengCounts['화']}개), 토(${ohhaengCounts['토']}개), 금(${ohhaengCounts['금']}개), 수(${ohhaengCounts['수']}개)
- 기둥별 십성(년/월/일/시 순): ${sipsinSummary}
- 대운 정보: ${daeunStr}

위 정보와 사주팔자를 바탕으로, 다음 9가지 섹션을 모두 포함하여 사주를 분석해줘. JSON 형식에 정확히 맞춰서 대답해야 해! 다른 말은 덧붙이지 마.
{
  "keyword": "전체 사주를 꿰뚫는 핵심 키워드 한 줄 (예: 재물을 깔고 앉은 황금 거북이)",
  "score": 올해 운세 점수 (0~100 사이의 숫자, 예: 85),
  "summary": "내 사주의 전체적인 그림을 그리는 직관적인 2~3줄 요약",
  "details": [
    { 
      "title": "오행분석", 
      "subtitle": "매력적인 비유로 작성한 소제목 (예: 얼음장 밑으로 흐르는 거대한 황금 물결의 지배자)", 
      "content": "오행의 구성 비율(과다/부족)이 내 뼈대와 기질에 미치는 영향을 구체적으로 분석해. (최소 400자 이상, 여러 문단으로 아주 길고 상세하게)" 
    },
    { "title": "성격과 기질", "subtitle": "...", "content": "십성과 신살을 근거로 본인의 장단점, 겉모습과 속마음의 차이 등을 팩트 폭행을 곁들여 아주 길고 재미있게 분석해. (최소 400자 이상)" },
    { "title": "연애/결혼", "subtitle": "...", "content": "어떤 사람에게 끌리고 어떤 연애를 하는지, 보완해야 할 연애 습관은 무엇인지 뼈때리게 조언해줘. (최소 400자 이상)" },
    { "title": "대인관계", "subtitle": "...", "content": "사람들을 대하는 방식이나 주의해야 할 인간관계 패턴을 깊이 있게 설명해. (최소 400자 이상)" },
    { "title": "적성과 직업", "subtitle": "...", "content": "나의 재능과 잘 맞는 직업군, 일할 때의 스타일과 성공 확률을 높이는 방법을 상세히 설명해. (최소 400자 이상)" },
    { "title": "재물운", "subtitle": "...", "content": "내 사주의 그릇 크기, 돈이 새는 곳, 재물을 모으기 위해 반드시 갖춰야 할 태도를 아주 세세하게 분석해. (최소 400자 이상)" },
    { "title": "건강운", "subtitle": "...", "content": "특별히 조심해야 할 신체 부위나 스트레스 관리법에 대해 상세히 적어줘. (최소 300자 이상)" },
    { "title": "대운시기", "subtitle": "...", "content": "인생의 큰 흐름(대운)이 언제 바뀌는지, 대운의 변화기에 내가 겪을 수 있는 일들과 구체적인 대비책을 적어줘. (최소 400자 이상)" },
    { "title": "주의시기", "subtitle": "...", "content": "특별히 멘탈이나 상황 적으로 조심해야 할 특정 년도나 시기, 극복하기 위해 버려야 할 고집 등을 강력하게 경고해줘. (최소 400자 이상)" }
  ]
}
`;
        console.log(prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // JSON 부분 추출 (마크다운 백틱 제거)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedData;
        try {
            parsedData = JSON.parse(text);
            parsedData.manseryeok = manseryeok;
        } catch (e) {
            console.error(e, text);
            return NextResponse.json({ success: false, error: "AI 분석 결과를 읽는 데 실패했어요." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: parsedData
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "서버 오류 발생" }, { status: 500 });
    }
}
