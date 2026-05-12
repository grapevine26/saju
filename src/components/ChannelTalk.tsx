'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

declare global {
  interface Window {
    ChannelIO?: any;
    ChannelIOApi?: any;
  }
}

export default function ChannelTalk() {
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const pluginKey = "0a14e464-463f-4011-840c-427fc0a65178";
    const supabase = createClient();

    if (typeof window === 'undefined') return;

    // SDK 로드 함수
    const loadChannelTalk = () => {
      var w = window;
      if (w.ChannelIO) return;
      var ch: any = function () { ch.c(arguments); };
      ch.q = [];
      ch.c = function (args: any) { ch.q.push(args); };
      w.ChannelIO = ch;
      function l() {
        if (w.ChannelIOApi) return;
        var s = document.createElement('script');
        s.type = 'text/javascript'; s.async = true;
        s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
        s.charset = 'UTF-8';
        var x = document.getElementsByTagName('script')[0];
        if (x && x.parentNode) { x.parentNode.insertBefore(s, x); }
      }
      if (document.readyState === 'complete') l();
      else {
        window.addEventListener('DOMContentLoaded', l, false);
        window.addEventListener('load', l, false);
      }
    };

    loadChannelTalk();

    // 부팅 로직
    const bootChannelTalk = (user: any) => {
      const userId = user?.id || 'guest';
      if (lastUserId.current === userId) return;
      lastUserId.current = userId;

      window.ChannelIO('boot', {
        "pluginKey": pluginKey,
        "memberId": user?.id,
        "profile": user ? {
          "name": user.user_metadata?.full_name || user.user_metadata?.name || "회원",
          "email": user.email,
          "mobileNumber": user.user_metadata?.phone_number || ""
        } : undefined
      });
    };

    // 실시간 답장 알림 리스너 (기본 버튼 가시성 제어)
    window.ChannelIO('onBadgeChanged', (unread: number, alert: number) => {
      const totalCount = (unread || 0) + (alert || 0);
      if (totalCount > 0) {
        window.ChannelIO('showChannelButton');
      } else {
        window.ChannelIO('hideChannelButton');
      }
    });

    // 유저 상태 변화 감지 시 부팅 (초기 세션 로드 포함)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      bootChannelTalk(session?.user);
    });

    return () => {
      subscription.unsubscribe();
      window.ChannelIO('shutdown');
      lastUserId.current = null;
    };
  }, []);

  return null;
}
