import { HAP_HISTORY_KEY } from "./constants";

/**
 * 운명의 합 보관함 — 무료 진단도 즉시 기록하고(tier:'free'), 결제되면
 * 같은 항목을 그 자리에서 premium으로 승격한다 (재회사주 Lite→Premium과 동일 원칙).
 * 무료 항목은 서버 잡이 없으므로 resultData에 렌더에 필요한 전부를 인라인으로 담아 둔다.
 */
export interface HapHistoryEntry {
    id: string;
    tier: 'free' | 'premium';
    jobId?: string;
    myName: string;
    partnerName: string;
    totalScore: number | null;
    totalGrade: string | null;
    createdAt: number | null;
    /** 무료 항목 전용 — 서버 재조회 없이 다시 볼 수 있도록 미리보기 데이터 전체를 담는다 */
    resultData?: any;
}

const readHistory = (): HapHistoryEntry[] => {
    try {
        const raw = localStorage.getItem(HAP_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeHistory = (list: HapHistoryEntry[]) => {
    try { localStorage.setItem(HAP_HISTORY_KEY, JSON.stringify(list.slice(0, 50))); } catch {}
};

export const getAllHapHistory = (): HapHistoryEntry[] => readHistory();

export const getHapHistoryEntry = (id: string): HapHistoryEntry | null =>
    readHistory().find(e => e.id === id) || null;

/** 무료 미리보기 저장/갱신 — 같은 id로 다시 부르면 필드를 병합한다 */
export const upsertFreeHapHistory = (id: string, patch: Partial<HapHistoryEntry>): void => {
    const list = readHistory();
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
    } else {
        list.unshift({
            id, tier: 'free', myName: '', partnerName: '',
            totalScore: null, totalGrade: null, createdAt: Date.now(),
            ...patch,
        });
    }
    writeHistory(list);
};

/** 결제 완료 — freeRecordId가 있으면 같은 항목을 premium으로 승격, 없으면 새로 추가 */
export const upgradeToPremium = (
    freeRecordId: string | undefined,
    entry: { jobId: string; myName: string; partnerName: string; totalScore: number | null; totalGrade: string | null }
): void => {
    const list = readHistory();
    const idx = freeRecordId ? list.findIndex(e => e.id === freeRecordId && e.tier === 'free') : -1;
    const upgraded: HapHistoryEntry = {
        id: entry.jobId, tier: 'premium', jobId: entry.jobId,
        myName: entry.myName, partnerName: entry.partnerName,
        totalScore: entry.totalScore, totalGrade: entry.totalGrade,
        createdAt: idx >= 0 ? (list[idx].createdAt || Date.now()) : Date.now(),
    };
    if (idx >= 0) list[idx] = upgraded;
    else list.unshift(upgraded);
    writeHistory(list);
};

export const removeHapHistoryEntry = (id: string): HapHistoryEntry[] => {
    const next = readHistory().filter(e => e.id !== id);
    writeHistory(next);
    return next;
};
