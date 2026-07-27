import { MetadataRoute } from 'next'
import { getCanonicalPairs, buildSlug, buildAnimalSlug, getAllGenderedPairs, buildGenderedSlug } from '@/utils/ddiGunghap'
import { ZHI } from '@/utils/sajuMapper'
import { COLUMNS } from '@/features/guide/columns'

// 다시, 우리 서비스의 사이트맵 동적 생성
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dasisaju.com'

  // 크롤링을 허용할 공개 정적 페이지들
  const routes = [
    '',
    '/saju',
    '/tarot',
    '/hap',
    '/yunmyeong',
    '/input',
    '/menu',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refund',
    '/hap/gunghap',
    '/saju/guide',
  ]

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  // 띠별 단독 페이지 12개 — 궁합 조합 78개의 허브 역할이라 우선순위를 조금 높게 준다
  const ddiEntries: MetadataRoute.Sitemap = ZHI.map((zhi) => ({
    url: `${baseUrl}/hap/ddi/${buildAnimalSlug(zhi)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // 띠 궁합 pSEO 페이지 — 정규 순서 78개만 (역순은 페이지 내부에서 canonical로 리다이렉트)
  const gunghapEntries: MetadataRoute.Sitemap = getCanonicalPairs().map(([z1, z2]) => ({
    url: `${baseUrl}/hap/gunghap/${buildSlug(z1, z2)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  // 남녀 조합 144개 — 같은 두 띠라도 주도권·접근 방식이 뒤집히므로 별도 페이지로 둔다
  const namnyeoEntries: MetadataRoute.Sitemap = getAllGenderedPairs().map(({ maleZhi, femaleZhi }) => ({
    url: `${baseUrl}/hap/namnyeo/${buildGenderedSlug(maleZhi, femaleZhi)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  // 재회 칼럼 — 편수가 적고 전환 기여가 커서 우선순위를 높게 준다
  const guideEntries: MetadataRoute.Sitemap = COLUMNS.map((c) => ({
    url: `${baseUrl}/saju/guide/${c.slug}`,
    lastModified: new Date(c.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticEntries, ...guideEntries, ...ddiEntries, ...gunghapEntries, ...namnyeoEntries]
}
