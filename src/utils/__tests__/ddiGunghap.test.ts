import { describe, it, expect } from 'vitest';
import {
    calculateDdiGunghap, buildSlug, parseSlug, canonicalOrder,
    getAllOrderedPairs, getCanonicalPairs, animalToZhi,
    analyzeJijanggan, getRankedMatches, josa,
    parseAnimalSlug, buildAnimalSlug, getDdiYears, getSamhapGroupInfo,
    buildGenderedSlug, parseGenderedSlug, getAllGenderedPairs, calculateGenderedGunghap, getZhiYinYang,
} from '../ddiGunghap';
import { DDI_PROFILES } from '../ddiProfiles';
import { ZHI } from '../sajuMapper';

describe('띠 궁합 계산 (ddiGunghap)', () => {
    it('자축은 지지육합 관계다 (쥐띠-소띠)', () => {
        const r = calculateDdiGunghap('자', '축');
        expect(r.hapList.some(h => h.type === '지지육합')).toBe(true);
        expect(r.animal1).toBe('쥐');
        expect(r.animal2).toBe('소');
    });

    it('자오는 지지충 관계다 (쥐띠-말띠)', () => {
        const r = calculateDdiGunghap('자', '오');
        expect(r.clashList.some(c => c.type === '지지충')).toBe(true);
    });

    it('신자진은 삼합(반합) 관계다 (원숭이띠-쥐띠)', () => {
        const r = calculateDdiGunghap('신', '자');
        expect(r.hapList.some(h => h.type === '지지삼합(반합)')).toBe(true);
    });

    it('합도 충도 없는 조합은 두 목록 다 비어있다 (쥐띠-호랑이띠)', () => {
        const r = calculateDdiGunghap('자', '인');
        expect(r.hapList.length).toBe(0);
        expect(r.clashList.length).toBe(0);
    });

    it('같은 띠끼리는 오행 비화 관계다', () => {
        const r = calculateDdiGunghap('자', '자');
        expect(r.ohhaengRelation).toBe('비화');
    });

    it('점수는 항상 0~100 범위 안이다 (전체 144쌍)', () => {
        for (const [z1, z2] of getAllOrderedPairs()) {
            const r = calculateDdiGunghap(z1, z2);
            expect(r.totalScore).toBeGreaterThanOrEqual(0);
            expect(r.totalScore).toBeLessThanOrEqual(100);
            expect(r.attractionScore).toBeGreaterThanOrEqual(0);
            expect(r.conflictScore).toBeLessThanOrEqual(100);
        }
    });

    it('전체 순서쌍은 144개, 정규 순서는 78개다', () => {
        expect(getAllOrderedPairs().length).toBe(144);
        expect(getCanonicalPairs().length).toBe(78);
    });

    it('슬러그 빌드·파싱이 왕복한다', () => {
        const slug = buildSlug('자', '축');
        expect(slug).toBe('쥐띠-소띠');
        expect(parseSlug(slug)).toEqual(['자', '축']);
    });

    it('잘못된 슬러그는 null을 반환한다', () => {
        expect(parseSlug('쥐띠')).toBeNull();
        expect(parseSlug('용띠-불사조띠')).toBeNull();
    });

    it('canonicalOrder는 순서를 뒤집어도 항상 같은 결과를 낸다', () => {
        expect(canonicalOrder('오', '자')).toEqual(canonicalOrder('자', '오'));
    });

    it('animalToZhi는 알 수 없는 동물명에 null을 반환한다', () => {
        expect(animalToZhi('공룡')).toBeNull();
        expect(animalToZhi('쥐')).toBe('자');
    });
});

describe('띠 궁합 콘텐츠 생성', () => {
    it('12띠 프로필이 모두 채워져 있다', () => {
        for (const zhi of ZHI) {
            const p = DDI_PROFILES[zhi];
            expect(p, `${zhi} 프로필 누락`).toBeDefined();
            expect(p.tagline.length).toBeGreaterThan(0);
            expect(p.loveStyle.length).toBeGreaterThan(0);
            expect(p.weakness.length).toBeGreaterThan(0);
            expect(p.keywords.length).toBe(3);
        }
    });

    it('지장간 합을 찾아낸다 — 사(무경병)×유(경신)는 병신합수', () => {
        const links = analyzeJijanggan('사', '유');
        expect(links.some(l => l.description === '병신합수')).toBe(true);
    });

    it('지장간 합이 없는 조합은 빈 배열이다', () => {
        expect(analyzeJijanggan('자', '축')).toEqual([]);
    });

    it('모든 조합에 서사·조언·주의점이 비어있지 않게 생성된다', () => {
        for (const [z1, z2] of getAllOrderedPairs()) {
            const r = calculateDdiGunghap(z1, z2);
            expect(r.narrative.length, `${z1}${z2} 서사 누락`).toBeGreaterThan(20);
            expect(r.advice.length, `${z1}${z2} 조언 누락`).toBeGreaterThan(20);
            expect(r.frictionPoint.length, `${z1}${z2} 주의점 누락`).toBeGreaterThan(20);
            expect(r.profile1).toBeDefined();
            expect(r.profile2).toBeDefined();
        }
    });

    it('같은 띠 조합은 전용 서사를 쓴다', () => {
        const r = calculateDdiGunghap('자', '자');
        expect(r.narrative).toContain('같은 쥐띠끼리');
    });

    it('getRankedMatches는 12개를 점수 내림차순으로 반환한다', () => {
        const ranked = getRankedMatches('자');
        expect(ranked.length).toBe(12);
        for (let i = 1; i < ranked.length; i++) {
            expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
        }
    });

    it('육합이면 오행 상극이어도 보완 점수가 깎이지 않는다 (합이 극을 중재)', () => {
        // 자축: 육합이면서 토극수 상극 — 합 중재가 적용돼 38이 아닌 55가 나와야 한다
        const withHap = calculateDdiGunghap('자', '축');
        expect(withHap.ohhaengRelation).toBe('상극');
        expect(withHap.complementScore).toBe(55);

        // 축인(소띠-호랑이띠): 목극토 상극이면서 합도 충도 없는 조합 — 38 그대로여야 한다
        const noHap = calculateDdiGunghap('축', '인');
        expect(noHap.ohhaengRelation).toBe('상극');
        expect(noHap.hapList.length).toBe(0);
        expect(noHap.complementScore).toBe(38);
    });

    it('조사 헬퍼가 받침을 정확히 판정한다 — 천간합 5종 전부', () => {
        // 받침 없음 → 로 / 받침 있음 → 으로
        expect(josa('갑기합토', '으로', '로')).toBe('로');
        expect(josa('병신합수', '으로', '로')).toBe('로');
        expect(josa('무계합화', '으로', '로')).toBe('로');
        expect(josa('을경합금', '으로', '로')).toBe('으로');
        expect(josa('정임합목', '으로', '로')).toBe('으로');
    });

    it('조사 헬퍼는 여러 합을 이어 붙인 문자열도 마지막 글자 기준으로 판정한다', () => {
        expect(josa('을경합금, 병신합수', '으로', '로')).toBe('로');
        expect(josa('병신합수, 을경합금', '으로', '로')).toBe('으로');
    });

    it('궁합 순위는 어느 쪽에서 봐도 같은 점수가 나온다 (대칭성)', () => {
        for (const other of ZHI) {
            const fromJa = getRankedMatches('자').find(m => m.zhi === other)!;
            const fromOther = getRankedMatches(other).find(m => m.zhi === '자')!;
            expect(fromJa.score, `자↔${other} 비대칭`).toBe(fromOther.score);
        }
    });
});

describe('띠 단독 페이지 (ddi)', () => {
    it('띠 슬러그를 왕복 변환한다', () => {
        expect(buildAnimalSlug('자')).toBe('쥐띠');
        expect(parseAnimalSlug('쥐띠')).toBe('자');
        expect(parseAnimalSlug('돼지띠')).toBe('해');
    });

    it('궁합 조합 슬러그는 띠 슬러그로 받지 않는다 (라우트 혼선 방지)', () => {
        expect(parseAnimalSlug('쥐띠-소띠')).toBeNull();
    });

    it('알 수 없는 띠는 null이다', () => {
        expect(parseAnimalSlug('불사조띠')).toBeNull();
    });

    it('12띠 전부 슬러그 왕복이 성립한다', () => {
        for (const zhi of ZHI) {
            expect(parseAnimalSlug(buildAnimalSlug(zhi)), `${zhi} 왕복 실패`).toBe(zhi);
        }
    });

    it('띠별 출생 연도를 정확히 계산한다', () => {
        // 2020년은 경자년(쥐띠), 2021년은 신축년(소띠)
        expect(getDdiYears('자')).toContain(2020);
        expect(getDdiYears('축')).toContain(2021);
        expect(getDdiYears('자')).not.toContain(2021);
        // 12년 주기
        expect(getDdiYears('자')).toContain(2008);
        expect(getDdiYears('자')).toContain(1996);
    });

    it('모든 연도는 정확히 하나의 띠에만 속한다', () => {
        for (let y = 1936; y <= 2032; y++) {
            const owners = ZHI.filter((z) => getDdiYears(z).includes(y));
            expect(owners.length, `${y}년이 ${owners.length}개 띠에 속함`).toBe(1);
        }
    });

    it('12띠 모두 삼합국에 속한다', () => {
        for (const zhi of ZHI) {
            const g = getSamhapGroupInfo(zhi);
            expect(g, `${zhi} 삼합국 없음`).not.toBeNull();
            expect(g!.members).toContain(zhi);
            expect(g!.members.length).toBe(3);
        }
    });
});

describe('남녀 조합 (namnyeo)', () => {
    it('남녀 슬러그를 왕복 변환한다', () => {
        const slug = buildGenderedSlug('자', '축');
        expect(slug).toBe('쥐띠남자-소띠여자');
        expect(parseGenderedSlug(slug)).toEqual({ maleZhi: '자', femaleZhi: '축' });
    });

    it('성별 표기가 없는 슬러그는 받지 않는다', () => {
        expect(parseGenderedSlug('쥐띠-소띠')).toBeNull();
        expect(parseGenderedSlug('쥐띠')).toBeNull();
        expect(parseGenderedSlug('쥐띠여자-소띠남자')).toBeNull(); // 남자-여자 순서 고정
    });

    it('144개 조합 전부 슬러그 왕복이 성립한다', () => {
        for (const { maleZhi, femaleZhi } of getAllGenderedPairs()) {
            const slug = buildGenderedSlug(maleZhi, femaleZhi);
            expect(parseGenderedSlug(slug), `${slug} 왕복 실패`).toEqual({ maleZhi, femaleZhi });
        }
        expect(getAllGenderedPairs().length).toBe(144);
    });

    it('점수·합충은 남녀를 바꿔도 동일하다 (대칭 항목)', () => {
        const a = calculateGenderedGunghap('자', '오');
        const b = calculateGenderedGunghap('오', '자');
        expect(a.totalScore).toBe(b.totalScore);
        expect(a.grade).toBe(b.grade);
        expect(a.clashList.length).toBe(b.clashList.length);
    });

    it('주도권 서술은 남녀를 바꾸면 실제로 달라진다 (비대칭 항목)', () => {
        // 자(수) × 오(화): 수극화 — 남자가 쥐띠면 남자가 누르고, 말띠면 여자가 누른다
        const maleJa = calculateGenderedGunghap('자', '오');
        const maleO = calculateGenderedGunghap('오', '자');
        expect(maleJa.leadership).not.toBe(maleO.leadership);
        expect(maleJa.leadership).toContain('쥐띠 남자가 말띠 여자를 누르는');
        expect(maleO.leadership).toContain('쥐띠 여자가 말띠 남자를 누르는');
    });

    it('접근 방식도 음양 배치에 따라 뒤집힌다', () => {
        // 자(양) × 축(음)
        const maleYang = calculateGenderedGunghap('자', '축');
        const maleEum = calculateGenderedGunghap('축', '자');
        expect(maleYang.approach).not.toBe(maleEum.approach);
        expect(maleYang.approach).toContain('남자가 먼저');
        expect(maleEum.approach).toContain('여자가 먼저');
    });

    it('지지 음양이 교대로 배치된다', () => {
        expect(getZhiYinYang('자')).toBe('양');
        expect(getZhiYinYang('축')).toBe('음');
        expect(getZhiYinYang('술')).toBe('양');
        expect(getZhiYinYang('해')).toBe('음');
    });

    it('144개 전부 성별 서술이 비어있지 않다', () => {
        for (const { maleZhi, femaleZhi } of getAllGenderedPairs()) {
            const r = calculateGenderedGunghap(maleZhi, femaleZhi);
            expect(r.leadership.length).toBeGreaterThan(20);
            expect(r.approach.length).toBeGreaterThan(20);
            expect(r.maleView.length).toBeGreaterThan(20);
            expect(r.femaleView.length).toBeGreaterThan(20);
        }
    });
});
