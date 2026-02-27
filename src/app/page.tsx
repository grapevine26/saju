"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Users, Star, Heart, Coins, Calendar, CheckCircle2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useSajuStore } from "@/store/useSajuStore";
import { useEffect, useState } from "react";

export default function Home() {
  const { history, profiles } = useSajuStore();
  const [isMounted, setIsMounted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isHistoryEmpty = !history || history.length === 0;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    { q: "태어난 시간을 모르면 어쩌나요?", a: "걱정 마세요! 시간을 몰라도 이름, 생년월일만으로도 성격과 핵심 운세는 충분히 정확하게 분석해 드려요." },
    { q: "다른 무료 사주 앱이랑 뭐가 다르죠?", a: "뻔한 '올해는 조심하세요' 식의 텍스트가 아니에요. 1타 사주 마스터가 MZ식 화법으로 읽기 쉽고 뼈 때리는 찐 조언을 해드립니다." },
    { q: "결제는 어떻게 진행되나요?", a: "현재 사주팝 오픈 감사 이벤트로 모든 사주 분석을 990원 상당의 1코인으로 평생 소장하실 수 있습니다." },
  ];

  const reviews = [
    { name: "20대 직장인", text: "이직 고민하다가 그냥 재미로 봤는데, 제 성격 단점 짚어낼 때 소름 돋았어요 ㅋㅋㅋ", rating: 5 },
    { name: "30대 프리랜서", text: "990원에 이 퀄리티 실화인가요;; 다른데서 5만원 주고 본 것보다 훨씬 와닿네요.", rating: 5 },
    { name: "취준생", text: "올해 하반기 운세 보고 용기 내서 면접 봤는데 진짜 합격했습니다ㅠㅠ 사주팝 흥해라!", rating: 4 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-purple-200">

      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-12 px-6 overflow-hidden bg-gradient-to-b from-purple-50 to-slate-50">
        {/* Background Blur Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-yellow-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        {/* Top Navigation / Status */}
        {isMounted && (
          <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
            <div>
              {(!isHistoryEmpty || (profiles && profiles.length > 0)) && (
                <Link href="/profiles">
                  <button className="bg-white/80 backdrop-blur border border-purple-100 shadow-sm p-2.5 rounded-full flex items-center justify-center hover:bg-white transition-colors text-slate-700">
                    <Users className="w-5 h-5 text-purple-600" />
                  </button>
                </Link>
              )}
            </div>
            <div>
              {!isHistoryEmpty && (
                <Link href="/history">
                  <button className="bg-white/80 backdrop-blur border border-purple-100 shadow-sm text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-white transition-colors">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                    내 사주 기록
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center mt-10">
          <div className="mb-6 relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <Sparkles className="w-12 h-12 text-purple-600" />
              <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full animate-bounce shadow-sm"></div>
              <div className="absolute bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-150 shadow-sm"></div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full mb-5 shadow-sm">
            <Sparkles className="w-3 h-3" />
            사주팝 그랜드 오픈 이벤트
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-5 whitespace-pre-line leading-[1.25] tracking-tight">
            {"어렵던 내 사주팔자,\n가볍게 팝(POP) 하자!"}
          </h1>

          <p className="text-slate-600 text-[17px] mb-8 font-medium leading-[1.6]">
            단돈 <span className="font-bold text-purple-600 bg-purple-100 px-1.5 rounded">990원</span>으로 터트려보는 나만의 운세<br />
            사주팝에서 톡톡 튀는 내 미래를 만나보세요.
          </p>

          <Link href="/input" className="w-full max-w-sm hidden sm:block">
            <button className="w-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center gap-2 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] transition-transform active:scale-[0.98]">
              지금 내 사주 보러가기
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-sm text-slate-500 mt-3 font-medium hidden sm:block">✨ 회원가입 없이 10초면 충분해요</p>
        </div>
      </section>

      {/* 2. Social Proof */}
      <section className="px-6 py-8 bg-white border-y border-slate-100">
        <div className="max-w-sm mx-auto flex justify-between items-center text-center divide-x divide-slate-100">
          <div className="flex-1 px-2">
            <div className="text-2xl font-black text-slate-800 mb-1">100만+</div>
            <div className="text-xs font-medium text-slate-500">누적 팝! 사용자</div>
          </div>
          <div className="flex-1 px-2">
            <div className="text-2xl font-black text-slate-800 mb-1 flex items-center justify-center gap-1">
              4.9<Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mb-1" />
            </div>
            <div className="text-xs font-medium text-slate-500">평균 만족도</div>
          </div>
          <div className="flex-1 px-2">
            <div className="text-2xl font-black text-slate-800 mb-1">82%</div>
            <div className="text-xs font-medium text-slate-500">재이용률</div>
          </div>
        </div>
      </section>

      {/* 3. Services Grid */}
      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2 text-center">어떤 운세가 궁금하세요?</h2>
          <p className="text-slate-500 text-sm text-center mb-8 font-medium">한 번의 결제로 이 모든 걸 다 알려드려요</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">나의 진짜 성격</h3>
              <p className="text-xs text-slate-500 font-medium whitespace-pre-line">{"남들이 모르는\n본질적인 내 모습"}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">타고난 재물운</h3>
              <p className="text-xs text-slate-500 font-medium whitespace-pre-line">{"내 인생의\n재물 그릇 크기"}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">소름돋는 애정운</h3>
              <p className="text-xs text-slate-500 font-medium whitespace-pre-line">{"나와 찰떡궁합\n인연은 언제?"}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">올해의 핵심운</h3>
              <p className="text-xs text-slate-500 font-medium whitespace-pre-line">{"2026년, 내가\n조심해야 할 것"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-8 text-center">사주팝은 좀 다릅니다 😼</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mt-1">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">어려운 한자어는 쏙 뺐어요</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  비견? 겁재? 어려운 명리학 용어 대신,<br />친한 친구가 말해주듯 쉽게 풀어드려요.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mt-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">소름 돋는 압도적 디테일</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  한국 표준 만세력을 사용하여 오차율 제로. 12신살, 지장간까지 꼼꼼히 체크하여 분석합니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mt-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">1타 마스터의 맞춤 리포트</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  단순 복붙 결과가 아닙니다. 내 사주팔자를 조합해 세상에 하나뿐인 톡톡 튀는 맞춤형 리포트를 즉시 생성해요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. User Reviews */}
      <section className="px-6 py-14 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold mb-2 text-center text-white">생생한 팝! 후기 💬</h2>
          <p className="text-slate-400 text-sm text-center mb-8 font-medium">매일매일 쏟아지는 극찬 릴레이</p>

          <div className="space-y-4">
            {reviews.map((review, i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur border border-slate-700 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-slate-400 text-xs font-medium ml-1">{review.name}</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">&ldquo;{review.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="px-6 py-14 bg-slate-50 pb-36">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-8 text-center">자주 묻는 질문 🤔</h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden transition-all duration-200">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-slate-800 focus:outline-none"
                >
                  <span className="text-sm pr-4"><span className="text-purple-600 mr-2">Q.</span>{faq.q}</span>
                  {openFaqIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaqIndex === i && (
                  <div className="px-4 pb-4 pt-1 text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/50 border-t border-slate-100">
                    <span className="text-pink-500 font-bold mr-2">A.</span>{faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Sticky Bottom CTA (Mobile optimized) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 animate-fade-in-up md:hidden">
        <div className="max-w-sm mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 mb-0.5">지금 바로 내 운명 확인하기</p>
            <p className="text-lg font-black text-slate-800">단돈 990원 🪙</p>
          </div>
          <Link href="/input" className="flex-none">
            <button className="bg-slate-900 text-white font-bold text-base flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl shadow-lg transition-transform active:scale-[0.98]">
              시작하기
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
