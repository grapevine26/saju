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
    birthTime: string;
    isTimeUnknown: boolean;
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
        birthTime: string;
        isTimeUnknown: boolean;
    };
    resultData: {
        keyword: string;
        score: number;
        summary: string;
        details: { title: string; content: string }[];
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
    birthTime: string;
    isTimeUnknown: boolean;

    history: SavedResult[];
    profiles: UserProfile[]; // 새로 추가된 프로필 목록

    setName: (name: string) => void;
    setGender: (gender: Gender) => void;
    setCalendarType: (type: CalendarType) => void;
    setBirthDate: (year: string, month: string, day: string) => void;
    setBirthTime: (time: string, isUnknown: boolean) => void;

    // 전체 Input을 특정 프로필 데이터로 덮어씌움 (불러오기)
    loadProfileToInput: (profile: UserProfile) => void;

    // 명부에 프로필 추가 (이미 있으면 업데이트)
    saveProfile: () => void;
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
    birthTime: '',
    isTimeUnknown: false,
};

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
            setBirthTime: (birthTime, isTimeUnknown) => set({ birthTime, isTimeUnknown }),

            loadProfileToInput: (profile) => set({
                name: profile.name,
                gender: profile.gender,
                calendarType: profile.calendarType,
                birthYear: profile.birthYear,
                birthMonth: profile.birthMonth,
                birthDay: profile.birthDay,
                birthTime: profile.birthTime,
                isTimeUnknown: profile.isTimeUnknown
            }),

            saveProfile: () => {
                const state = get();
                // 정보가 너무 부족하면 저장하지 않음
                if (!state.name || !state.gender || !state.birthYear || !state.birthMonth || !state.birthDay) return;

                set((prev) => {
                    // 이름과 생년월일이 같으면 동일인물로 간주하여 업데이트
                    const existingIdx = prev.profiles.findIndex(
                        p => p.name === state.name && p.birthYear === state.birthYear && p.birthMonth === state.birthMonth && p.birthDay === state.birthDay
                    );

                    const newProfile: UserProfile = {
                        id: existingIdx >= 0 ? prev.profiles[existingIdx].id : Date.now().toString(36),
                        name: state.name,
                        gender: state.gender,
                        calendarType: state.calendarType,
                        birthYear: state.birthYear,
                        birthMonth: state.birthMonth,
                        birthDay: state.birthDay,
                        birthTime: state.birthTime,
                        isTimeUnknown: state.isTimeUnknown,
                        updatedAt: new Date().toISOString()
                    };

                    let newProfiles = [...prev.profiles];
                    if (existingIdx >= 0) {
                        newProfiles[existingIdx] = newProfile;
                    } else {
                        newProfiles = [newProfile, ...newProfiles]; // 새 사람은 맨 앞으로
                    }

                    return { profiles: newProfiles };
                });
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
                        birthTime: state.isTimeUnknown ? '모름' : state.birthTime,
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
