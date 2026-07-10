// ─────────────────────────────────────────────
// 발급된 리포트 히스토리 (localStorage, 클라이언트 전용)
// ─────────────────────────────────────────────

import { NAMING_HISTORY_KEY } from './constants';
import type { NamingServiceType } from './types';

export interface NamingHistoryEntry {
    jobId: string;
    serviceType: NamingServiceType;
    surname: string;
    /** 감명/개명일 때 현재 이름 (성 제외) */
    currentName?: string;
    createdAt: number;
}

export const SERVICE_TYPE_LABELS: Record<NamingServiceType, string> = {
    newborn: '신생아 작명',
    evaluation: '이름 감명',
    rename: '개명',
};

export function loadNamingHistory(): NamingHistoryEntry[] {
    try {
        const raw = localStorage.getItem(NAMING_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveNamingHistory(entry: NamingHistoryEntry): void {
    try {
        const history = loadNamingHistory().filter(e => e.jobId !== entry.jobId);
        history.unshift(entry);
        localStorage.setItem(NAMING_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch { /* localStorage 미지원 환경은 무시 */ }
}

export function removeNamingHistory(jobId: string): NamingHistoryEntry[] {
    const next = loadNamingHistory().filter(e => e.jobId !== jobId);
    try {
        localStorage.setItem(NAMING_HISTORY_KEY, JSON.stringify(next));
    } catch { /* 무시 */ }
    return next;
}
