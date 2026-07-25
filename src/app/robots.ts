import { MetadataRoute } from 'next'

// 검색 엔진 크롤러를 위한 robots.txt 설정
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // 크롤링 허용 경로 (공개 랜딩)
      allow: ['/', '/saju', '/tarot', '/hap', '/yunmyeong', '/input', '/menu', '/legal/privacy', '/legal/terms', '/legal/refund'],
      // 개인 결과/결제/관리자/API는 크롤링 차단 (네 서비스 하위 경로 포함)
      // 퍼널 단계(입력·미리보기·결제·결과·보관함)가 색인되면 얇은 페이지로 사이트 품질 신호를 깎는다.
      disallow: [
        '/admin', '/api/',
        '/result', '/analysis', '/history', '/profiles', '/payment',
        '/tarot/result', '/tarot/select', '/tarot/payment', '/tarot/history', '/tarot/input',
        '/hap/input', '/hap/preview', '/hap/result', '/hap/payment', '/hap/history',
        '/yunmyeong/analysis', '/yunmyeong/result', '/yunmyeong/payment', '/yunmyeong/history', '/yunmyeong/input',
      ],
    },
    sitemap: 'https://dasisaju.com/sitemap.xml',
  }
}
