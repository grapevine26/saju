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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
너는 MZ세대에게 인기 있는 '사주팝(SajuPop)'이라는 운세/사주 서비스의 1타 사주 마스터야.
딱딱한 한자 용어 대신 누구나 알아듣기 쉬운 재치 있고 통통 튀는 말투(해요체, 반말 혼용, 이모지 적극 사용)로 사주를 풀어줘.

[사용자 정보]
- 이름: ${name || "익명"}
- 성별: ${gender === 'male' ? '남자' : '여자'}
- 사주팔자(간지): ${baziStr} 

위 정보와 사주팔자를 바탕으로 올해(2026년 기준)의 운세를 분석해서, 다음 JSON 형식에 정확히 맞춰서 대답해줘. 
꼭! 다른 말은 덧붙이지 말고 JSON 데이터만 반환해.

{
  "keyword": "올해를 대표하는 핵심 키워드 (예: 대기만성형 철학자)",
  "score": 올해 운세 점수 (0~100 사이의 숫자, 예: 85),
  "summary": "올해 운세에 대한 직관적이고 톡톡 튀는 2~3줄 요약",
  "details": [
    { "title": "내가 타고난 기운 🌟", "content": "내 사주의 중심이 되는 기운과 성격..." },
    { "title": "올해의 재물운 💰", "content": "올해는 돈이 어떻게 흐를까?..." },
    { "title": "올해의 애정/대인운 💖", "content": "솔로는? 커플은? 사람들은 날 어떻게 생각할까?..." }
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
