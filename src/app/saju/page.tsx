'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { FileText, AlertTriangle, CalendarHeart, Database, Compass, Route, Heart, Shield, MessageCircle } from 'lucide-react';

/* ── 토큰 ── */
const C = {
  bg: '#0A090C',
  bgHero: 'radial-gradient(ellipse 130% 60% at 50% -5%, #1C1014 0%, #0A090C 68%)',
  card: 'rgba(240,234,235,0.04)',
  cardBorder: 'rgba(240,234,235,0.13)',
  accentBorder: 'rgba(216,72,94,0.35)',
  accentSoft: 'rgba(216,72,94,0.10)',
  accent: '#D8485E',
  accentBright: '#F06A7E',
  ink: '#F0EAEB',
  sub: '#9C9199',
  muted: '#5F565D',
  line: 'rgba(240,234,235,0.13)',
  lineSoft: 'rgba(240,234,235,0.07)',
  btnBg: 'linear-gradient(135deg, #F06A7E 0%, #A82E42 100%)',
  btnInk: '#FFF0F2',
  btnShadow: '0 6px 30px rgba(216,72,94,0.30)',
  serif: "'Noto Serif KR', serif",
  r: 16,
};

const px: React.CSSProperties = { paddingLeft: 20, paddingRight: 20 };
const glassCard = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.card, border: `1px solid ${C.line}`, borderRadius: C.r, ...extra,
});

/* ── 공통 컴포넌트 ── */
function BtnPrimary({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ width: '100%', background: C.btnBg, color: C.btnInk, fontWeight: 700, fontSize: 15.5, padding: '17px 0', borderRadius: C.r, border: 'none', boxShadow: C.btnShadow, cursor: 'pointer', fontFamily: 'inherit', ...style }}>
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 70px', margin: '0', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.line})` }} />
      <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', background: C.accent, opacity: 0.8 }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${C.line})` }} />
    </div>
  );
}

function Badge({ children, color = 'accent' }: { children: React.ReactNode; color?: 'accent' | 'muted' }) {
  const styles = {
    accent: { bg: C.accentSoft, border: C.accentBorder, text: C.accentBright },
    muted:  { bg: 'rgba(240,234,235,0.06)', border: C.lineSoft, text: C.sub },
  };
  const s = styles[color];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 999, background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      {children}
    </span>
  );
}

/* ── 히어로 나비 실 ── */
function ButterflyThread() {
  return (
    <svg width={342} height={165} viewBox="0 0 342 165" fill="none" style={{ filter: 'drop-shadow(0 0 14px rgba(216,72,94,0.45))' }}>
      <path d="M36 0 C36 54 36 78 76 88 C112 97 140 85 162 77" stroke={C.accent} strokeWidth="1.8" fill="none" />
      <path d="M198 72 C220 66 238 64 254 68 C298 84 310 110 311 140" stroke={C.accent} strokeWidth="1.8" fill="none" />
      <g transform="translate(-15 26)" stroke={C.accent} strokeWidth="1.7" fill="rgba(216,72,94,0.1)" strokeLinejoin="round">
        <path d="M193 42 C184 26 168 28 170 38 C171 46 184 48 193 44Z" />
        <path d="M197 42 C206 26 222 28 220 38 C219 46 206 48 197 44Z" />
        <path d="M193 46 C186 56 176 56 177 49 C178 44 186 43 193 45Z" />
        <path d="M197 46 C204 56 214 56 213 49 C212 44 204 43 197 45Z" />
        <line x1="195" y1="40" x2="195" y2="50" stroke={C.accentBright} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M194 39 C191 35 189 33 186 32 M196 39 C199 35 201 33 204 32" stroke={C.accentBright} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      <path d="M311 140 C313 152 320 158 330 159 C336 159 339 155 340 149" stroke={C.accent} strokeWidth="1.5" fill="none" opacity="0.75" />
      <circle cx="76" cy="88" r="5" fill={C.accentBright} />
      <circle cx="76" cy="88" r="11" stroke={C.accent} strokeOpacity="0.4" fill="none" />
      <circle cx="311" cy="140" r="5" fill={C.accentBright} />
      <circle cx="311" cy="140" r="11" stroke={C.accent} strokeOpacity="0.4" fill="none" />
      <text x="58" y="116" fill={C.sub} fontSize="11.5" fontFamily="Pretendard">나</text>
      <text x="290" y="130" fill={C.sub} fontSize="11.5" fontFamily="Pretendard" textAnchor="end">그 사람</text>
    </svg>
  );
}

/* ── 1. 히어로 ── */
function Hero({ onStart }: { onStart: () => void }) {
  const dots = [[20,30],[80,18],[140,55],[220,25],[310,45],[350,15],[55,70],[175,80],[260,68]];
  return (
    <div style={{ background: C.bgHero, position: 'relative', overflow: 'hidden' }}>
      {dots.map(([x,y],i) => (
        <div key={i} style={{ position:'absolute', left:x, top:y, width:1.5+i%2, height:1.5+i%2, borderRadius:'50%', background:C.accentBright, opacity:0.3+i%3*0.15 }} />
      ))}
      <div style={{ ...px, paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative' }}>
        <Link href="/" style={{ fontFamily:C.serif, fontSize:16, fontWeight:700, color:C.ink, textDecoration:'none' }} aria-label="묘연 홈으로">다시, 우리</Link>
        <Link href="/menu" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40 }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0" width="18" height="2" rx="1" fill={C.sub} />
            <rect y="6" width="18" height="2" rx="1" fill={C.sub} />
            <rect y="12" width="18" height="2" rx="1" fill={C.sub} />
          </svg>
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ display:'flex', justifyContent:'center', padding:'12px 0 0', position:'relative' }}
      >
        <ButterflyThread />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{ ...px, paddingTop:20, paddingBottom:40, position:'relative' }}
      >
        <div style={{ marginBottom:16 }}><Badge>사주 기반 재회 타이밍 분석</Badge></div>
        <h1 style={{ fontFamily:C.serif, fontSize:30, lineHeight:1.52, fontWeight:600, margin:'0 0 14px', wordBreak:'keep-all', color:C.ink }}>
          인연이 남아 있다면,<br />실은 끊어지지 않습니다
        </h1>
        <p style={{ fontSize:14, lineHeight:1.85, color:C.sub, margin:'0 0 28px', wordBreak:'keep-all', maxWidth:310 }}>
          느슨해졌을 뿐인지, 정말 끊어졌는지.<br />두 사람의 사주로 실의 끝을 따라가 봅니다.
        </p>
        <BtnPrimary onClick={onStart}>우리 사이의 실 확인하기</BtnPrimary>
        <div style={{ display:'flex', justifyContent:'center', marginTop:12 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:11.5, color:C.sub, border:`1px solid ${C.lineSoft}`, background:'rgba(255,255,255,0.03)', padding:'6px 13px', borderRadius:999 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.accentBright, display:'inline-block', boxShadow:`0 0 8px ${C.accentBright}` }} />
            무료로 시작 · 가입 없이 · 1분이면 결과 확인
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── 2. 골든윈도우 인트로 ── */
function GoldenIntro() {
  return (
    <div style={{ ...px, paddingTop:6, paddingBottom:38 }}>
      <div style={{ ...glassCard(), border:`1px solid ${C.accentBorder}`, padding:'24px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span>📅</span>
          <h2 style={{ fontFamily:C.serif, fontSize:17, fontWeight:700, margin:0, color:C.ink }}>골든 윈도우란?</h2>
        </div>
        <p style={{ fontSize:13.5, lineHeight:1.75, color:C.sub, margin:'0 0 18px', wordBreak:'keep-all' }}>
          상대방의 방어기제가 가장 낮아지고, 나에 대한 그리움이 극대화되는 시기. 같은 연락도 <strong style={{ color:C.accentBright, fontWeight:600 }}>언제 하느냐</strong>에 따라 결과가 달라집니다.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:1, borderRadius:10, overflow:'hidden' }}>
          <div style={{ background:'rgba(255,255,255,0.03)', padding:'13px 16px', display:'flex', gap:12 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.muted, flexShrink:0, width:56 }}>닫힌 시기</span>
            <span style={{ fontSize:13, color:C.sub }}>연락이 집착과 미련으로 보입니다</span>
          </div>
          <div style={{ background:C.accentSoft, padding:'13px 16px', display:'flex', gap:12 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.accent, flexShrink:0, width:56 }}>열린 시기</span>
            <span style={{ fontSize:13, color:C.ink }}>거부감 없이 자연스럽게 대화가 이어집니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 3. 체크리스트 ── */
function Checklist() {
  const items = [
    '카톡을 보낼지 말지 하루에도 백 번씩 고민한다',
    '우리가 왜 헤어진 건지 아직도 납득이 안 간다',
    '이 사람이 아니면 안 될 것 같아 잠이 오지 않는다',
    '관계의 핵심 문제를 객관적으로 알고 싶다',
    '위로보다는 현실적이고 구체적인 조언이 필요하다',
  ];
  return (
    <div style={{ ...px, paddingTop:8, paddingBottom:38 }}>
      <h2 style={{ fontFamily:C.serif, fontSize:21, fontWeight:700, textAlign:'center', margin:'0 0 20px', lineHeight:1.5, color:C.ink }}>
        <span style={{ color:C.accentBright }}>혹시 지금,</span><br />이런 고민 중이신가요?
      </h2>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {items.map((text,i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ ...glassCard(), padding:'15px 18px', display:'flex', alignItems:'center', gap:14 }}
          >
            <div style={{ width:26, height:26, borderRadius:'50%', background:C.accentSoft, border:`1px solid ${C.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.accent }}>{i+1}</span>
            </div>
            <p style={{ fontSize:13, color:C.sub, margin:0, lineHeight:1.6, wordBreak:'keep-all' }}>{text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. WARNING ── */
function Warning() {
  return (
    <div style={{ ...px, paddingTop:6, paddingBottom:38 }}>
      <div style={{ ...glassCard(), border:`1px solid ${C.accentBorder}`, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:0, right:0, background:C.btnBg, color:'#FFF', fontSize:10, fontWeight:800, padding:'5px 12px', borderRadius:`0 0 0 ${C.r}px`, letterSpacing:'0.08em' }}>WARNING</div>
        <div style={{ padding:'24px 22px' }}>
          <h2 style={{ fontFamily:C.serif, fontSize:19, fontWeight:700, margin:'0 0 16px', lineHeight:1.55, wordBreak:'keep-all', color:C.ink }}>
            어떤 이별은 시간이 약이지만,<br />
            <span style={{ color:C.accentBright }}>어떤 이별은 시간이 독입니다</span>
          </h2>
          <div style={{ background:'rgba(0,0,0,0.25)', padding:'15px 17px', borderRadius:10, border:`1px solid ${C.lineSoft}`, marginBottom:14 }}>
            <p style={{ fontSize:13, color:C.sub, margin:0, lineHeight:1.75, wordBreak:'keep-all' }}>
              기다려야 할 때 연락하면 <strong style={{ color:C.ink }}>차단당하고</strong>,<br />
              연락해야 할 때 기다리면 <strong style={{ color:C.ink }}>새 인연이 생깁니다</strong>.
            </p>
          </div>
          <p style={{ fontSize:13, color:C.sub, margin:0, lineHeight:1.75, wordBreak:'keep-all' }}>
            상대의 상태를 모른 채 움직이는 것은 <strong style={{ color:C.accentBright }}>50% 확률의 도박</strong>입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── 5. 수치 ── */
function Stats() {
  return (
    <div style={{ ...px, paddingTop:38, paddingBottom:38 }}>
      <div style={{ display:'flex', gap:9 }}>
        {[['10,000자+','리포트 분량'],['6개월','골든 윈도우 캘린더'],['3단계','재회 전략 로드맵']].map((s,i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{ flex:1, ...glassCard(), padding:'18px 8px', textAlign:'center' }}
          >
            <div style={{ fontFamily:C.serif, fontSize:18, fontWeight:700, color:C.accentBright, marginBottom:6 }}>{s[0]}</div>
            <div style={{ fontSize:10.5, color:C.muted, lineHeight:1.5 }}>{s[1]}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 6. 시스템 ── */
function SystemFeatures() {
  const items: { icon: React.ElementType; iconColor: string; bg: string; title: string; desc: string }[] = [
    { icon: Heart,          iconColor:'#fb7185', bg:'rgba(244,63,94,0.2)',    title:'진짜 이별 이유 심층 분석', desc:'표면적 이유가 아닌 진짜 원인을 해부합니다' },
    { icon: Shield,         iconColor:'#a78bfa', bg:'rgba(129,140,248,0.2)', title:'현재 속마음 & 미련 지수',   desc:'지금 상대방의 마음을 수치로 읽습니다' },
    { icon: CalendarHeart,  iconColor:C.accentBright, bg:C.accentSoft,       title:"연락 최적기 '골든 윈도우'", desc:'다시 연락이 닿는 시기를 알려드립니다' },
    { icon: MessageCircle,  iconColor:'#34d399', bg:'rgba(16,185,129,0.2)',   title:'3단계 재회 장기 로드맵',   desc:'재회까지 닿기 위한 구체적 행동 지침' },
  ];
  return (
    <div style={{ ...px, paddingTop:38, paddingBottom:38 }}>
      <h2 style={{ fontFamily:C.serif, fontSize:21, fontWeight:700, textAlign:'center', margin:'0 0 6px', color:C.ink }}>골든 윈도우 분석 시스템</h2>
      <p style={{ fontSize:12.5, color:C.muted, textAlign:'center', margin:'0 0 20px' }}>두 사람의 사주 데이터를 교차 분석하는 독자적 분석 로직</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map((item,i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{ ...glassCard(), padding:'18px 20px', display:'flex', gap:16, alignItems:'flex-start' }}
          >
            <div style={{ width:42, height:42, borderRadius:12, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <item.icon style={{ width:20, height:20, color:item.iconColor }} />
              </div>
            <div>
              <h3 style={{ fontSize:14.5, fontWeight:700, margin:'0 0 4px', color:C.ink }}>{item.title}</h3>
              <p style={{ fontSize:12.5, color:C.muted, margin:0, lineHeight:1.6, wordBreak:'keep-all' }}>{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 7. 프리미엄 미리보기 ── */
function RadarPreview() {
  const data = [
    { label:'소통', v:0.72 }, { label:'애정 표현', v:0.64 },
    { label:'친밀감', v:0.58 }, { label:'미래', v:0.70 }, { label:'갈등 대처', v:0.66 },
  ];
  const cx = 140, cy = 128, R = 82;
  const pt = (i: number, r: number): [number,number] => {
    const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const grid = [0.33, 0.66, 1].map(s => data.map((_,i) => pt(i, R*s).join(',')).join(' '));
  const poly = data.map((d,i) => pt(i, R*d.v).join(',')).join(' ');
  return (
    <div style={{ background:'rgba(16,12,16,0.85)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:C.r, padding:'22px 14px 18px', marginBottom:14 }}>
      <p style={{ fontFamily:C.serif, fontSize:15, fontWeight:700, color:C.ink, textAlign:'center', margin:'0 0 4px' }}>궁합 정밀 분석 레이더</p>
      <p style={{ fontSize:10.5, fontWeight:700, color:C.accentBright, textAlign:'center', margin:0, letterSpacing:'0.06em' }}>💫 Signature 전용</p>
      <svg width="100%" height="240" viewBox="0 0 280 240">
        <circle cx={cx} cy={cy} r={R*0.55} fill="rgba(216,72,94,0.04)" />
        {grid.map((g,i) => <polygon key={i} points={g} fill="none" stroke={`rgba(216,72,94,${0.07+i*0.06})`} strokeWidth="1" />)}
        {data.map((_,i) => { const [x,y]=pt(i,R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(216,72,94,0.14)" strokeWidth="1" />; })}
        <polygon points={poly} fill="rgba(216,72,94,0.16)" stroke={C.accent} strokeWidth="2" style={{ filter:`drop-shadow(0 0 8px rgba(216,72,94,0.5))` }} />
        {data.map((d,i) => { const [x,y]=pt(i,R*d.v); return <circle key={i} cx={x} cy={y} r="4" fill={C.accentBright} style={{ filter:`drop-shadow(0 0 4px ${C.accentBright})` }} />; })}
        {data.map((d,i) => { const [x,y]=pt(i,R+24); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={C.sub} fontSize="11" fontFamily="Pretendard">{d.label}</text>; })}
      </svg>
    </div>
  );
}

function LockCard({ title, titleIcon, rows, isAccent }: { title: string; titleIcon: React.ReactNode; rows: number[]; isAccent?: boolean }) {
  return (
    <div style={{ background:'rgba(16,12,16,0.85)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:C.r, padding:'18px 20px 24px', marginBottom:14 }}>
      <p style={{ fontSize:13.5, fontWeight:700, margin:'0 0 12px', color:C.ink, display:'flex', alignItems:'center', gap:7 }}>{titleIcon} {title}</p>
      {isAccent && <div style={{ height:1, background:C.accentBorder, marginBottom:14 }} />}
      <div style={{ position:'relative', minHeight:110 }}>
        <div style={{ opacity:0.38, filter:'blur(3.5px)', userSelect:'none', pointerEvents:'none' }}>
          {rows.map((w,i) => <div key={i} style={{ height:8, width:`${w}%`, borderRadius:4, marginBottom:10, background:isAccent && i===0 ? 'rgba(216,72,94,0.7)' : 'rgba(240,234,235,0.18)' }} />)}
        </div>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
          <svg width={isAccent?30:24} height={isAccent?34:28} viewBox="0 0 26 30" fill="none" style={{ filter:`drop-shadow(0 0 ${isAccent?10:8}px ${C.accentBright})` }}>
            <rect x="2" y="13" width="22" height="16" rx="3.5" stroke={C.accentBright} strokeWidth="2" fill="rgba(0,0,0,0.3)" />
            <path d="M6 13V9a7 7 0 0 1 14 0v4" stroke={C.accentBright} strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="13" cy="20" r="2.5" fill={C.accentBright} />
            <line x1="13" y1="22.5" x2="13" y2="26" stroke={C.accentBright} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {!isAccent && <span style={{ fontSize:13, color:C.accentBright, fontWeight:600 }}>프리미엄 해금 후 100% 열람 가능</span>}
        </div>
      </div>
    </div>
  );
}

function PremiumPreview() {
  const stats: { icon: React.ElementType; bg: string; border: string; label: string; value: string; vc: string }[] = [
    { icon: FileText, bg:'rgba(216,72,94,0.13)', border:'rgba(216,72,94,0.28)', label:'텍스트 분량', value:'10,000자 이상', vc:C.accentBright },
    { icon: Database, bg:'rgba(90,70,160,0.15)', border:'rgba(120,100,200,0.30)', label:'분석 챕터', value:'8가지 심층 리포트', vc:'#a48bdf' },
    { icon: Compass, bg:'rgba(180,80,20,0.15)', border:'rgba(220,110,30,0.32)', label:'연락 타이밍', value:'6개월 캘린더', vc:'#e8934a' },
    { icon: Route, bg:'rgba(16,130,100,0.13)', border:'rgba(16,170,120,0.28)', label:'행동 지침', value:'재회 골인 3단계', vc:'#34d399' },
  ];
  return (
    <div style={{ ...px, paddingTop:38, paddingBottom:38 }}>
      <div style={{ textAlign:'center', marginBottom:18 }}>
        <span style={{ display:'inline-flex', fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', padding:'5px 14px', borderRadius:999, background:C.accentSoft, border:`1px solid ${C.accentBorder}`, color:C.accent }}>PREMIUM ONLY</span>
        <h2 style={{ fontFamily:C.serif, fontSize:22, fontWeight:700, margin:'14px 0 6px', color:C.ink }}>어떤 분석을 받아보게 되나요?</h2>
        <p style={{ fontSize:12.5, color:C.muted, margin:0 }}>유료 컨설팅 수준의 압도적인 리포트 퀄리티</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
        {stats.map((s,i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:C.r, padding:'18px 16px 20px' }}
          >
            <s.icon style={{ width:22, height:22, color:s.vc, marginBottom:12 }} />
            <div style={{ fontSize:11.5, color:C.muted, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:14.5, fontWeight:800, color:s.vc, lineHeight:1.3 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>
      <RadarPreview />
      <LockCard title="10,000자 심층 분석 리포트" titleIcon={<FileText style={{color:C.accentBright, width:15, height:15, flexShrink:0}} />} rows={[100,88,95,76]} />
      <LockCard title="절대 하면 안 되는 최악의 실수" titleIcon={<AlertTriangle style={{color:'#f43f5e',width:15,height:15,flexShrink:0}} />} rows={[95,78,100,68,85]} isAccent />
      {/* 캘린더 */}
      <div style={{ background:'rgba(16,12,16,0.85)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:C.r, padding:'20px 18px' }}>
        <p style={{ fontSize:13.5, fontWeight:700, margin:'0 0 16px', color:C.ink, display:'flex', alignItems:'center', gap:7 }}><CalendarHeart style={{color:C.accentBright, width:15, height:15, flexShrink:0}} /> 연락 최적기 캘린더 제공</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:7, marginBottom:8 }}>
          {['일','월','화','수','목','금','토'].map((d,i) => <span key={i} style={{ textAlign:'center', fontSize:9.5, color:C.muted, fontWeight:700 }}>{d}</span>)}
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:7 }}>
            {Array.from({ length:14 }, (_,i) => {
              const hot=[2,10].includes(i); // 화요일(1주차) · 수요일(2주차) — 요일이 겹치지 않게 분산
              return (
                <div key={i} style={{ aspectRatio:'1', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:hot?'rgba(216,72,94,0.22)':'rgba(240,234,235,0.04)', border:hot?`1px solid ${C.accentBorder}`:`1px solid ${C.lineSoft}`, boxShadow:hot?`0 0 12px 2px rgba(216,72,94,0.4)`:'none' }}>
                  {hot ? <span style={{ fontSize:17 }}>🔥</span> : <span style={{ fontSize:11, color:C.muted }}>{i+1}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg, transparent 0%, rgba(16,12,16,0.7) 60%)' }}>
            <svg width="28" height="32" viewBox="0 0 26 30" fill="none" style={{ filter:`drop-shadow(0 0 10px ${C.accentBright})` }}>
              <rect x="2" y="13" width="22" height="16" rx="3.5" stroke={C.accentBright} strokeWidth="2" fill="rgba(0,0,0,0.4)" />
              <path d="M6 13V9a7 7 0 0 1 14 0v4" stroke={C.accentBright} strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="13" cy="20" r="2.5" fill={C.accentBright} />
              <line x1="13" y1="22.5" x2="13" y2="26" stroke={C.accentBright} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 8. 플랜 ── */
function Plans({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ ...px, paddingTop:38, paddingBottom:38 }}>
      <h2 style={{ fontFamily:C.serif, fontSize:21, fontWeight:700, textAlign:'center', margin:'0 0 20px', color:C.ink }}>분석 플랜 선택</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Lite */}
        <div style={{ ...glassCard(), padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <Badge color="muted">Lite</Badge>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'10px 0 0', color:C.ink }}>미리보기 분석</h3>
            </div>
            <span style={{ fontFamily:C.serif, fontSize:22, fontWeight:700, color:C.ink }}>무료</span>
          </div>
          {['재회 가능성 점수','관계 에너지 차트','관계 본질 분석','리포트 첫 섹션'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:9, fontSize:12.5, color:C.sub, padding:'4px 0' }}>
              <span style={{ color:'#6E8BD8', fontWeight:700 }}>✓</span> {f}
            </div>
          ))}
        </div>
        {/* Premium */}
        <div style={{ ...glassCard(), border:`1px solid rgba(216,72,94,0.18)`, padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <span style={{ display:'inline-flex', fontSize:10.5, fontWeight:700, letterSpacing:'0.06em', padding:'4px 11px', borderRadius:999, background:C.accentSoft, color:C.accent }}>Premium</span>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'10px 0 0', color:C.ink }}>재회사주 풀버전</h3>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.accentBright, marginBottom:3, display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}>🔥 런칭 특가</div>
              <div><span style={{ fontFamily:C.serif, fontSize:20, fontWeight:700, color:C.accentBright }}>19,900원</span></div>
            </div>
          </div>
          {['Lite 전체 포함','🎁 8가지 심층 재회 리포트 전체 해금','🎴 상대방 공략 매뉴얼 (금기어·마법 키워드·문자 예시)','📅 골든 윈도우 캘린더 (6개월)','📊 월별 에너지 흐름 분석','📖 3단계 장기 전략 로드맵','📄 소장용 PDF 리포트 다운로드'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:9, fontSize:12.5, color:C.sub, padding:'5px 0', alignItems:'center' }}>
              <span style={{ color:C.accent, fontWeight:700, flexShrink:0 }}>✓</span> {f}
            </div>
          ))}
        </div>
        {/* Signature */}
        <div style={{ ...glassCard(), border:`1px solid rgba(240,106,126,0.45)`, padding:'20px 22px', position:'relative', overflow:'visible', boxShadow:`0 0 12px 1px rgba(216,72,94,0.20), 0 0 26px 3px rgba(216,72,94,0.10)` }}>
          <div style={{ position:'absolute', bottom:0, right:0, background:C.btnBg, color:'#FFF', fontSize:10, fontWeight:800, padding:'5px 13px', borderRadius:`${C.r}px 0 ${C.r}px 0` }}>추천</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <span style={{ display:'inline-flex', fontSize:10.5, fontWeight:700, letterSpacing:'0.06em', padding:'4px 11px', borderRadius:999, background:C.accentSoft, color:C.accentBright }}>Signature</span>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'10px 0 0', color:C.ink }}>재회사주 + 궁합</h3>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.accentBright, marginBottom:3, display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}>🔥 런칭 특가</div>
              <div><span style={{ fontFamily:C.serif, fontSize:20, fontWeight:700, color:C.accentBright }}>34,900원</span></div>
            </div>
          </div>
          {['Premium 전체 포함','📊 5가지 궁합 레이더 차트 (소통·애정·친밀감·미래·갈등)','✂️ 나와 상대방의 성향 비교','💘 커플 유형 진단','📚 11가지 궁합 심층 리포트','🏅 종합 궁합 등급 및 관계 처방전'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:9, fontSize:12.5, color:C.sub, padding:'5px 0', alignItems:'center' }}>
              <span style={{ color:C.accentBright, fontWeight:700, flexShrink:0 }}>✓</span> {f}
            </div>
          ))}
        </div>
        <p style={{ fontSize:11, color:C.muted, textAlign:'center', margin:'4px 4px 0', lineHeight:1.6 }}>
          💡 사주 재회상담 1회 비용은 평균 5만 원<br />리포트는 한 번 결제로 계속 다시 보고, PDF로 소장할 수 있어요
        </p>
        <BtnPrimary onClick={onStart} style={{ marginTop: 8 }}>무료 분석으로 시작하기</BtnPrimary>
        <p style={{ fontSize:11, color:C.muted, textAlign:'center', margin:'2px 0 0' }}>결제는 무료 분석 결과를 확인한 뒤 선택할 수 있어요</p>
      </div>
    </div>
  );
}

/* ── 9. 후기 ── */
function Reviews() {
  const base = [
    { name:'이별3일차', text:'이별 후유증으로 여러 곳 다 돌면서 돈 버렸는데 여기가 제일 잘 맞고 위로가 됐어요.', r:5 },
    { name:'별빛하나', text:'리포트에서 짚어준 날짜에 맞춰 연락했더니 이전과 다르게 반응이 부드러워졌어요. 아직 진행 중이지만 방향이 잡힌 느낌이에요.', r:5 },
    { name:'새출발', text:'재회보다 마음 정리 목적으로 했는데 왜 안 됐는지 객관적으로 알게 되니 새 출발할 힘이 생겼어요.', r:4 },
    { name:'기다리는중', text:'상대가 아직 차갑게 대하는데 리포트 보고 이게 닫힌 시기라는 걸 알고 나서 마음이 좀 편해졌어요. 기다려봅니다.', r:5 },
    { name:'조심스럽게', text:'반신반의하고 했는데 성격 분석이 너무 정확해서 소름 돋았어요. 상대방 대처법도 납득이 가서 따라해보고 있어요.', r:5 },
    { name:'두번째봄', text:'헤어진 지 8개월 됐는데 골든 윈도우 시기에 맞춰서 연락했더니 밥 한번 먹자고 했어요. 믿어볼게요.', r:5 },
  ];
  // 두 벌 복제 → 끝에 닿으면 처음으로 순간 이동해 seamless 루프
  const reviews = [...base, ...base];
  const [paused, setPaused] = React.useState(false);

  return (
    <div style={{ paddingTop:38, paddingBottom:38 }}>
      <div style={{ ...px, textAlign:'center', marginBottom:22 }}>
        <h2 style={{ fontFamily:C.serif, fontSize:21, fontWeight:700, margin:0, lineHeight:1.5, color:C.ink }}>이런 순간을 위해<br />만들었어요</h2>
        <p style={{ fontSize:11.5, color:C.muted, marginTop:8 }}>서비스 이해를 돕기 위한 예시 후기입니다</p>
      </div>
      <div style={{ overflow:'hidden', paddingBottom:6 }}>
        <div
          className={`review-track${paused ? ' paused' : ''}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          style={{ display:'flex', gap:10, width:'max-content', paddingLeft:20 }}
        >
          {reviews.map((rv,i) => (
            <div key={i} style={{ ...glassCard(), padding:'18px 20px', width:270, flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.sub, background:'rgba(0,0,0,0.3)', padding:'4px 10px', borderRadius:7 }}>{rv.name}</span>
                <span style={{ color:C.accentBright, fontSize:11, letterSpacing:2 }}>{'★'.repeat(rv.r)}</span>
              </div>
              <p style={{ fontSize:13, lineHeight:1.7, color:C.sub, margin:0, wordBreak:'keep-all' }}>"{rv.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 10. FAQ ── */
function Faq() {
  const [open, setOpen] = useState<number>(0);
  const faqs = [
    { q: "사주로 정말 재회 가능성을 알 수 있나요?", a: "두 사람의 만세력(사주 원국)에서 나타나는 합·충·형·해 관계와 오행 균형을 데이터로 계산해 재회 가능성을 점수화하고, 향후 6개월 중 두 사람의 기운이 가장 잘 맞물리는 시기(골든 윈도우)를 산출합니다. 같은 정보를 입력하면 항상 같은 결과가 나오는 정통 명리학 기반 연산이며, 리포트는 이 데이터를 어려운 사주 용어 대신 심리·관계의 언어로 풀어 설명해 드립니다. 미래를 보장하는 예언이 아니라, 관계를 새로운 관점에서 이해하고 다가갈 시점을 정하는 참고 자료로 활용해 주세요." },
    { q: "유료 분석은 얼마나 걸리나요?", a: "무료 분석은 즉시 결과가 나오지만, 유료 리포트는 분석 엔진이 두 사람의 사주 데이터를 다각도로 교차 검증하여 심층 리포트를 생성하므로 약 3~5분 정도의 시간이 소요됩니다. 분석 중 창을 닫으셔도 되며, 분석이 완료되면 입력하신 이메일로 결과 링크를 보내드립니다." },
    { q: "상대방 태어난 시간을 몰라도 되나요?", a: "네! 상대방은 생년월일만 알면 충분합니다. 시간을 모를 경우 시주 없이 분석하며, 일간/일지 기반의 핵심 궁합과 에너지 흐름은 매우 정확하게 도출됩니다. 생년월일은 양력·음력 모두 지원합니다." },
    { q: "결과를 나중에 다시 볼 수 있나요?", a: "네. 분석 완료 시 입력하신 이메일로 결과 링크를 보내드리며, 유료 리포트는 결제일로부터 최대 5년간 다시 보실 수 있습니다. 사이트의 분석 기록(보관함)에서도 확인 가능합니다." },
  ];
  return (
    <div style={{ ...px, paddingTop:38, paddingBottom:38 }}>
      {/* FAQPage 구조화 데이터 — 구글 즉답 영역(AEO)·AI 검색(GEO) 노출용 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }) }}
      />
      <h2 style={{ fontFamily:C.serif, fontSize:21, fontWeight:700, textAlign:'center', margin:'0 0 20px', color:C.ink }}>자주 묻는 질문</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {faqs.map((f,i) => (
          <div key={i} style={{ ...glassCard(), overflow:'hidden' }}>
            <button onClick={() => setOpen(open===i ? -1 : i)} style={{ width:'100%', padding:'15px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:13, fontWeight:700, wordBreak:'keep-all', color:C.ink }}><span style={{ color:C.accent, marginRight:8 }}>Q.</span>{f.q}</span>
              <svg width="11" height="7" viewBox="0 0 11 7" style={{ flexShrink:0, transform:open===i?'rotate(180deg)':'none', transition:'0.2s' }}>
                <path d="M1 1l4.5 4.5L10 1" stroke={C.muted} strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {open===i && (
              <div style={{ padding:'0 18px 15px', borderTop:`1px solid ${C.lineSoft}` }}>
                <p style={{ fontSize:12.5, color:C.sub, lineHeight:1.75, margin:'12px 0 0', wordBreak:'keep-all' }}><strong style={{ color:C.accent }}>A.</strong> {f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function LandingPage() {
  const router = useRouter();
  const goInput = () => router.push('/input');

  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, [supabase]);

  useEffect(() => {
    const pendingPayment = localStorage.getItem('pendingOAuthPayment');
    if (pendingPayment) {
      try {
        const data = JSON.parse(pendingPayment);
        if (data.returnPath && data.returnPath !== '/' && (Date.now() - data.timestamp < 10 * 60 * 1000)) {
          window.location.href = data.returnPath;
          return;
        } else if (Date.now() - data.timestamp >= 10 * 60 * 1000) {
          localStorage.removeItem('pendingOAuthPayment');
        }
      } catch (e) {
        console.error(e);
      }
    }

    const handleScroll = () => setShowSticky(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background:C.bg, color:C.ink, fontFamily:'Pretendard, -apple-system, sans-serif', minHeight:'100dvh' }}>
      <Hero onStart={goInput} />
      <Checklist />
      <Warning />
      <Divider />
      <SystemFeatures />
      <GoldenIntro />
      <Divider />
      <PremiumPreview />
      <Divider />
      <Plans onStart={goInput} />
      <Divider />
      <Reviews />
      <Divider />
      <Faq />

      {/* 푸터 */}
      <div style={{ ...px, paddingTop:28, paddingBottom:28, borderTop:`1px solid ${C.lineSoft}`, textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:14, fontSize:12, marginBottom:18 }}>
          <Link href="/legal/terms" style={{ color:C.sub, textDecoration:'none' }}>이용약관</Link>
          <span style={{ color:C.muted }}>|</span>
          <Link href="/legal/privacy" style={{ color:C.sub, textDecoration:'none' }}>개인정보처리방침</Link>
          <span style={{ color:C.muted }}>|</span>
          <Link href="/legal/refund" style={{ color:C.sub, textDecoration:'none' }}>환불정책</Link>
        </div>
        <div style={{ fontSize:11, color:C.muted, lineHeight:1.8 }}>
          <p style={{ fontWeight:700, color:C.sub, margin:'0 0 6px' }}>다시, 우리 (Reconnection)</p>
          <p style={{ margin:0 }}>상호명 : 인사이트랩 | 대표자 : 최혁준</p>
          <p style={{ margin:0 }}>사업자등록번호 : 207-30-92414</p>
          <p style={{ margin:0 }}>통신판매업신고번호 : 제 2026-서울관악-0869호</p>
          <p style={{ margin:0 }}>이메일 : support@dasisaju.com | 전화 : 070-8098-4109</p>
          <p style={{ margin:0 }}>주소 : 서울특별시 관악구 난곡로 284, 603호</p>
          <p style={{ margin:0 }}>호스팅 서비스 제공자 : Vercel Inc.</p>
          <p style={{ margin:'10px 0 0', opacity:0.7 }}>© 2026 인사이트랩. All rights reserved.</p>
        </div>
      </div>

      {/* 스티키 CTA 높이만큼 모바일 전용 하단 여백 */}
      <div className="md:hidden" style={{ height: 80 }} />

      {/* 스티키 CTA — 스크롤 300px 이후 등장, 모바일 전용 */}
      <div className="md:hidden">
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        paddingLeft:20, paddingRight:20, paddingTop:14, paddingBottom:16,
        background:'rgba(10,9,12,0.88)',
        borderTop:`1px solid ${C.line}`,
        backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
        zIndex:50,
        transform: showSticky ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s',
        opacity: showSticky ? 1 : 0,
        pointerEvents: showSticky ? 'auto' : 'none',
      }}>
        <div>
          <p style={{ fontSize:10.5, fontWeight:700, color:C.muted, margin:'0 0 2px' }}>다시 시작할 수 있어요</p>
          <p style={{ fontFamily:C.serif, fontSize:16, fontWeight:700, margin:0, color:C.ink }}>재회 가능성은?</p>
        </div>
        <button onClick={goInput} style={{ background:C.btnBg, color:C.btnInk, fontWeight:700, fontSize:14.5, padding:'13px 22px', borderRadius:C.r*0.85, border:'none', boxShadow:C.btnShadow, flexShrink:0, cursor:'pointer', fontFamily:'inherit' }}>
          시작하기 →
        </button>
      </div>
      </div>
    </div>
  );
}
