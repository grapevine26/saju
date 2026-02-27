import { Solar, Lunar } from "lunar-javascript";
import { getManseryeokPillar, HANJA_TO_HANGUL } from "./sajuMapper";

export interface BaziCalculationResult {
    baziStr: string;
    age: number;
    manseryeok: {
        year: any;
        month: any;
        day: any;
        time: any | null;
    };
    ohhaengCounts: Record<string, number>;
    sipsinSummary: string;
    uniqueShinsal: string;
    daeunStr: string;
}

export function calculateBazi(
    gender: 'male' | 'female' | null,
    calendarType: 'solar' | 'lunar',
    birthYear: string,
    birthMonth: string,
    birthDay: string,
    birthCity: string,   // "seoul", "busan" 등
    birthHour: string,
    birthMinute: string,
    isTimeUnknown: boolean
): BaziCalculationResult {
    // 1. 지역별 경도 시간 보정 로직 (진태양시 계산)
    // 대한민국 표준시는 135도(UTC+9) 기준. 각 도시별 경도차에 따른 보정값(분)
    const cityOffsetMinutes: Record<string, number> = {
        "seoul": -32, // 동경 127도
        "busan": -24, // 동경 129도
        "daegu": -28, // 동경 128.5도
        "gwangju": -32,
        "daejeon": -30,
        "gangneung": -22,
        "jeju": -32
    };

    let hour = 12;
    let minute = 0;

    if (!isTimeUnknown && birthHour !== "" && birthMinute !== "") {
        const offset = cityOffsetMinutes[birthCity] || -32; // 기본값 서울 기준
        const inputHour = parseInt(birthHour, 10) || 0;
        const inputMinute = parseInt(birthMinute, 10) || 0;

        // 보정분을 입력 시간에 적용
        const totalMinutes = inputHour * 60 + inputMinute + offset;

        // 0시 이전이나 24시 이후로 넘어가는 경우 
        // lunar-javascript 의 fromYmdHms 에 Date 객체를 사용하거나 직접 일자 보정이 필요할 수 있으나
        // 라이브러리의 계산식에서는 단순 시, 분을 넣어도 내부적으로 윤달/윤일 등 보정이 됩니다.
        // 하지만 시주 산출이 목표이므로 시/분만 조정(날짜 경계는 보수적으로 JS Date 사용)
        return calculateBaziWithCorrectedTime(
            gender, calendarType, parseInt(birthYear, 10) || 1990, parseInt(birthMonth, 10) || 1, parseInt(birthDay, 10) || 1,
            inputHour, inputMinute, offset, isTimeUnknown
        );
    } else {
        return calculateBaziWithCorrectedTime(
            gender, calendarType, parseInt(birthYear, 10) || 1990, parseInt(birthMonth, 10) || 1, parseInt(birthDay, 10) || 1,
            12, 0, 0, true
        );
    }
}

// 추출된 보정 함수 본문
function calculateBaziWithCorrectedTime(
    gender: 'male' | 'female' | null, calendarType: 'solar' | 'lunar',
    y: number, m: number, d: number,
    inputHour: number, inputMinute: number, offsetMinutes: number,
    isTimeUnknown: boolean
): BaziCalculationResult {
    // 날짜 연산을 통해 정확하게 분단위 시간을 가감하여 날짜가 넘어가는 것도 반영
    const dateObj = new Date(y, m - 1, d, inputHour, inputMinute + offsetMinutes);
    const corrY = dateObj.getFullYear();
    const corrM = dateObj.getMonth() + 1;
    const corrD = dateObj.getDate();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();

    let lunarObj;
    let baziStr = "";

    if (calendarType === "solar") {
        const solar = Solar.fromYmdHms(corrY, corrM, corrD, hour, minute, 0);
        lunarObj = solar.getLunar();
    } else {
        lunarObj = Lunar.fromYmdHms(corrY, corrM, corrD, hour, minute, 0);
    }

    // 2. 사주 8글자 추출
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

    baziStr = `
        ${yearGangZhi}년 ${monthGangZhi}월 ${dayGangZhi}일 ${timeGangZhi}시
    `;

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

    // 3. 만나이 계산
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // 4. 오행 갯수 추출
    const ohhaengCounts: Record<string, number> = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    const pillars = [manseryeok.year, manseryeok.month, manseryeok.day, manseryeok.time].filter(Boolean) as any[];
    pillars.forEach(p => {
        if (p.ganOhhaeng) ohhaengCounts[p.ganOhhaeng] = (ohhaengCounts[p.ganOhhaeng] || 0) + 1;
        if (p.zhiOhhaeng) ohhaengCounts[p.zhiOhhaeng] = (ohhaengCounts[p.zhiOhhaeng] || 0) + 1;
    });

    // 5. 십성 요약 구성
    const sipsinSummary = pillars.map(p => `${p.ganSipsin}(천간) / ${p.zhiSipsin}(지지)`).join(' | ');

    // 6. 대표적인 흉살/길살(주요 신살) 필터링
    const MAJOR_SHINSALS = [
        '천을귀인', '백호대살', '괴강살', '양인살', '도화살', '홍염살',
        '역마살', '지살', '화개살', '원진살', '귀문관살', '현침살',
        '탕화살', '문창귀인', '천라지망', '망신살', '겁살', '장성살'
    ];

    let shinsalList: string[] = [];
    pillars.forEach(p => {
        if (p.generalShinsal) shinsalList.push(...p.generalShinsal);
        if (p.shinsal) {
            shinsalList.push(...p.shinsal.filter((s: string) => s !== '-'));
        }
    });

    const filteredShinsal = Array.from(new Set(shinsalList)).filter(s => MAJOR_SHINSALS.includes(s));
    const uniqueShinsal = filteredShinsal.join(", ");

    // 7. 대운 계산 (lunar-javascript 대운 객체 이용)
    let daeunStr = "알 수 없음";
    try {
        const genderCode = gender === 'male' ? 1 : 0;
        const daeunObj = bazi.getYun(genderCode);
        const daeunSu = daeunObj.getStartYear();
        daeunStr = `대운수: ${daeunSu} (매 ${daeunSu}세 단위로 운의 큰 흐름이 바뀜)`;
    } catch (error) {
        console.error("대운 계산 에러:", error);
    }

    return {
        baziStr,
        age,
        manseryeok,
        ohhaengCounts,
        sipsinSummary,
        uniqueShinsal,
        daeunStr
    };
}
