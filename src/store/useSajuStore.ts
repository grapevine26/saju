import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female' | null;
export type CalendarType = 'solar' | 'lunar';
export type Tier = 'lite' | 'premium';

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
    birthTimezone?: string;
    birthLongitude?: number;
    birthHour: string;
    birthMinute: string;
    isTimeUnknown: boolean;
    dayGan?: string;
    dayZhi?: string;
    updatedAt: string;
}

// 재회 분석 결과 저장용
export interface ReunionResult {
    id: string;
    createdAt: string;
    tier: Tier;
    myInfo: {
        name: string;
        gender: Gender;
        birthDate: string;
    };
    partnerInfo: {
        name: string;
        gender: Gender;
        birthDate: string;
    };
    myRawInput?: any;
    partnerRawInput?: any;
    premiumJobId?: string; // Inngest 백그라운드 작업 ID (프리미엄 접수 시 저장)
    resultData: any; // API 응답 전체
}

// 기존 SavedResult (호환성 유지)
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
        birthTime: string;
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

// 개인 정보 입력 상태 (나 또는 상대방)
interface PersonInputState {
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
}

interface SajuState {
    // 나의 정보
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
    editingProfileId: string | null;

    // 상대방 정보 (재회 분석용)
    partnerName: string;
    partnerGender: Gender;
    partnerCalendarType: CalendarType;
    partnerBirthYear: string;
    partnerBirthMonth: string;
    partnerBirthDay: string;
    partnerBirthCity: string;
    partnerBirthTimezone?: string;
    partnerBirthLongitude?: number;
    partnerBirthHour: string;
    partnerBirthMinute: string;
    partnerIsTimeUnknown: boolean;

    // 이별 컨텍스트
    metDate: string;           // 만난 날짜 (YYYY-MM)
    breakupDate: string;       // 이별 날짜 (YYYY-MM 또는 YYYY-MM-DD)
    breakupReason: string;     // 이별 이유 또는 현재 고민

    // 현재 선택된 tier
    currentTier: Tier;

    // 데이터 저장
    history: SavedResult[];
    reunionHistory: ReunionResult[];
    profiles: UserProfile[];

    // 나의 정보 세터
    setName: (name: string) => void;
    setGender: (gender: Gender) => void;
    setCalendarType: (type: CalendarType) => void;
    setBirthDate: (year: string, month: string, day: string) => void;
    setBirthLocationTime: (city: string, hour: string, minute: string, isUnknown: boolean, timezone?: string, longitude?: number) => void;

    // 상대방 정보 세터
    setPartnerName: (name: string) => void;
    setPartnerGender: (gender: Gender) => void;
    setPartnerCalendarType: (type: CalendarType) => void;
    setPartnerBirthDate: (year: string, month: string, day: string) => void;
    setPartnerBirthLocationTime: (city: string, hour: string, minute: string, isUnknown: boolean, timezone?: string, longitude?: number) => void;

    // 이별 컨텍스트 세터
    setMetDate: (date: string) => void;
    setBreakupDate: (date: string) => void;
    setBreakupReason: (reason: string) => void;

    // Tier 선택
    setCurrentTier: (tier: Tier) => void;

    // 프로필 관리
    loadProfileToInput: (profile: UserProfile) => void;
    saveProfile: () => string | undefined;
    removeProfile: (id: string) => void;

    // 결과 관리
    saveResult: (resultData: SavedResult['resultData']) => string;
    saveReunionResult: (tier: Tier, resultData: any) => string;
    updateReunionResult: (id: string, tier: Tier, resultData: any) => void;
    setPremiumJobId: (recordId: string, jobId: string) => void;
    removeResult: (id: string) => void;
    removeReunionResult: (id: string) => void;

    // 초기화
    resetInput: () => void;
    resetPartnerInput: () => void;
    resetAll: () => void;
}

const initialBreakupState = {
    metDate: '',
    breakupDate: '',
    breakupReason: '',
};

const initialMyInputState = {
    name: '',
    gender: null as Gender,
    calendarType: 'solar' as CalendarType,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthCity: '',
    birthTimezone: undefined as string | undefined,
    birthLongitude: undefined as number | undefined,
    birthHour: '',
    birthMinute: '',
    isTimeUnknown: false,
    editingProfileId: null as string | null,
};

const initialPartnerInputState = {
    partnerName: '',
    partnerGender: null as Gender,
    partnerCalendarType: 'solar' as CalendarType,
    partnerBirthYear: '',
    partnerBirthMonth: '',
    partnerBirthDay: '',
    partnerBirthCity: '',
    partnerBirthTimezone: undefined as string | undefined,
    partnerBirthLongitude: undefined as number | undefined,
    partnerBirthHour: '',
    partnerBirthMinute: '',
    partnerIsTimeUnknown: true, // 상대방 시간은 기본 모름
};

import { calculateBazi } from '@/utils/baziCalc';

export const useSajuStore = create<SajuState>()(
    persist(
        (set, get) => ({
            ...initialMyInputState,
            ...initialPartnerInputState,
            ...initialBreakupState,
            currentTier: 'lite' as Tier,
            history: [],
            reunionHistory: [],
            profiles: [],

            // 나의 정보 세터
            setName: (name) => set({ name }),
            setGender: (gender) => set({ gender }),
            setCalendarType: (calendarType) => set({ calendarType }),
            setBirthDate: (birthYear, birthMonth, birthDay) => set({ birthYear, birthMonth, birthDay }),
            setBirthLocationTime: (birthCity, birthHour, birthMinute, isTimeUnknown, birthTimezone, birthLongitude) => set({ birthCity, birthHour, birthMinute, isTimeUnknown, birthTimezone, birthLongitude }),

            // 상대방 정보 세터
            setPartnerName: (partnerName) => set({ partnerName }),
            setPartnerGender: (partnerGender) => set({ partnerGender }),
            setPartnerCalendarType: (partnerCalendarType) => set({ partnerCalendarType }),
            setPartnerBirthDate: (partnerBirthYear, partnerBirthMonth, partnerBirthDay) => set({ partnerBirthYear, partnerBirthMonth, partnerBirthDay }),
            setPartnerBirthLocationTime: (partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, partnerBirthTimezone, partnerBirthLongitude) => set({ partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, partnerBirthTimezone, partnerBirthLongitude }),

            // 이별 컨텍스트 세터
            setMetDate: (metDate) => set({ metDate }),
            setBreakupDate: (breakupDate) => set({ breakupDate }),
            setBreakupReason: (breakupReason) => set({ breakupReason }),

            // Tier 선택
            setCurrentTier: (currentTier) => set({ currentTier }),

            // 프로필 관리 (기존 로직 유지)
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
                if (!state.name || !state.gender || !state.birthYear || !state.birthMonth || !state.birthDay) return;

                const targetId = state.editingProfileId || Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

                let dayGan = "";
                let dayZhi = "";

                try {
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
                        newProfiles = prev.profiles.map(p => p.id === state.editingProfileId ? newProfile : p);
                    } else {
                        newProfiles = [newProfile, ...prev.profiles];
                    }

                    return { profiles: newProfiles, editingProfileId: null };
                });
                return targetId;
            },

            removeProfile: (id) => set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id)
            })),

            // 기존 결과 관리 (호환성 유지)
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

            // 재회 분석 결과 저장
            saveReunionResult: (tier, resultData) => {
                const state = get();
                const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

                const newRecord: ReunionResult = {
                    id: newId,
                    createdAt: new Date().toISOString(),
                    tier,
                    myInfo: {
                        name: state.name || '익명',
                        gender: state.gender,
                        birthDate: `${state.birthYear}-${state.birthMonth}-${state.birthDay}`
                    },
                    partnerInfo: {
                        name: state.partnerName || '그 사람',
                        gender: state.partnerGender,
                        birthDate: `${state.partnerBirthYear}-${state.partnerBirthMonth}-${state.partnerBirthDay}`
                    },
                    myRawInput: {
                        name: state.name,
                        gender: state.gender,
                        calendarType: state.calendarType,
                        birthYear: state.birthYear,
                        birthMonth: state.birthMonth,
                        birthDay: state.birthDay,
                        birthCity: state.birthCity,
                        birthHour: state.birthHour,
                        birthMinute: state.birthMinute,
                        isTimeUnknown: state.isTimeUnknown,
                        birthTimezone: state.birthTimezone,
                        birthLongitude: state.birthLongitude,
                    },
                    partnerRawInput: {
                        name: state.partnerName,
                        gender: state.partnerGender,
                        calendarType: state.partnerCalendarType,
                        birthYear: state.partnerBirthYear,
                        birthMonth: state.partnerBirthMonth,
                        birthDay: state.partnerBirthDay,
                        birthCity: state.partnerBirthCity,
                        birthHour: state.partnerBirthHour,
                        birthMinute: state.partnerBirthMinute,
                        isTimeUnknown: state.partnerIsTimeUnknown,
                        birthTimezone: state.partnerBirthTimezone,
                        birthLongitude: state.partnerBirthLongitude,
                    },
                    resultData
                };

                set((prev) => ({ reunionHistory: [newRecord, ...prev.reunionHistory] }));
                return newId;
            },

            updateReunionResult: (id, tier, resultData) => set((state) => ({
                reunionHistory: state.reunionHistory.map(record =>
                    record.id === id ? { ...record, tier, resultData } : record
                )
            })),

            setPremiumJobId: (recordId, jobId) => set((state) => ({
                reunionHistory: state.reunionHistory.map(record =>
                    record.id === recordId ? { ...record, premiumJobId: jobId } : record
                )
            })),

            removeResult: (id) => set((state) => ({
                history: state.history.filter((record) => record.id !== id)
            })),

            removeReunionResult: (id) => set((state) => ({
                reunionHistory: state.reunionHistory.filter((record) => record.id !== id)
            })),

            resetInput: () => set(initialMyInputState),
            resetPartnerInput: () => set(initialPartnerInputState),
            resetAll: () => set({ ...initialMyInputState, ...initialPartnerInputState, ...initialBreakupState }),
        }),
        {
            name: 'saju-storage',
            partialize: (state) => ({
                history: state.history,
                reunionHistory: state.reunionHistory,
                profiles: state.profiles
            })
        }
    )
);
