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
    ];
  },
};

export default nextConfig;
