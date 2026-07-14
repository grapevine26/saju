"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { ArrowLeft, ChevronRight, Heart, ChevronDown, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import LocationSearch from "./LocationSearch";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const C = {
  bg: '#0A090C',
  accent: '#D8485E',
  accentBright: '#F06A7E',
  accentSoft: 'rgba(216,72,94,0.10)',
  accentBorder: 'rgba(216,72,94,0.35)',
  ink: '#F0EAEB',
  sub: '#9C9199',
  muted: '#5F565D',
  line: 'rgba(240,234,235,0.13)',
  lineSoft: 'rgba(240,234,235,0.07)',
  card: 'rgba(240,234,235,0.04)',
  cardBorder: 'rgba(240,234,235,0.13)',
  btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)',
  btnInk: '#FFF0F2',
  btnShadow: '0 6px 30px rgba(216,72,94,0.30)',
  serif: "'Noto Serif KR', serif",
  r: 14,
};

const inputCls = "w-full bg-transparent outline-none text-base font-medium transition-colors placeholder:text-[#5F565D]";
const fieldBox: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: C.r,
  padding: '14px 16px',
  color: C.ink,
  fontSize: 14,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

export default function DualInputForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const yearRef   = useRef<HTMLInputElement>(null);
  const monthRef  = useRef<HTMLInputElement>(null);
  const dayRef    = useRef<HTMLInputElement>(null);
  const hourRef   = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  const {
    name, setName, gender, setGender,
    calendarType, setCalendarType,
    birthYear, birthMonth, birthDay, setBirthDate,
    birthCity, birthHour, birthMinute, isTimeUnknown, setBirthLocationTime,
  } = useSajuStore();

  const {
    partnerName, setPartnerName, partnerGender, setPartnerGender,
    partnerCalendarType, setPartnerCalendarType,
    partnerBirthYear, partnerBirthMonth, partnerBirthDay, setPartnerBirthDate,
    partnerBirthCity, partnerBirthHour, partnerBirthMinute, partnerIsTimeUnknown, setPartnerBirthLocationTime,
  } = useSajuStore();

  const { metDate, setMetDate, breakupDate, setBreakupDate, breakupReason, setBreakupReason } = useSajuStore();

  const maxYear = new Date().getFullYear();

  // 실시간 표시용 — 필드가 완전히 채워진 경우에만 검사
  const getLiveDateError = (y: string, m: string, d: string): string | null => {
    if (y.length === 4) {
      const year = parseInt(y);
      if (year < 1920 || year > maxYear) return `년도는 1920~${maxYear} 사이로 입력해주세요`;
    }
    if (m.length === 2) {
      const month = parseInt(m);
      if (month < 1 || month > 12) return '월은 1~12 사이로 입력해주세요';
    }
    if (y.length === 4 && m.length === 2 && d.length === 2) {
      const maxDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      if (parseInt(d) < 1 || parseInt(d) > maxDay) return `${parseInt(m)}월은 최대 ${maxDay}일까지 입력 가능해요`;
    }
    return null;
  };

  // 버튼 클릭 시 strict 검사
  const strictDateError = (y: string, m: string, d: string): string | null => {
    const year = parseInt(y), month = parseInt(m), day = parseInt(d);
    if (year < 1920 || year > maxYear) return `년도는 1920~${maxYear} 사이로 입력해주세요`;
    if (month < 1 || month > 12) return '월은 1~12 사이로 입력해주세요';
    const maxDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDay) return `${month}월은 최대 ${maxDay}일까지 입력 가능해요`;
    return null;
  };

  const handleNextStep1 = () => {
    if (name.trim().length < 1) { toast.error("이름을 입력해주세요."); return; }
    if (!gender) { toast.error("성별을 선택해주세요."); return; }
    if (!birthYear || !birthMonth || !birthDay) { toast.error("생년월일을 모두 입력해주세요."); return; }
    const pm = birthMonth.padStart(2, '0');
    const pd = birthDay.padStart(2, '0');
    setBirthDate(birthYear, pm, pd);
    const dateErr = strictDateError(birthYear, pm, pd);
    if (dateErr) { toast.error(dateErr); return; }
    if (!isTimeUnknown && (!birthHour || !birthMinute)) { toast.error("태어난 시와 분을 입력하거나 '모름'을 체크해주세요."); return; }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (partnerName.trim().length < 1) { toast.error("상대방 이름을 입력해주세요."); return; }
    if (!partnerGender) { toast.error("상대방 성별을 선택해주세요."); return; }
    if (!partnerBirthYear || !partnerBirthMonth || !partnerBirthDay) { toast.error("상대방 생년월일을 모두 입력해주세요."); return; }
    const pm = partnerBirthMonth.padStart(2, '0');
    const pd = partnerBirthDay.padStart(2, '0');
    setPartnerBirthDate(partnerBirthYear, pm, pd);
    const dateErr = strictDateError(partnerBirthYear, pm, pd);
    if (dateErr) { toast.error(dateErr); return; }
    setStep(3);
  };

  const handleSubmit = () => {
    // 입력 폼을 거친 명시적 새 분석 요청 표시 — /analysis가 이 플래그를 보면
    // 최근 기록 캐시(같은 이름·생일이면 이전 결제 리포트까지 그대로 로드)를 건너뛰고
    // 새 무료 분석을 돌린다. 새로고침 시에는 플래그가 없으므로 캐시가 정상 동작.
    try { sessionStorage.setItem('saju_fresh_analysis', '1'); } catch {}
    router.push("/analysis");
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{children}</p>
  );

  const renderInputSection = (isPartner: boolean) => {
    const cn = isPartner ? partnerName : name;
    const cg = isPartner ? partnerGender : gender;
    const cct = isPartner ? partnerCalendarType : calendarType;
    const cby = isPartner ? partnerBirthYear : birthYear;
    const cbm = isPartner ? partnerBirthMonth : birthMonth;
    const cbd = isPartner ? partnerBirthDay : birthDay;
    const cbc = isPartner ? partnerBirthCity : birthCity;
    const cbh = isPartner ? partnerBirthHour : birthHour;
    const cbmin = isPartner ? partnerBirthMinute : birthMinute;
    const citu = isPartner ? partnerIsTimeUnknown : isTimeUnknown;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* 이름 */}
        <div>
          <Label>{isPartner ? '상대방' : '나의'} 이름</Label>
          <input
            type="text"
            placeholder={isPartner ? "그 사람의 이름" : "홍길동"}
            value={cn}
            onChange={e => isPartner ? setPartnerName(e.target.value) : setName(e.target.value)}
            style={{ ...fieldBox }}
          />
        </div>

        {/* 성별 */}
        <div>
          <Label>성별</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['male', 'female'] as const).map(g => {
              const active = cg === g;
              const isMale = g === 'male';
              return (
                <button
                  key={g}
                  onClick={() => { isPartner ? setPartnerGender(g) : setGender(g); yearRef.current?.focus(); }}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: C.r, border: active
                      ? `1px solid ${isMale ? 'rgba(99,130,220,0.6)' : C.accentBorder}`
                      : `1px solid ${C.cardBorder}`,
                    background: active
                      ? isMale ? 'rgba(80,110,200,0.15)' : C.accentSoft
                      : C.card,
                    color: active ? (isMale ? '#8BAAF0' : C.accentBright) : C.muted,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >{isMale ? '남자' : '여자'}</button>
              );
            })}
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <Label>생년월일</Label>
          {/* 양력/음력 토글 */}
          <div style={{ display: 'inline-flex', background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 4, marginBottom: 12 }}>
            {(['solar', 'lunar'] as const).map(t => {
              const active = cct === t;
              return (
                <button
                  key={t}
                  onClick={() => isPartner ? setPartnerCalendarType(t) : setCalendarType(t)}
                  style={{
                    padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    background: active ? C.accentSoft : 'transparent',
                    color: active ? C.accentBright : C.muted,
                    border: active ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >{t === 'solar' ? '양력' : '음력'}</button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={yearRef} type="number" placeholder="YYYY" value={cby}
              onChange={e => {
                const v = e.target.value.slice(0, 4);
                isPartner ? setPartnerBirthDate(v, cbm, cbd) : setBirthDate(v, birthMonth, birthDay);
                if (v.length === 4) {
                  const y = parseInt(v);
                  if (y >= 1920 && y <= maxYear) monthRef.current?.focus();
                }
              }}
              style={{ ...fieldBox, width: '50%', textAlign: 'center', borderColor: getLiveDateError(cby, cbm, cbd) ? 'rgba(244,63,94,0.6)' : C.cardBorder }} />
            <input ref={monthRef} type="number" placeholder="MM" value={cbm}
              onChange={e => {
                const v = e.target.value.slice(0, 2);
                isPartner ? setPartnerBirthDate(cby, v, cbd) : setBirthDate(birthYear, v, birthDay);
                if (v.length === 2) {
                  const m = parseInt(v);
                  if (m >= 1 && m <= 12) dayRef.current?.focus();
                }
              }}
              style={{ ...fieldBox, width: '25%', textAlign: 'center', borderColor: getLiveDateError(cby, cbm, cbd) ? 'rgba(244,63,94,0.6)' : C.cardBorder }} />
            <input ref={dayRef} type="number" placeholder="DD" value={cbd}
              onChange={e => {
                const v = e.target.value.slice(0, 2);
                isPartner ? setPartnerBirthDate(cby, cbm, v) : setBirthDate(birthYear, birthMonth, v);
                if (v.length === 2) {
                  const maxDay = new Date(parseInt(cby), parseInt(cbm), 0).getDate();
                  if (parseInt(v) >= 1 && parseInt(v) <= maxDay) {
                    const el = document.querySelector<HTMLInputElement>(`[data-location-input="${isPartner ? 'partner' : 'my'}"]`);
                    el?.focus();
                  }
                }
              }}
              style={{ ...fieldBox, width: '25%', textAlign: 'center', borderColor: getLiveDateError(cby, cbm, cbd) ? 'rgba(244,63,94,0.6)' : C.cardBorder }} />
          </div>
          {getLiveDateError(cby, cbm, cbd) && (
            <p style={{ fontSize: 11.5, color: '#f43f5e', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>⚠</span> {getLiveDateError(cby, cbm, cbd)}
            </p>
          )}
        </div>

        {/* 태어난 시간/지역 */}
        <div>
          <Label>태어난 시간/지역{isPartner && <span style={{ fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>(선택)</span>}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative', zIndex: 30 }}>
              <LocationSearch
                disabled={citu}
                value={cbc}
                dataLocationInput={isPartner ? 'partner' : 'my'}
                onSelect={(cityName, tz, lon) => {
                  if (isPartner) setPartnerBirthLocationTime(cityName, cbh, cbmin, citu, tz, lon);
                  else setBirthLocationTime(cityName, birthHour, birthMinute, isTimeUnknown, tz, lon);
                  setTimeout(() => hourRef.current?.focus(), 100);
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input ref={hourRef} type="number" min="0" max="23" placeholder="시 (0~23)"
                  disabled={citu} value={cbh}
                  onChange={e => { let v = e.target.value; if (parseInt(v) > 23) v = "23"; if (parseInt(v) < 0) v = "0"; isPartner ? setPartnerBirthLocationTime(cbc, v, cbmin, citu) : setBirthLocationTime(birthCity, v, birthMinute, isTimeUnknown); if (v.length === 2) minuteRef.current?.focus(); }}
                  style={{ ...fieldBox, textAlign: 'center', opacity: citu ? 0.3 : 1 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.muted }}>시</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <input ref={minuteRef} type="number" min="0" max="59" placeholder="분 (0~59)"
                  disabled={citu} value={cbmin}
                  onChange={e => { let v = e.target.value; if (parseInt(v) > 59) v = "59"; if (parseInt(v) < 0) v = "0"; isPartner ? setPartnerBirthLocationTime(cbc, cbh, v, citu) : setBirthLocationTime(birthCity, birthHour, v, isTimeUnknown); }}
                  style={{ ...fieldBox, textAlign: 'center', opacity: citu ? 0.3 : 1 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.muted }}>분</span>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, ...fieldBox, cursor: 'pointer' }}>
              <input type="checkbox" checked={citu}
                onChange={e => isPartner ? setPartnerBirthLocationTime(cbc, '', '', e.target.checked) : setBirthLocationTime(birthCity, '', '', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: C.accent, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: C.sub }}>태어난 시간을 모릅니다</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const stepMeta = [
    { label: '나의 정보', sub: '정확할수록 분석이 더 정밀해져요' },
    { label: '상대방 정보', sub: '생년월일만 알아도 충분해요' },
    { label: '이별 이야기', sub: '더 정확한 분석을 위해 알려주세요 (선택)' },
  ];

  return (
    <div style={{ background: '#0A090C', minHeight: '100dvh', color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif', display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,9,12,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.lineSoft}`,
        display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 12,
      }}>
        {step === 1
          ? <Link href="/saju" style={{ display: 'flex', padding: 4, color: C.sub, textDecoration: 'none' }}><ArrowLeft size={22} /></Link>
          : <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} style={{ display: 'flex', padding: 4, background: 'none', border: 'none', color: C.sub, cursor: 'pointer' }}><ArrowLeft size={22} /></button>
        }
        <span style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>정보 입력</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: 28, height: 3, borderRadius: 99, background: step >= s ? C.accent : C.card, transition: 'background 0.3s', boxShadow: step === s ? `0 0 8px ${C.accent}` : 'none' }} />
          ))}
        </div>
      </header>

      {/* 콘텐츠 */}
      <main style={{ flex: 1, padding: '28px 20px 0' }}>
        <AnimatePresence mode="wait">

          {/* Step 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              <StepHeader icon={User} color={C.accentBright} bg={C.accentSoft} border={C.accentBorder} label={stepMeta[0].label} sub={stepMeta[0].sub} />
              {renderInputSection(false)}
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}>
              <StepHeader icon={Heart} color="#fb7185" bg="rgba(244,63,94,0.15)" border="rgba(244,63,94,0.35)" label={stepMeta[1].label} sub={stepMeta[1].sub} />
              {renderInputSection(true)}
            </motion.div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}>
              <StepHeader icon={MessageSquare} color={C.accentBright} bg={C.accentSoft} border={C.accentBorder} label={stepMeta[2].label} sub={stepMeta[2].sub} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* 처음 사귄 날 */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>처음 사귄 날 <span style={{ fontWeight: 400, textTransform: 'none', color: C.muted }}>(선택)</span></p>
                  <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 10 }}>연애가 시작된 시기의 에너지를 분석하는 데 활용돼요</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <CustomSelect
                      value={metDate ? metDate.split('-')[0] : ''}
                      onChange={v => { const m = metDate ? metDate.split('-')[1] : '01'; setMetDate(v ? `${v}-${m}` : ''); }}
                      placeholder="년도 선택"
                      options={Array.from({ length: new Date().getFullYear() - 2010 + 1 }).map((_, i) => { const y = new Date().getFullYear() - i; return { value: String(y), label: `${y}년` }; })}
                    />
                    <CustomSelect
                      value={metDate ? metDate.split('-')[1] : ''}
                      onChange={v => { const y = metDate ? metDate.split('-')[0] : new Date().getFullYear().toString(); setMetDate(v ? `${y}-${v}` : ''); }}
                      placeholder="월 선택"
                      options={Array.from({ length: 12 }).map((_, i) => { const m = String(i + 1).padStart(2, '0'); return { value: m, label: `${m}월` }; })}
                    />
                  </div>
                </div>

                {/* 이별 날짜 */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>언제 헤어졌나요 <span style={{ fontWeight: 400, textTransform: 'none', color: C.muted }}>(선택)</span></p>
                  <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 10 }}>이별 시점의 운의 흐름을 분석하는 데 활용돼요</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <CustomSelect
                      value={breakupDate ? breakupDate.split('-')[0] : ''}
                      onChange={v => { const m = breakupDate ? breakupDate.split('-')[1] : '01'; setBreakupDate(v ? `${v}-${m}` : ''); }}
                      placeholder="년도 선택"
                      options={Array.from({ length: new Date().getFullYear() - 2010 + 1 }).map((_, i) => { const y = new Date().getFullYear() - i; return { value: String(y), label: `${y}년` }; })}
                    />
                    <CustomSelect
                      value={breakupDate ? breakupDate.split('-')[1] : ''}
                      onChange={v => { const y = breakupDate ? breakupDate.split('-')[0] : new Date().getFullYear().toString(); setBreakupDate(v ? `${y}-${v}` : ''); }}
                      placeholder="월 선택"
                      options={Array.from({ length: 12 }).map((_, i) => { const m = String(i + 1).padStart(2, '0'); return { value: m, label: `${m}월` }; })}
                    />
                  </div>
                </div>

                {/* 이별 이유 */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>이별 이유 / 현재 고민 <span style={{ fontWeight: 400, textTransform: 'none', color: C.muted }}>(선택)</span></p>
                  <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 10 }}>구체적으로 쓸수록 분석 정확도가 높아져요</p>
                  <textarea
                    placeholder={"예) 성격 차이로 헤어졌는데 아직 미련이 있어요.\n연락을 시도해봤는데 무반응이에요.\n어떻게 접근하면 좋을까요?"}
                    value={breakupReason}
                    onChange={e => setBreakupReason(e.target.value)}
                    rows={6} maxLength={500}
                    style={{ ...fieldBox, resize: 'none', lineHeight: 1.7 }}
                  />
                  <p style={{ textAlign: 'right', fontSize: 11, color: C.muted, marginTop: 6 }}>{breakupReason.length} / 500자</p>
                </div>

                {/* 안내 */}
                <div style={{ background: C.card, border: `1px solid ${C.lineSoft}`, borderRadius: C.r, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
                  <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.7, margin: 0 }}>입력하신 내용은 리포트 생성에만 사용됩니다. 건너뛰어도 사주 데이터만으로 기본 분석이 가능해요. 자세한 처리 방침은 개인정보처리방침을 참고해 주세요.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 하단 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        padding: '14px 20px 24px',
        background: 'rgba(10,9,12,0.90)', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.lineSoft}`, zIndex: 50,
      }}>
        {step === 1 && (
          <button onClick={handleNextStep1} style={{ width: '100%', background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '17px 0', borderRadius: C.r, border: 'none', boxShadow: C.btnShadow, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            다음: 상대방 정보 입력 <ChevronRight size={18} />
          </button>
        )}
        {step === 2 && (
          <button onClick={handleNextStep2} style={{ width: '100%', background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '17px 0', borderRadius: C.r, border: 'none', boxShadow: C.btnShadow, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            다음: 이별 이야기 입력 <ChevronRight size={18} />
          </button>
        )}
        {step === 3 && (
          <button onClick={handleSubmit} style={{ width: '100%', background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15, padding: '17px 0', borderRadius: C.r, border: 'none', boxShadow: C.btnShadow, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            재회 가능성 분석 시작 <Heart size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && selected && listRef.current) {
      const el = listRef.current.querySelector(`[data-val="${selected.value}"]`) as HTMLElement;
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...fieldBox,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left',
          border: open ? `1px solid ${C.accentBorder}` : `1px solid ${C.cardBorder}`,
          color: selected ? C.ink : C.muted,
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ color: C.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#16101A',
            border: `1px solid ${C.accentBorder}`,
            borderRadius: C.r,
            maxHeight: 220,
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
            scrollbarWidth: 'none',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                data-val={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: isSelected ? C.accentSoft : 'transparent',
                  border: 'none', borderBottom: `1px solid ${C.lineSoft}`,
                  color: isSelected ? C.accentBright : C.sub,
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: 14, textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(240,234,235,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepHeader({ icon: Icon, color, bg, border, label, sub }: { icon: React.ElementType; color: string; bg: string; border: string; label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 3px', color: '#F0EAEB' }}>{label}</h2>
        <p style={{ fontSize: 12, color: '#5F565D', margin: 0 }}>{sub}</p>
      </div>
    </div>
  );
}
