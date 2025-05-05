import { ChallengeForm } from '@/components/challenges/ChallengeForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'

interface ChallengePageProps {
  params: {
    groupId: string
    challengeId: string
  }
}

export default async function ChallengePage({ params }: ChallengePageProps) {
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

  // 챌린지 정보 직접 조회
  const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId, group_id: params.groupId })
  const challenge = challengeArr[0]

  if (!challenge) {
    return notFound()
  }

  // 클라이언트 컴포넌트에 전달할 데이터 형식 조정
  const formattedChallenge = {
    title: challenge.title,
    description: challenge.description
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{challenge.title}</h1>
        {memberArr[0].role === 'owner' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>수정</Button>
            </DialogTrigger>
            <DialogContent>
              <ChallengeForm
                groupId={params.groupId}
                challengeId={params.challengeId}
                initialData={formattedChallenge}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground">{challenge.description}</p>
      </div>
    </div>
  )
} 