import { describe, it, expect } from 'vitest';
import {
    calculateDdiGunghap, buildSlug, parseSlug, canonicalOrder,
    getAllOrderedPairs, getCanonicalPairs, animalToZhi,
    analyzeJijanggan, getRankedMatches,
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

    it('궁합 순위는 어느 쪽에서 봐도 같은 점수가 나온다 (대칭성)', () => {
        for (const other of ZHI) {
            const fromJa = getRankedMatches('자').find(m => m.zhi === other)!;
            const fromOther = getRankedMatches(other).find(m => m.zhi === '자')!;
            expect(fromJa.score, `자↔${other} 비대칭`).toBe(fromOther.score);
        }
    });
});
