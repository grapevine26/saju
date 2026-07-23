import { NextResponse } from "next/server";
import { calculateBazi } from "@/utils/baziCalc";
import { calculateCompatibility, calculateHapScores, hapGradeFromScore, hapStarsFromScore, classifyRelationType } from "@/utils/compatibilityCalc";
import { ganToHanja } from "@/utils/ganHanja";

/**
 * 운명의 합 — 무료 미리보기 (AI 호출 없음, 결정론 계산만)
 * 끌림/갈등/보완 점수와 합충 목록, 일간 인장에 더해
 * 6항목 점수(숫자만 — '왜'는 유료 리포트로), 관계 유형 배지,
 * 오행 분포 비교 데이터를 반환한다.
 * 원가가 0원이므로 레이트리밋을 적용하지 않는다.
 */

export async function POST(request: Request) {
    try {
        const { my, partner } = await request.json();
        if (!my?.birthYear || !partner?.birthYear) {
            return NextResponse.json({ success: false, error: "생년월일 정보가 필요합니다." }, { status: 400 });
        }

        const myBazi = calculateBazi(
            my.gender, my.calendarType || 'solar',
            my.birthYear, my.birthMonth, my.birthDay,
            my.birthCity || 'seoul', my.birthHour || '', my.birthMinute || '',
            !!my.isTimeUnknown, my.birthTimezone, my.birthLongitude
        );
        const partnerBazi = calculateBazi(
            partner.gender, partner.calendarType || 'solar',
            partner.birthYear, partner.birthMonth, partner.birthDay,
            partner.birthCity || 'seoul', partner.birthHour || '', partner.birthMinute || '',
            !!partner.isTimeUnknown, partner.birthTimezone, partner.birthLongitude
        );
        const compatibility = calculateCompatibility(myBazi, partnerBazi);

        // 6항목 점수 — 유료 리포트와 같은 앵커 계산을 그대로 재사용 (숫자는 무료, 해석은 유료)
        const hapScores = calculateHapScores(compatibility);
        const relationType = classifyRelationType(
            compatibility.attractionScore, compatibility.conflictScore, compatibility.complementScore
        );

        return NextResponse.json({
            success: true,
            data: {
                mySeal: ganToHanja(myBazi.manseryeok?.day?.gan),
                partnerSeal: ganToHanja(partnerBazi.manseryeok?.day?.gan),
                hapScores,
                totalGrade: hapGradeFromScore(hapScores.total),
                totalStars: hapStarsFromScore(hapScores.total),
                relationType,
                myOhhaeng: myBazi.ohhaengCounts,
                partnerOhhaeng: partnerBazi.ohhaengCounts,
                ohhaengAnalysis: compatibility.ohhaengAnalysis,
                compatibility: {
                    attractionScore: compatibility.attractionScore,
                    conflictScore: compatibility.conflictScore,
                    complementScore: compatibility.complementScore,
                    hapList: compatibility.hapList,
                    chungList: compatibility.chungList,
                    hyeongList: compatibility.hyeongList,
                    haeList: compatibility.haeList,
                    dayMasterRelation: compatibility.dayMasterRelation,
                    spouseHouseRelation: compatibility.spouseHouseRelation,
                },
            },
        });
    } catch (e) {
        console.error("[hap/preview] 계산 실패:", e);
        return NextResponse.json({ success: false, error: "분석 계산에 실패했습니다." }, { status: 500 });
    }
}
