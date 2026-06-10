import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Vercel 프록시 환경에서 호스트명 뒤틀림 방지를 위해 헤더에서 진짜 도메인 추출
  const headerList = await headers()
  const host = headerList.get('host') || headerList.get('x-forwarded-host') || 'www.dasisaju.com'
  const protocol = request.url.startsWith('https') ? 'https' : 'http'
  const origin = `${protocol}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Supabase session exchange error:", error)
    }
  }

  // 오류 발생 시 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/`)
}
