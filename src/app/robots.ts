import { MetadataRoute } from 'next'

// 검색 엔진 크롤러를 위한 robots.txt 설정
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // 크롤링 허용 경로 (공개 랜딩)
      allow: ['/', '/saju', '/tarot', '/yunmyeong', '/input', '/menu', '/legal/privacy', '/legal/terms', '/legal/refund'],
      // 개인 결과/결제/관리자/API는 크롤링 차단 (세 서비스 하위 경로 포함)
      disallow: [
        '/admin', '/api/',
        '/result', '/analysis', '/history', '/profiles', '/payment',
        '/tarot/result', '/tarot/select', '/tarot/payment', '/tarot/history', '/tarot/input',
        '/yunmyeong/analysis', '/yunmyeong/result', '/yunmyeong/payment', '/yunmyeong/history', '/yunmyeong/input',
      ],
    },
    sitemap: 'https://dasisaju.com/sitemap.xml',
  }
}
