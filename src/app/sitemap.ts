import { MetadataRoute } from 'next'

// 다시, 우리 서비스의 사이트맵 동적 생성
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dasisaju.com'
  
  // 크롤링을 허용할 공개 정적 페이지들
  const routes = [
    '',
    '/saju',
    '/tarot',
    '/yunmyeong',
    '/input',
    '/menu',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refund',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))
}
