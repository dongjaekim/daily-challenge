import { ChallengeForm } from '@/components/challenges/ChallengeForm'
import { ChallengeList } from '@/components/challenges/ChallengeList'
import { ClientChallenges } from '@/components/challenges/ClientChallenges'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ChallengesPageProps {
  params: {
    groupId: string
  }
}

export default async function ChallengesPage({ params }: ChallengesPageProps) {
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    return notFound()
  }

  // clerk_id로 Supabase users 테이블에서 UUID 조회
  const uuid = await getUserUuid(clerkUserId)
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }

  // 그룹 멤버 여부 확인 (이제 uuid 사용)
  const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
  if (!memberArr.length) {
    return notFound()
  }

  // 챌린지 목록 직접 조회
  const challenges = await supabaseDb.select('challenges', { group_id: params.groupId })
  
  // 현재 달의 시작일과 종료일 계산
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  // 각 챌린지에 대한 달성 횟수 계산
  const challengesWithCompletion = await Promise.all(challenges.map(async (challenge) => {
    // 현재 달의 진행 상태 조회 (직접 쿼리 사용)
    const { data: progressData, error } = await supabase
      .from('challenge_progress')
      .select('progress')
      .eq('challenge_id', challenge.id)
      .eq('user_id', uuid)
      .gte('created_at', `${startOfMonth}T00:00:00`)
      .lte('created_at', `${endOfMonth}T23:59:59`)
    
    if (error) {
      console.error('challenge_progress 조회 오류:', error)
      return {
        ...challenge,
        progressSum: 0
      }
    }
    
    // 현재 달에 달성한 progress의 합 계산
    const progressSum = progressData?.reduce((sum, item) => sum + (item.progress || 0), 0) || 0
    
    return {
      ...challenge,
      progressSum: parseFloat(progressSum.toFixed(1)), // 소수점 첫째 자리까지만 표시
      created_by: challenge.created_by
    }
  }))

  // 클라이언트 컴포넌트에 데이터 전달
  return (
    <ClientChallenges
      groupId={params.groupId}
      initialChallenges={challengesWithCompletion}
      userRole={memberArr[0].role}
      currentUserId={uuid}
    />
  )
}

// 페이지 데이터 로딩을 위한 서버 컴포넌트
export async function generateStaticParams() {
  return []
} 