"use client";

import { useSajuStore } from "@/store/useSajuStore";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ManseryeokTable from "@/components/ManseryeokTable";
import OhhaengRadarChart from "@/components/OhhaengRadarChart";
import SajuAccordion from "@/components/SajuAccordion";
import { SavedResult } from "@/store/useSajuStore";

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
  cardBorder: 'rgba(240,234,235,0.10)',
  btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)',
  btnInk: '#FFF0F2',
  btnShadow: '0 6px 30px rgba(216,72,94,0.30)',
  serif: "'Noto Serif KR', serif",
  r: 14,
};

export default function ResultPage() {
  const router = useRouter();
  const { name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown, saveResult, resetInput } = useSajuStore();
  const [result, setResult] = useState<SavedResult['resultData'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSaju = async () => {
      try {
        const res = await fetch("/api/saju", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown }),
        });
        const data = await res.json();
        if (data.success) {
          setResult(data.data);
          saveResult(data.data);
        } else {
          setError(data.error || "분석 중 오류가 발생했습니다.");
        }
      } catch (err) {
        console.error(err);
        setError("네트워크 오류가 발생했습니다.");
      }
    };

    fetchSaju();
  }, [name, gender, calendarType, birthYear, birthMonth, birthDay, birthCity, birthHour, birthMinute, isTimeUnknown, error, saveResult]);

  const handleRestart = () => {
    resetInput();
    router.push("/saju");
  };

  if (error) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ color: C.accentBright, marginBottom: 16 }}>{error}</p>
        <button onClick={handleRestart} style={{ background: C.btnBg, color: C.btnInk, padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>돌아가기</button>
      </div>
    );
  }

  if (!result) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        style={{ position: 'relative', width: 120, height: 120, marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ position: 'absolute', inset: 0, border: `1px dashed ${C.muted}`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: 0, width: 10, height: 10, background: C.accentBright, borderRadius: '50%', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', bottom: 0, width: 10, height: 10, background: C.accent, borderRadius: '50%', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', left: 0, width: 10, height: 10, background: '#A82E42', borderRadius: '50%', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', right: 0, width: 10, height: 10, background: C.accentBright, borderRadius: '50%', filter: 'blur(2px)' }} />
        <div style={{ width: 44, height: 44, background: C.btnBg, borderRadius: '50%', boxShadow: C.btnShadow }} className="animate-pulse" />
      </motion.div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, background: `linear-gradient(135deg, ${C.accentBright}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          사주를 읽는 중...
        </h2>
        <motion.p
          style={{ color: C.sub, fontSize: 14 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          명리학 데이터를 분석하고 있어요
        </motion.p>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 100, color: C.ink, fontFamily: 'Pretendard, -apple-system, sans-serif' }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,9,12,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.lineSoft}`,
        display: 'flex', alignItems: 'center', padding: '14px 20px',
      }}>
        <Link href="/saju" style={{ display: 'flex', padding: 4, color: C.sub, textDecoration: 'none' }}>
          <ArrowLeft size={22} />
        </Link>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: 700, fontSize: 16, color: C.ink }}>
          사주 분석 결과
        </span>
      </header>

      <main style={{ padding: 20 }}>

        {/* 만세력 + 오행 */}
        {result.manseryeok && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: 24 }}>
            <ManseryeokTable
              data={result.manseryeok as any}
              userInfo={{
                name, gender, calendarType,
                birthDate: `${birthYear}년 ${birthMonth}월 ${birthDay}일`,
                birthTime: isTimeUnknown ? "시간 모름" : `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
              }}
            />
            <div style={{ marginTop: 24 }}>
              <OhhaengRadarChart manseryeok={result.manseryeok as any} />
            </div>
          </motion.div>
        )}

        {/* 키워드 + 점수 카드 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            background: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: C.r * 1.2, padding: 24, marginBottom: 24, textAlign: 'center',
          }}
        >
          <div style={{
            width: 56, height: 56, background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Sparkles size={24} color={C.accentBright} />
          </div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{name || ""}님의 올해 키워드는</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, marginBottom: 20, fontFamily: C.serif }}>
            "{result.keyword}"
          </h1>

          <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 20 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 700,
              color: C.accentBright, background: C.accentSoft,
              border: `1px solid ${C.accentBorder}`, padding: '4px 14px',
              borderRadius: 999, marginBottom: 12,
            }}>
              총점 {result.score}점
            </div>
            <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8 }}>
              {result.summary}
            </p>
          </div>
        </motion.div>

        {/* 상세 아코디언 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <SajuAccordion details={result.details} />
        </motion.div>
      </main>

      {/* 하단 CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        padding: '16px 20px 28px',
        background: 'rgba(10,9,12,0.92)', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.lineSoft}`,
      }}>
        <button
          onClick={handleRestart}
          style={{
            width: '100%', padding: '15px 0', borderRadius: C.r,
            background: C.card, border: `1px solid ${C.cardBorder}`,
            color: C.sub, fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          <RefreshCcw size={16} />
          다시 검사하기
        </button>
      </div>
    </div>
  );
}
