import { describe, it, expect } from 'vitest';
import {
    calculateDdiGunghap, buildSlug, parseSlug, canonicalOrder,
    getAllOrderedPairs, getCanonicalPairs, animalToZhi,
} from '../ddiGunghap';

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
