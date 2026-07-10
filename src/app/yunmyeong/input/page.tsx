'use client';

import { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NamingInput, NamingServiceType, NamingValue } from '@/features/naming/types';
import { findSurnameVariants } from '@/features/naming/data/surnames';
import { NAMING_INPUT_KEY, NAMING_LITE_RESULT_KEY } from '@/features/naming/constants';
import { MD_MODES, MD_SIJIN, MD_SIJIN_HOUR, MD_VALUES } from '@/features/naming/yunmyeong';
import MdShell from '@/components/naming/yunmyeong/MdShell';

/**
 * 한글 입력 필터
 * - 입력 중에는 자모(ㄱ-ㅎ, ㅏ-ㅣ)도 허용해야 IME 조합이 끊기지 않는다
 *   (완성형만 허용하면 조합 중인 글자가 지워져 한 글자밖에 입력되지 않는 버그 발생)
 * - 제출 시에는 완성형(가-힣)만 남긴다
 */
const filterHangulTyping = (s: string) => s.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
const cleanHangul = (s: string) => s.replace(/[^가-힣]/g, '');

/** 생년월일 8자리(YYYYMMDD) 파싱 — 실존하는 날짜만 통과 */
function parseBirth(raw: string): { y: number; m: number; d: number } | null {
    if (!/^\d{8}$/.test(raw)) return null;
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6));
    const d = Number(raw.slice(6, 8));
    // 출산 예정 신생아 작명을 고려해 내년까지 허용
    if (y < 1900 || y > new Date().getFullYear() + 1) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return { y, m, d };
}

// ─────────────────────────────────────────────
// 윤명 — 단계별 입력 위저드 (원화면 원액션 · hanji 테마)
// 칩 선택 시 280ms 후 자동 다음 스텝, 텍스트 입력은 Enter로 진행.
// 모드별 스텝: 공통 4 + (개명: 현재 이름·고민 / 감명: 검증할 이름) + 가치
// ─────────────────────────────────────────────

type StepId = 'surname' | 'gender' | 'birthdate' | 'birthtime' | 'currentName' | 'candidateName' | 'concern' | 'value' | 'confirm';

function stepsFor(mode: NamingServiceType): StepId[] {
    const steps: StepId[] = ['surname', 'gender', 'birthdate', 'birthtime'];
    if (mode === 'rename') steps.push('currentName', 'concern');
    if (mode === 'evaluation') steps.push('candidateName');
    // 마지막은 입력 내용 최종 확인 — 명시적 버튼을 눌러야 분석이 시작된다
    steps.push('value', 'confirm');
    return steps;
}

interface FormState {
    surname: string;
    /** 동음이성 성씨의 선택 한자 (후보가 1개면 자동) */
    surnameHanja: string | null;
    gender: 'male' | 'female' | null;
    /** 생년월일 8자리 직접 입력 (YYYYMMDD) */
    birthRaw: string;
    /** 시진 인덱스 (null=시간 모름, undefined=미선택) */
    sijin: number | null | undefined;
    currentName: string;
    candidateName: string;
    concern: string;
    value: NamingValue | null;
}

/* ---------- 스텝 공통 셸 ---------- */
function StepShell({
    idx, total, eyebrow, title, sub, children, onBack,
}: {
    idx: number; total: number; eyebrow: string; title: string; sub?: string;
    children: React.ReactNode; onBack: () => void;
}) {
    return (
        <div className="md-screen" key={idx}>
            <header style={{ padding: '20px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                    <button onClick={onBack} aria-label="이전 단계"
                        style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--md-line)', background: 'transparent', color: 'var(--md-text-2)', fontSize: 16, flexShrink: 0, cursor: 'pointer' }}>‹</button>
                    <div className="md-progress" style={{ flex: 1 }}>
                        {Array.from({ length: total }).map((_, i) => <span key={i} className={i <= idx ? 'is-done' : ''}></span>)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--md-text-3)', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}/{total}</span>
                </div>
            </header>
            <div style={{ padding: '36px 24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="md-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
                <h2 className="md-serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.45, textWrap: 'balance' }}>{title}</h2>
                {sub ? <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.65, color: 'var(--md-text-2)' }}>{sub}</p> : null}
                <div style={{ marginTop: 32, flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
            </div>
        </div>
    );
}

function InputWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeParam = searchParams.get('mode') as NamingServiceType | null;
    const mode: NamingServiceType =
        modeParam === 'rename' || modeParam === 'evaluation' ? modeParam : 'newborn';

    const steps = stepsFor(mode);
    const [idx, setIdx] = useState(0);
    const [form, setForm] = useState<FormState>({
        surname: '', surnameHanja: null, gender: null,
        birthRaw: '',
        sijin: undefined, currentName: '', candidateName: '', concern: '', value: null,
    });
    const who = mode === 'newborn' ? '아기' : '본인';
    /** 한글 외 문자 입력 시도 안내 (2.2초 후 자동 소멸) */
    const [hangulWarn, setHangulWarn] = useState(false);
    const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    /** 한글 입력 필드 공용 핸들러 — 허용 외 문자가 걸러지면 안내를 띄운다 */
    const setHangulField = (k: 'surname' | 'currentName' | 'candidateName', raw: string) => {
        const filtered = filterHangulTyping(raw);
        if (raw.length > 0 && filtered !== raw) {
            setHangulWarn(true);
            if (warnTimer.current) clearTimeout(warnTimer.current);
            warnTimer.current = setTimeout(() => setHangulWarn(false), 2200);
        }
        set(k, filtered);
    };

    const submit = (finalForm: FormState) => {
        // 시진 인덱스 → 대표 시각 매핑 (null이면 시간 모름)
        const hour = finalForm.sijin === null || finalForm.sijin === undefined
            ? undefined
            : MD_SIJIN_HOUR[finalForm.sijin];

        // 생년월일은 birthdate 스텝에서 유효성 검증을 통과해야만 진행되므로 항상 파싱된다
        const birth = parseBirth(finalForm.birthRaw);

        const input: NamingInput = {
            serviceType: mode,
            surname: cleanHangul(finalForm.surname),
            surnameHanja: finalForm.surnameHanja || undefined,
            gender: finalForm.gender || 'male',
            calendarType: 'solar', // 위저드 안내 문구 기준 양력 고정
            birthYear: String(birth?.y ?? ''),
            birthMonth: String(birth?.m ?? ''),
            birthDay: String(birth?.d ?? ''),
            birthHour: hour !== undefined ? String(hour) : undefined,
            birthMinute: hour !== undefined ? '0' : undefined,
            isTimeUnknown: hour === undefined,
            // 개명=현재 이름 / 감명=검증할 이름 → 기존 타입의 currentName 필드 재사용
            currentName: mode === 'rename' ? cleanHangul(finalForm.currentName) || undefined
                : mode === 'evaluation' ? cleanHangul(finalForm.candidateName) || undefined
                    : undefined,
            value: finalForm.value || 'modern',
            concern: finalForm.concern || undefined,
        };

        try {
            sessionStorage.setItem(NAMING_INPUT_KEY, JSON.stringify(input));
            sessionStorage.removeItem(NAMING_LITE_RESULT_KEY); // 새 입력이면 캐시 무효화
        } catch { /* sessionStorage 미지원 환경은 분석 페이지에서 리다이렉트 처리 */ }
        router.push('/yunmyeong/analysis');
    };

    /** 확인 화면에서 특정 항목을 수정하러 갔다가 돌아올 위치 (확인 스텝 인덱스) */
    const [returnTo, setReturnTo] = useState<number | null>(null);

    const next = (patched?: Partial<FormState>) => {
        const merged = { ...form, ...patched };
        setHangulWarn(false);
        // 확인 화면에서 수정하러 온 경우 → 수정 완료 시 확인 화면으로 복귀
        if (returnTo !== null) {
            setReturnTo(null);
            setIdx(returnTo);
            return;
        }
        if (idx < steps.length - 1) setIdx(idx + 1);
        else submit(merged);
    };
    const back = () => {
        setHangulWarn(false);
        setReturnTo(null);
        if (idx === 0) router.push('/yunmyeong');
        else setIdx(idx - 1);
    };
    /** 확인 화면 → 해당 항목 스텝으로 점프 (수정 후 next로 복귀) */
    const editStep = (s: StepId) => {
        setReturnTo(idx);
        setIdx(steps.indexOf(s));
    };
    /** 칩 선택 → 280ms 후 자동 진행 */
    const pick = <K extends keyof FormState>(k: K, v: FormState[K]) => {
        set(k, v);
        setTimeout(() => next({ [k]: v } as Partial<FormState>), 280);
    };

    const step = steps[idx];
    const shellProps = { idx, total: steps.length, onBack: back };

    if (step === 'surname') {
        const cleaned = cleanHangul(form.surname);
        const variants = cleaned ? findSurnameVariants(cleaned) : [];
        // 선택한 한자가 있으면 그것, 없으면 대표 한자(첫 항목)
        const selected = variants.find((v) => v.hanja === form.surnameHanja) || variants[0] || null;
        // 사전에 없는 성씨는 여기서 차단 (끝까지 입력시킨 뒤 분석 단계에서 거절하지 않도록)
        const unsupported = cleaned.length > 0 && variants.length === 0;
        // 확인 화면이 form 상태를 직접 읽으므로 선택 한자를 상태에 확정 저장한다
        const goNext = () => {
            if (!selected) return;
            set('surnameHanja', selected.hanja);
            next({ surnameHanja: selected.hanja });
        };
        return (
            <StepShell {...shellProps} eyebrow="성씨" title={`${who}의 성씨를 알려주세요`}
                sub="수리 4격 연산의 기준이 되는 한자 획수를 찾아드립니다">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    <input className="md-input" value={form.surname} maxLength={2} autoFocus
                        placeholder="예) 김"
                        onChange={(e) => { setHangulField('surname', e.target.value); set('surnameHanja', null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && selected) goNext(); }} />
                    {hangulWarn ? (
                        <p style={{ fontSize: 12.5, color: 'var(--md-danger)', animation: 'md-fadeup 0.3s var(--md-ease-smooth) both' }}>
                            성씨는 한글로만 입력할 수 있어요
                        </p>
                    ) : null}

                    {/* 미등록 성씨 안내 */}
                    {unsupported ? (
                        <div style={{
                            border: '1px solid var(--md-line-strong)', borderRadius: 'var(--md-radius-md)',
                            background: 'var(--md-accent-soft)', padding: '14px 16px',
                            animation: 'md-fadeup 0.3s var(--md-ease-smooth) both',
                        }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--md-text)' }}>
                                &lsquo;{cleaned}&rsquo;씨는 아직 등록되지 않은 성씨예요
                            </p>
                            <p style={{ marginTop: 5, fontSize: 12, lineHeight: 1.65, color: 'var(--md-text-2)' }}>
                                정확한 원획수 검증을 거쳐 추가해 드리고 있습니다. 카카오톡 채널로 문의해 주시면 빠르게 등록해 드릴게요.
                            </p>
                        </div>
                    ) : null}

                    {/* 동음이성 성씨: 본관 한자 선택 (정 鄭/丁/程, 조 趙/曺 등) */}
                    {variants.length > 1 ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                            <p style={{ fontSize: 12.5, color: 'var(--md-text-2)' }}>사용하시는 한자를 선택해주세요</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
                                {variants.map((v) => (
                                    <button key={v.hanja}
                                        className={'md-chip' + (selected?.hanja === v.hanja ? ' is-on' : '')}
                                        style={{ flexDirection: 'column', gap: 2, minHeight: 64, padding: '8px 4px' }}
                                        onClick={() => set('surnameHanja', v.hanja)}>
                                        <span className="md-serif" style={{ fontSize: 21, fontWeight: 600 }}>{v.hanja}</span>
                                        <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--md-text-3)' }}>원획 {v.strokes}획</span>
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--md-text-3)' }}>목록에 없는 한자를 쓰신다면 카카오톡 채널로 문의해주세요</p>
                        </div>
                    ) : null}

                    {selected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--md-text-2)' }}>
                            <span className="md-serif" style={{ fontSize: 18, color: 'var(--md-accent)', fontWeight: 600 }}>{selected.hanja}</span>
                            <span>원획 {selected.strokes}획 기준으로 연산합니다</span>
                        </div>
                    ) : null}
                    <div style={{ marginTop: 'auto' }}>
                        {/* 사전에 있는 성씨(=한자 확인됨)일 때만 진행 가능 */}
                        <button className="md-btn" disabled={!selected} onClick={goNext}>다음</button>
                    </div>
                </div>
            </StepShell>
        );
    }

    if (step === 'gender') {
        return (
            <StepShell {...shellProps} eyebrow="성별" title={`${who}의 성별은 무엇인가요?`}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {([['male', '남자'], ['female', '여자']] as const).map(([v, label]) => (
                        <button key={v} className={'md-chip' + (form.gender === v ? ' is-on' : '')}
                            style={{ minHeight: 88, fontSize: 17 }} onClick={() => pick('gender', v)}>{label}</button>
                    ))}
                </div>
            </StepShell>
        );
    }

    if (step === 'birthdate') {
        const birth = parseBirth(form.birthRaw);
        const invalid = form.birthRaw.length === 8 && !birth;
        return (
            <StepShell {...shellProps} eyebrow="생년월일" title={`${who}의 생년월일을 알려주세요`}
                sub="양력 기준 8자리로 입력해주세요">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    <input className="md-input" value={form.birthRaw} maxLength={8} autoFocus
                        inputMode="numeric" pattern="[0-9]*"
                        style={{ textAlign: 'center', letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' }}
                        placeholder={mode === 'newborn' ? '예) 20260611' : '예) 19960611'}
                        onChange={(e) => set('birthRaw', e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && birth) next(); }} />
                    {birth ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--md-text-2)' }}>
                            <span className="md-serif" style={{ fontSize: 16, color: 'var(--md-accent)', fontWeight: 600 }}>✓</span>
                            <span>{birth.y}년 {birth.m}월 {birth.d}일 · 양력 기준으로 연산합니다</span>
                        </div>
                    ) : invalid ? (
                        <p style={{ fontSize: 12.5, color: 'var(--md-danger)' }}>존재하지 않는 날짜예요. 다시 확인해주세요.</p>
                    ) : null}
                    <div style={{ marginTop: 'auto' }}>
                        <button className="md-btn" disabled={!birth} onClick={() => next()}>다음</button>
                    </div>
                </div>
            </StepShell>
        );
    }

    if (step === 'birthtime') {
        return (
            <StepShell {...shellProps} eyebrow="출생 시간" title="태어난 시간을 알려주세요"
                sub="시주(時柱)까지 더하면 명식 정확도가 크게 올라갑니다">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                        {MD_SIJIN.map(([name, range], i) => (
                            <button key={name} className={'md-chip' + (form.sijin === i ? ' is-on' : '')}
                                style={{ flexDirection: 'column', gap: 2, minHeight: 58, padding: '8px 4px' }}
                                onClick={() => pick('sijin', i)}>
                                <span style={{ fontSize: 14.5 }}>{name}</span>
                                <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--md-text-3)' }}>{range}</span>
                            </button>
                        ))}
                    </div>
                    <button className="md-btn md-btn--ghost" onClick={() => pick('sijin', null)}>시간을 모릅니다</button>
                </div>
            </StepShell>
        );
    }

    if (step === 'currentName' || step === 'candidateName') {
        const k = step;
        const isAppraise = step === 'candidateName';
        return (
            <StepShell {...shellProps}
                eyebrow={isAppraise ? '이름 검증' : '현재 이름'}
                title={isAppraise ? '검증하고 싶은 이름을 입력해주세요' : '현재 사용 중인 이름은 무엇인가요?'}
                sub={isAppraise ? '직접 지어두신 이름이 사주와 맞는지 분석합니다' : '성을 제외한 이름만 입력해주세요'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    {/* 이름은 2~4글자까지 허용 (외자·세 글자·네 글자 이름 대응) */}
                    <input className="md-input" value={form[k]} maxLength={4} autoFocus
                        placeholder={isAppraise ? '예) 서윤' : '예) 민수'}
                        onChange={(e) => setHangulField(k, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && cleanHangul(form[k])) next(); }} />
                    {hangulWarn ? (
                        <p style={{ fontSize: 12.5, color: 'var(--md-danger)', animation: 'md-fadeup 0.3s var(--md-ease-smooth) both' }}>
                            이름은 한글로만 입력할 수 있어요
                        </p>
                    ) : null}
                    <div style={{ marginTop: 'auto' }}>
                        <button className="md-btn" disabled={!cleanHangul(form[k])} onClick={() => next()}>다음</button>
                    </div>
                </div>
            </StepShell>
        );
    }

    if (step === 'concern') {
        return (
            <StepShell {...shellProps} eyebrow="지금의 고민" title="요즘 가장 풀리지 않는 고민이 있다면 들려주세요"
                sub="입력하신 고민은 명식 풀이에 그대로 반영됩니다 (선택)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    <textarea className="md-input" rows={4} value={form.concern}
                        style={{ padding: '16px 18px', resize: 'none', lineHeight: 1.6, fontSize: 15, minHeight: 120 }}
                        placeholder="예) 3년 차 직장인인데 이직이 풀리지 않아요"
                        onChange={(e) => set('concern', e.target.value)}></textarea>
                    <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
                        <button className="md-btn" onClick={() => next()}>{form.concern ? '다음' : '건너뛰기'}</button>
                    </div>
                </div>
            </StepShell>
        );
    }

    if (step === 'confirm') {
        const birth = parseBirth(form.birthRaw);
        const cleaned = cleanHangul(form.surname);
        const variants = findSurnameVariants(cleaned);
        const sel = variants.find((v) => v.hanja === form.surnameHanja) || variants[0] || null;
        const modeInfo = MD_MODES.find((m) => m.id === mode);

        const rows: Array<{ step: StepId; label: string; value: string }> = [
            { step: 'surname', label: '성씨', value: sel ? `${cleaned} · ${sel.hanja} ${sel.strokes}획` : cleaned },
            { step: 'gender', label: '성별', value: form.gender === 'female' ? '여자' : '남자' },
            { step: 'birthdate', label: '생년월일', value: birth ? `${birth.y}년 ${birth.m}월 ${birth.d}일 (양력)` : '-' },
            {
                step: 'birthtime', label: '출생 시간',
                value: form.sijin === null || form.sijin === undefined
                    ? '시간 모름'
                    : `${MD_SIJIN[form.sijin][0]} (${MD_SIJIN[form.sijin][1]})`,
            },
            ...(mode === 'rename' ? [
                { step: 'currentName' as StepId, label: '현재 이름', value: cleanHangul(form.currentName) },
                { step: 'concern' as StepId, label: '고민', value: form.concern ? (form.concern.length > 16 ? form.concern.slice(0, 16) + '…' : form.concern) : '입력 안 함' },
            ] : []),
            ...(mode === 'evaluation' ? [
                { step: 'candidateName' as StepId, label: '검증할 이름', value: cleanHangul(form.candidateName) },
            ] : []),
            { step: 'value', label: '중시 가치', value: MD_VALUES.find((v) => v.id === form.value)?.label || '-' },
        ];

        return (
            <StepShell {...shellProps} eyebrow="마지막 확인" title="입력하신 정보를 확인해주세요"
                sub="항목을 누르면 해당 단계로 돌아가 바로 수정할 수 있어요">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    <div className="md-card" style={{ overflow: 'hidden' }}>
                        {/* 의뢰 유형 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 17px', borderBottom: '1px solid var(--md-line)', background: 'var(--md-accent-soft)' }}>
                            <span className="md-serif" aria-hidden="true" style={{ fontSize: 15, fontWeight: 600, color: 'var(--md-accent)' }}>{modeInfo?.glyph}</span>
                            <strong style={{ fontSize: 13.5, fontWeight: 700 }}>{modeInfo?.title} 의뢰</strong>
                        </div>
                        {rows.map((r, i) => (
                            <button key={r.step + r.label} onClick={() => editStep(r.step)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '13px 17px', textAlign: 'left', cursor: 'pointer',
                                    background: 'none', border: 'none', color: 'inherit',
                                    borderBottom: i < rows.length - 1 ? '1px solid var(--md-line)' : 'none',
                                }}>
                                <span style={{ width: 72, flexShrink: 0, fontSize: 12, color: 'var(--md-text-3)' }}>{r.label}</span>
                                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{r.value}</span>
                                <span aria-hidden="true" style={{ color: 'var(--md-text-3)', fontSize: 14 }}>›</span>
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
                        <button className="md-btn" onClick={() => submit(form)}>이 정보로 분석 시작하기</button>
                        <p style={{ fontSize: 11, color: 'var(--md-text-3)', textAlign: 'center' }}>분석이 시작되면 입력 정보를 바꿀 수 없어요</p>
                    </div>
                </div>
            </StepShell>
        );
    }

    if (step === 'value') {
        return (
            <StepShell {...shellProps} eyebrow="마지막 질문"
                title={mode === 'newborn' ? '이름을 지을 때 가장 고려하는 가치는?' : '이름으로 가장 끌어올리고 싶은 가치는?'}
                sub="선택하신 가치를 중심으로 이름의 기운을 배열합니다">
                <div style={{ display: 'grid', gap: 11 }}>
                    {MD_VALUES.map((v) => (
                        <button key={v.id} className={'md-chip' + (form.value === v.id ? ' is-on' : '')}
                            style={{ justifyContent: 'flex-start', minHeight: 60, gap: 14, padding: '10px 18px' }}
                            onClick={() => pick('value', v.id)}>
                            <span aria-hidden="true" style={{ color: 'var(--md-accent)', fontSize: 15 }}>{v.icon}</span>
                            <span style={{ fontSize: 15.5 }}>{v.label}</span>
                        </button>
                    ))}
                </div>
            </StepShell>
        );
    }

    return null;
}

export default function NamingInputPage() {
    return (
        <MdShell theme="hanji">
            <Suspense fallback={null}>
                <InputWizard />
            </Suspense>
        </MdShell>
    );
}
