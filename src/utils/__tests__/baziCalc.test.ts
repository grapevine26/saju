import { describe, it, expect } from 'vitest';
import { calculateBazi } from '../baziCalc';

describe('Bazi Calculation Logic (baziCalc)', () => {
  
  // Case 1: 1990년 1월 1일 10시 0분 서울생 (양력)
  // 서울은 표준시 대비 -32분 보정됨 (동경 127도) -> 실제 계산 시간 09:28분
  it('should correctly calculate pillars for 1990-01-01 10:00 Solar (Seoul)', () => {
    const result = calculateBazi(
      'male',
      'solar',
      '1990',
      '01',
      '01',
      'seoul',
      '10',
      '00',
      false
    );

    // 己巳(기사)년 丙子(병자)월 丙寅(병인)일 癸巳(계사)시 검증
    expect(result.manseryeok.year.gan).toBe('기');
    expect(result.manseryeok.year.zhi).toBe('사');
    
    expect(result.manseryeok.month.gan).toBe('병');
    expect(result.manseryeok.month.zhi).toBe('자');
    
    expect(result.manseryeok.day.gan).toBe('병');
    expect(result.manseryeok.day.zhi).toBe('인');
    
    // 시주(Time Pillar): 丙寅일 09:28분은 癸巳(계사)시임
    expect(result.manseryeok.time?.gan).toBe('계');
    expect(result.manseryeok.time?.zhi).toBe('사');
  });

  // Case 2: 음력 생일 처리 검증 (1985년 음력 5월 5일 12시 0분)
  // 양력 변환 시 1985-06-22 11:28 (서울 보정)
  it('should correctly handle lunar birth date (1985-05-05 Lunar)', () => {
    const result = calculateBazi(
      'female',
      'lunar',
      '1985',
      '05',
      '05',
      'seoul',
      '12',
      '00',
      false
    );

    // 乙丑(을축)년 壬午(임오)월 壬辰(임진)일 丙午(병오)시
    expect(result.manseryeok.year.gan).toBe('을');
    expect(result.manseryeok.year.zhi).toBe('축');
    
    expect(result.manseryeok.day.gan).toBe('임');
    expect(result.manseryeok.day.zhi).toBe('진');
  });

  // Case 3: 시차 보정에 따른 일주 변화 테스트
  // 1990년 1월 1일 00:10분 서울생 (보정 전 1일 병인일, 보정 후(-32분) 전날 31일 을축일)
  it('should correctly apply city timezone offset (Seoul -32m)', () => {
    const result = calculateBazi(
      'male',
      'solar',
      '1990',
      '01',
      '01',
      'seoul',
      '00',
      '10',
      false
    );

    // 00:10분에서 32분을 빼면 전날 23:38분이 됨. 따라서 일주가 '병인'이 아닌 전날 '을축'이어야 함.
    expect(result.manseryeok.day.gan).toBe('을');
    expect(result.manseryeok.day.zhi).toBe('축');
  });

  // Case 4: 대운수 계산 검증
  it('should calculate correct Daeun number', () => {
    const result = calculateBazi(
      'male',
      'solar',
      '1990',
      '01',
      '01',
      'seoul',
      '10',
      '00',
      false
    );

    // 1990-01-01 남자의 대운수는 8임
    expect(result.daeunStr).toContain('대운수: 8');
  });

});
