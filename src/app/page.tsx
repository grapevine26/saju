"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Users } from "lucide-react";
import { useSajuStore } from "@/store/useSajuStore";
import { useEffect, useState } from "react";

export default function Home() {
  const { history, profiles } = useSajuStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isHistoryEmpty = !history || history.length === 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 pb-20 selection:bg-purple-200 relative">

      {isMounted && (
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <div>
            {(!isHistoryEmpty || (profiles && profiles.length > 0)) && (
              <Link href="/profiles">
                <button className="bg-white/80 backdrop-blur border border-slate-200 shadow-sm p-2 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-700">
                  <Users className="w-5 h-5 text-purple-600" />
                </button>
              </Link>
            )}
          </div>
          <div>
            {!isHistoryEmpty && (
              <Link href="/history">
                <button className="bg-white/80 backdrop-blur border border-slate-200 shadow-sm text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-slate-50 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                  내 사주 기록
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 장식용 아이콘 */}
      <div className="mt-12 mb-6">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center shadow-inner relative">
          <Sparkles className="w-10 h-10 text-purple-600" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute top-10 -left-4 w-4 h-4 bg-pink-400 rounded-full animate-bounce"></div>
        </div>
      </div>

      <div className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full mb-3">
        사주팝 오픈 이벤트 🎉
      </div>

      <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-4 whitespace-pre-line leading-[1.3] tracking-tight">
        {"어렵던 내 사주팔자,\n가볍게 팝(POP) 하자!"}
      </h1>

      <p className="text-slate-600 text-center mb-10 text-lg font-medium">
        990원으로 터트려보는 나만의 운세<br />
        사주팝에서 톡톡 튀는 내 미래를 만나보세요.
      </p>

      {/* 후기/소셜 프루프 영역 Mockup */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full mb-12 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-700">100만명 이상이 함께 팝! 했어요 ✨</p>
        </div>
      </div>

      <div className="w-full mt-auto">
        <Link href="/input" className="block w-full">
          <button className="w-full bg-slate-900 active:bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 py-5 rounded-2xl shadow-xl shadow-slate-900/20 transition-transform active:scale-[0.98]">
            사주팝 시작하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
        <p className="text-sm text-center text-slate-500 mt-4 font-medium">
          회원가입 없이 10초면 충분해요
        </p>
      </div>
    </div>
  );
}
