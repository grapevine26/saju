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
    isTimeUnknown: boolean,
    birthTimezone?: string,
    birthLongitude?: number
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

    let finalOffsetMinutes = 0;
    const inputHour = parseInt(birthHour, 10) || 0;
    const inputMinute = parseInt(birthMinute, 10) || 0;
    const y = parseInt(birthYear, 10) || 1990;
    const m = parseInt(birthMonth, 10) || 1;
    const d = parseInt(birthDay, 10) || 1;

    if (!isTimeUnknown && birthHour !== "" && birthMinute !== "") {
        // [새로운 글로벌 타임존 / 경도 보정 로직]
        if (birthTimezone && birthLongitude !== undefined) {
            try {
                // 해당 출생일/타임존 기준의 UTC 오프셋 분(minute) 구하기
                const dateObj = new Date(Date.UTC(y, m - 1, d, inputHour, inputMinute));

                // Intl을 이용해 해당 타임존의 시간 문자열 추출 (ex: "2000-01-01T10:00:00-05:00" 형태 유도 혹은 부가 수식)
                // 브라우저마다 파싱이 다를 수 있어 가장 안전한 방법: 
                // 해당 타임존에서의 표시 시간을 얻고, UTC와의 차이를 분단위로 계산
                const tzString = dateObj.toLocaleString('en-US', { timeZone: birthTimezone });
                const tzDate = new Date(tzString);

                // 기준 경도(Standard Longitude) 산출 시 사용하기 위한 대략적인 오프셋 시간 구하기
                // 정확한 오프셋 분 산출 시, Date 파싱 차이를 피하기 위해 시간차를 비교합니다.
                const offsetHours = (tzDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

                // 글로벌 타임존 기준 경도 = 타임존 오프셋 * 15도
                const standardLongitude = offsetHours * 15;

                // 진태양시 보정분 = (실제 경도 - 기준 경도) * 4분
                // (경도 1도당 4분의 시간차 발생. 한국의 경우 127 - 135 = -8 => -32분)
                finalOffsetMinutes = Math.round((birthLongitude - standardLongitude) * 4);

            } catch (e) {
                console.error("타임존 보정 계산 실패, 기본 하드코딩된 도시 오프셋으로 폴백합니다.", e);
                finalOffsetMinutes = cityOffsetMinutes[birthCity] || -32;
            }
        } else {
            // 과거 하드코딩된 대한민국/국내 지역 오프셋
            finalOffsetMinutes = cityOffsetMinutes[birthCity] || -32;
        }

        return calculateBaziWithCorrectedTime(
            gender, calendarType, y, m, d,
            inputHour, inputMinute, finalOffsetMinutes, isTimeUnknown,
            birthTimezone, birthLongitude
        );
    } else {
        return calculateBaziWithCorrectedTime(
            gender, calendarType, y, m, d,
            12, 0, 0, true,
            birthTimezone, birthLongitude
        );
    }
}

// 추출된 보정 함수 본문
function calculateBaziWithCorrectedTime(
    gender: 'male' | 'female' | null, calendarType: 'solar' | 'lunar',
    y: number, m: number, d: number,
    inputHour: number, inputMinute: number, offsetMinutes: number,
    isTimeUnknown: boolean,
    timezone?: string, longitude?: number
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
