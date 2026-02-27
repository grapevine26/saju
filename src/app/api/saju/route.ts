import { NextResponse } from "next/server";
import { Solar, Lunar } from "lunar-javascript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getManseryeokPillar, HANJA_TO_HANGUL } from "@/utils/sajuMapper";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const { name, gender, calendarType, birthYear, birthMonth, birthDay, birthTime, isTimeUnknown } = await request.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "서버에 Gemini API 키가 설정되지 않았습니다." }, { status: 500 });
        }

        // 1. 만세력 변환 로직 (lunar-javascript 이용)
        // birthTime 한글(예: 자시, 축시)을 시간으로 대략 매핑 (서머타임이나 정확한 경도 보정 제외, 단순 근사치)
        let hour = 12; // 시간 모를 경우 낮 12시로 임시 설정
        if (!isTimeUnknown && birthTime) {
            const timeMap: Record<string, number> = {
                "자시": 0, "축시": 2, "인시": 4, "묘시": 6, "진시": 8, "사시": 10,
                "오시": 12, "미시": 14, "신시": 16, "유시": 18, "술시": 20, "해시": 22
            };
            hour = timeMap[birthTime] ?? 12;
        }

        let lunarObj;
        let baziStr = "";

        const y = parseInt(birthYear);
        const m = parseInt(birthMonth);
        const d = parseInt(birthDay);

        if (calendarType === "solar") {
            const solar = Solar.fromYmdHms(y, m, d, hour, 0, 0);
            lunarObj = solar.getLunar();
        } else {
            lunarObj = Lunar.fromYmdHms(y, m, d, hour, 0, 0);
        }

        // 사주 8글자 추출 (시주 알 수 없는 경우 6글자로 제한)
        const bazi = lunarObj.getEightChar();

        const yGanHanja = bazi.getYearGan();
        const yZhiHanja = bazi.getYearZhi();
        const mGanHanja = bazi.getMonthGan();
        const mZhiHanja = bazi.getMonthZhi();
        const dGanHanja = bazi.getDayGan();
        const dZhiHanja = bazi.getDayZhi();
        const tGanHanja = isTimeUnknown ? "?" : bazi.getTimeGan();
        const tZhiHanja = isTimeUnknown ? "?" : bazi.getTimeZhi();

        const yearGangZhi = bazi.getYear();
        const monthGangZhi = bazi.getMonth();
        const dayGangZhi = bazi.getDay();
        const timeGangZhi = isTimeUnknown ? "??" : bazi.getTime();

        baziStr = `${yearGangZhi}년 ${monthGangZhi}월 ${dayGangZhi}일 ${timeGangZhi}시`;

        const dayGan = HANJA_TO_HANGUL[dGanHanja] || dGanHanja;
        const yearZhi = HANJA_TO_HANGUL[yZhiHanja] || yZhiHanja;
        const dayZhi = HANJA_TO_HANGUL[dZhiHanja] || dZhiHanja;

        const manseryeok = {
            year: getManseryeokPillar({
                gan: HANJA_TO_HANGUL[yGanHanja] || yGanHanja,
                zhi: yearZhi, dayGan,
                shiShenGan: bazi.getYearShiShenGan(), shiShenZhi: bazi.getYearShiShenZhi(), diShi: bazi.getYearDiShi(), hideGan: bazi.getYearHideGan(),
                yearZhi, dayZhi
            }),
            month: getManseryeokPillar({
                gan: HANJA_TO_HANGUL[mGanHanja] || mGanHanja,
                zhi: HANJA_TO_HANGUL[mZhiHanja] || mZhiHanja, dayGan,
                shiShenGan: bazi.getMonthShiShenGan(), shiShenZhi: bazi.getMonthShiShenZhi(), diShi: bazi.getMonthDiShi(), hideGan: bazi.getMonthHideGan(),
                yearZhi, dayZhi
            }),
            day: getManseryeokPillar({
                gan: dayGan,
                zhi: dayZhi, dayGan,
                shiShenGan: '일간', shiShenZhi: bazi.getDayShiShenZhi(), diShi: bazi.getDayDiShi(), hideGan: bazi.getDayHideGan(),
                yearZhi, dayZhi
            }),
            time: isTimeUnknown ? null : getManseryeokPillar({
                gan: HANJA_TO_HANGUL[tGanHanja] || tGanHanja,
                zhi: HANJA_TO_HANGUL[tZhiHanja] || tZhiHanja, dayGan,
                shiShenGan: bazi.getTimeShiShenGan(), shiShenZhi: bazi.getTimeShiShenZhi(), diShi: bazi.getTimeDiShi(), hideGan: bazi.getTimeHideGan(),
                yearZhi, dayZhi
            })
        };

        // 2. Gemini API 호출
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            // 시스템 인스트럭션: AI의 페르소나 및 응답 규칙 지정
            systemInstruction: `너는 MZ세대에게 인기 있는 '사주팝(SajuPop)'이라는 운세/사주 서비스의 1타 사주 마스터야.
딱딱한 한자 용어 대신 누구나 알아듣기 쉬운 재치 있고 통통 튀는 말투(해요체, 반말 혼용, 이모지 적극 사용)로 사주를 풀어줘.
반드시 JSON 형식에 정확히 맞춰서 대답해야 해! 다른 부연 설명이나 마크다운 백틱 없이 순수 JSON 데이터만 반환해.`,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
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
                }
            }
        });
        console.log(baziStr);
        // 실제 유저 데이터 프롬프트
        const prompt = `[사용자 정보]
- 이름: ${name || "익명"}
- 성별: ${gender === 'male' ? '남자' : '여자'}
- 사주팔자(간지): ${baziStr} 

위 정보와 사주팔자를 바탕으로, 다음 9가지 섹션을 모두 포함하여 사주를 분석해줘. 

{
  "keyword": "전체 사주를 꿰뚫는 핵심 키워드 한 줄 (예: 무자일주, 재물을 깔고 앉은 황금 거북이)",
  "score": 올해 운세 점수 (0~100 사이의 숫자, 예: 85),
  "summary": "내 사주의 전체적인 그림을 그리는 직관적인 2~3줄 요약",
  "details": [
    { 
      "title": "오행분석", 
      "subtitle": "얼음장 밑으로 흐르는 거대한 황금 물결의 지배자 (이런 식의 호기심을 자극하는 매력적인 소제목)", 
      "content": "오행의 비율과 그것이 내 뼈대와 기질에 미치는 영향을 자세히 설명해줘." 
    },
    { "title": "성격과 기질", "subtitle": "...", "content": "..." },
    { "title": "연애/결혼", "subtitle": "...", "content": "..." },
    { "title": "대인관계", "subtitle": "...", "content": "..." },
    { "title": "적성과 직업", "subtitle": "...", "content": "..." },
    { "title": "재물운", "subtitle": "...", "content": "..." },
    { "title": "건강운", "subtitle": "...", "content": "..." },
    { "title": "대운시기", "subtitle": "...", "content": "인생의 큰 흐름(대운)이 언제 바뀌고, 어떻게 대비해야 하는지" },
    { "title": "주의시기", "subtitle": "...", "content": "특별히 조심해야 할 년도나 달, 극복 방법" }
  ]
}
`;

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
