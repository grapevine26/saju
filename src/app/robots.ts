import { MetadataRoute } from 'next'

// 검색 엔진 크롤러를 위한 robots.txt 설정
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // 크롤링 허용 경로
      allow: ['/', '/input', '/menu', '/legal/privacy', '/legal/terms', '/legal/refund'],
      // 개인 정보나 관리자 영역, API 경로는 크롤링 차단
      disallow: ['/admin', '/api/', '/result', '/analysis', '/history', '/profiles', '/payment'],
    },
    sitemap: 'https://dasisaju.com/sitemap.xml',
  }
}
