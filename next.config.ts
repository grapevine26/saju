import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 작명 서비스 리브랜딩: 명담(/naming) → 윤명(/yunmyeong)
      // 구 경로로 들어온 링크(공유·북마크)를 새 경로로 영구 이동
      {
        source: "/naming",
        destination: "/yunmyeong",
        permanent: true,
      },
      {
        source: "/naming/:path*",
        destination: "/yunmyeong/:path*",
        permanent: true,
      },
      // 인스타 오가닉용 짧은 링크 — UTM을 서버에서 부착 (노출되는 주소는 깔끔하게)
      // permanent:false — 나중에 캠페인·목적지를 바꿔도 브라우저에 캐시되지 않도록 307 사용
      // /again: 프로필 바이오 · /free: 릴스 댓글/스토리 — campaign을 나눠 입구별 성과 비교
      {
        source: "/insta",
        destination: "/saju?utm_source=instagram&utm_medium=organic&utm_campaign=bio",
        permanent: false,
      },
      {
        source: "/again",
        destination: "/saju?utm_source=instagram&utm_medium=organic&utm_campaign=bio",
        permanent: false,
      },
      {
        source: "/free",
        destination: "/saju?utm_source=instagram&utm_medium=organic&utm_campaign=comment",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
