import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female' | null;
export type CalendarType = 'solar' | 'lunar';

// 프로필(명부) 관리를 위한 구조
export interface UserProfile {
    id: string; // 고유 ID (timestamp 기반)
    name: string;
    gender: Gender;
    calendarType: CalendarType;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthCity: string;
    birthTimezone?: string; // (추가) 타임존 (ex. "Asia/Seoul", "America/New_York")
    birthLongitude?: number; // (추가) 실제 경도
    birthHour: string;
    birthMinute: string;
    isTimeUnknown: boolean;
    dayGan?: string; // 아바타 표출용 (색상)
    dayZhi?: string; // 아바타 표출용 (동물)
    updatedAt: string; // 최근 불러오거나 저장된 시간
}

export interface SavedResult {
    id: string;
    createdAt: string;
    userInfo: {
        name: string;
        gender: Gender;
        calendarType: CalendarType;
        birthDate: string;
        birthCity: string;
        birthTimezone?: string;
        birthLongitude?: number;
        birthTime: string; // "14:30" 형식의 렌더링용
        isTimeUnknown: boolean;
    };
    resultData: {
        keyword: string;
        score: number;
        summary: string;
        details: { title: string; subtitle?: string; content: string }[];
        manseryeok?: {
            year: any;
            month: any;
            day: any;
            time: any;
        };
    };
}

interface SajuState {
    name: string;
    gender: Gender;
    calendarType: CalendarType;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthCity: string;
    birthTimezone?: string;
    birthLongitude?: number;
    birthHour: string;
    birthMinute: string;
    isTimeUnknown: boolean;
    editingProfileId: string | null; // 현재 수정 중인 프로필 ID (없으면 새 프로필)

    history: SavedResult[];
    profiles: UserProfile[]; // 새로 추가된 프로필 목록

    setName: (name: string) => void;
    setGender: (gender: Gender) => void;
    setCalendarType: (type: CalendarType) => void;
    setBirthDate: (year: string, month: string, day: string) => void;
    setBirthLocationTime: (city: string, hour: string, minute: string, isUnknown: boolean, timezone?: string, longitude?: number) => void;

    // 전체 Input을 특정 프로필 데이터로 덮어씌움 (불러오기)
    loadProfileToInput: (profile: UserProfile) => void;

    // 명부에 프로필 추가 (이미 있으면 업데이트)하고 ID 반환
    saveProfile: () => string | undefined;
    removeProfile: (id: string) => void;

    saveResult: (resultData: SavedResult['resultData']) => string;
    removeResult: (id: string) => void;
    resetInput: () => void;
}

const initialInputState = {
    name: '',
    gender: null as Gender,
    calendarType: 'solar' as CalendarType,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthCity: 'seoul',
    birthTimezone: undefined as string | undefined,
    birthLongitude: undefined as number | undefined,
    birthHour: '',
    birthMinute: '',
    isTimeUnknown: false,
    editingProfileId: null as string | null,
};

import { calculateBazi } from '@/utils/baziCalc';

export const useSajuStore = create<SajuState>()(
    persist(
        (set, get) => ({
            ...initialInputState,
            history: [],
            profiles: [],

            setName: (name) => set({ name }),
            setGender: (gender) => set({ gender }),
            setCalendarType: (calendarType) => set({ calendarType }),
            setBirthDate: (birthYear, birthMonth, birthDay) => set({ birthYear, birthMonth, birthDay }),
            setBirthLocationTime: (birthCity, birthHour, birthMinute, isTimeUnknown, birthTimezone, birthLongitude) => set({ birthCity, birthHour, birthMinute, isTimeUnknown, birthTimezone, birthLongitude }),

            loadProfileToInput: (profile) => set({
                name: profile.name,
                gender: profile.gender,
                calendarType: profile.calendarType,
                birthYear: profile.birthYear,
                birthMonth: profile.birthMonth,
                birthDay: profile.birthDay,
                birthCity: profile.birthCity,
                birthTimezone: profile.birthTimezone,
                birthLongitude: profile.birthLongitude,
                birthHour: profile.birthHour,
                birthMinute: profile.birthMinute,
                isTimeUnknown: profile.isTimeUnknown,
                editingProfileId: profile.id
            }),

            saveProfile: () => {
                const state = get();
                // 정보가 너무 부족하면 저장하지 않음
                if (!state.name || !state.gender || !state.birthYear || !state.birthMonth || !state.birthDay) return;

                const targetId = state.editingProfileId || Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

                let dayGan = "";
                let dayZhi = "";

                try {
                    // 아바타 렌더링에 필요한 일간/일지 데이터를 뽑기 위한 빠른 연산
                    const result = calculateBazi(
                        state.gender, state.calendarType, state.birthYear, state.birthMonth, state.birthDay,
                        state.birthCity, state.birthHour, state.birthMinute, state.isTimeUnknown,
                        state.birthTimezone, state.birthLongitude
                    );
                    if (result?.manseryeok?.day) {
                        dayGan = result.manseryeok.day.gan;
                        dayZhi = result.manseryeok.day.zhi;
                    }
                } catch (e) {
                    console.error("아바타용 사주 일주 추출 실패:", e);
                }

                set((prev) => {
                    const newProfile: UserProfile = {
                        id: targetId,
                        name: state.name,
                        gender: state.gender,
                        calendarType: state.calendarType,
                        birthYear: state.birthYear,
                        birthMonth: state.birthMonth,
                        birthDay: state.birthDay,
                        birthCity: state.birthCity,
                        birthTimezone: state.birthTimezone,
                        birthLongitude: state.birthLongitude,
                        birthHour: state.birthHour,
                        birthMinute: state.birthMinute,
                        isTimeUnknown: state.isTimeUnknown,
                        dayGan,
                        dayZhi,
                        updatedAt: new Date().toISOString()
                    };

                    let newProfiles;
                    if (state.editingProfileId) {
                        // 기존 프로필 수정
                        newProfiles = prev.profiles.map(p => p.id === state.editingProfileId ? newProfile : p);
                    } else {
                        // 새 프로필 추가
                        newProfiles = [newProfile, ...prev.profiles];
                    }

                    return { profiles: newProfiles, editingProfileId: null };
                });
                return targetId;
            },

            removeProfile: (id) => set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id)
            })),

            saveResult: (resultData) => {
                const state = get();
                const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

                const newRecord: SavedResult = {
                    id: newId,
                    createdAt: new Date().toISOString(),
                    userInfo: {
                        name: state.name || '익명',
                        gender: state.gender,
                        calendarType: state.calendarType,
                        birthDate: `${state.birthYear}-${state.birthMonth}-${state.birthDay}`,
                        birthCity: state.birthCity,
                        birthTimezone: state.birthTimezone,
                        birthLongitude: state.birthLongitude,
                        birthTime: state.isTimeUnknown ? '모름' : `${state.birthHour.padStart(2, '0')}:${state.birthMinute.padStart(2, '0')}`,
                        isTimeUnknown: state.isTimeUnknown
                    },
                    resultData
                };

                set((state) => ({ history: [newRecord, ...state.history] }));
                return newId;
            },

            removeResult: (id) => set((state) => ({
                history: state.history.filter((record) => record.id !== id)
            })),

            resetInput: () => set(initialInputState),
        }),
        {
            name: 'saju-storage',
            partialize: (state) => ({ history: state.history, profiles: state.profiles })
        }
    )
);
