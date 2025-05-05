import { authMiddleware } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)', 
    '/sign-up(.*)',
    '/api/env-test',
    '/groups(.*)',
    '/dashboard(.*)',
    '/challenges(.*)'
  ],
  async afterAuth(auth, req, evt) {
    // 인증된 사용자이고 public route가 아닌 경우에만 UUID 조회
    if (auth.userId && !auth.isPublicRoute) {
      try {
        // clerk_id로 users 테이블에서 UUID 조회
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', auth.userId)
          .single()

        if (error) {
          console.error("Error fetching user UUID:", error)
          return
        }

        if (data?.id) {
          // 응답에 UUID를 헤더로 추가 (프론트엔드에서 사용 가능)
          const response = NextResponse.next()
          response.headers.set('x-user-uuid', data.id)
          return response
        }
      } catch (error) {
        console.error("Error in middleware:", error)
      }
    }
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
} 