'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  // 로그인된 상태면 모임 목록으로 리다이렉트
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/groups')
    }
  }, [isLoaded, isSignedIn, router])

  // 로딩 중이거나 로그인된 상태면 로딩 표시
  if (!isLoaded || isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">페이지 이동 중...</p>
      </div>
    )
  }

  // 로그인되지 않은 상태면 소개 및 로그인 폼 표시
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-4xl font-bold">챌린지 달성 관리 서비스</h1>
      <p className="text-center text-lg text-muted-foreground">
        개인적인 챌린지를 설정하고 일일 달성 여부를 관리하는 서비스입니다.
        <br />
        모임을 만들어 함께 챌린지를 달성해보세요!
      </p>
      
      <div className="w-full max-w-md mt-8 rounded-lg border p-6 bg-card shadow">
        <Link href="/sign-in" className="w-full">
          <Button size="lg" className="w-full text-lg py-6">시작하기</Button>
        </Link>
      </div>
    </div>
  )
}
