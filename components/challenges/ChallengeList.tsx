'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ChallengeForm } from '@/components/challenges/ChallengeForm'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Challenge {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  progressSum?: number
  created_by?: string
}

interface ChallengeListProps {
  groupId: string
  challenges: Challenge[]
  role: 'owner' | 'member'
  currentUserId: string
  onChallengeUpdated?: (updatedChallenge: Challenge) => void
}

export function ChallengeList({ 
  groupId, 
  challenges, 
  role, 
  currentUserId,
  onChallengeUpdated 
}: ChallengeListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // 날짜 형식 변환 헬퍼 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일', { locale: ko });
    } catch (error) {
      console.error('날짜 형식 변환 오류:', error);
      return '날짜 정보 없음';
    }
  };

  const handleDelete = async (challengeId: string) => {
    setIsLoading(challengeId)

    try {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${challengeId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('챌린지 삭제에 실패했습니다.')
      }

      toast({
        title: '성공',
        description: '챌린지가 삭제되었습니다.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: '오류',
        description: '챌린지 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleChallengeUpdated = (updatedChallenge: Challenge) => {
    if (onChallengeUpdated) {
      onChallengeUpdated(updatedChallenge);
    }
    setEditingChallengeId(null);
  };

  // 현재 사용자가 생성한 챌린지만 필터링
  const userChallenges = challenges.filter(
    challenge => challenge.created_by === currentUserId
  );

  return (
    <div className="space-y-4">
      {userChallenges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          등록한 챌린지가 없습니다. 새 챌린지를 생성해보세요!
        </div>
      ) : (
        userChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <h3 className="font-medium">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
              <p className="text-sm text-muted-foreground">
                생성일: {formatDate(challenge.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                이번 달 달성량: {challenge.progressSum || 0}
              </p>
            </div>
            <div className="flex gap-2">
              {(role === 'owner' || challenge.created_by === currentUserId) && (
                <>
                  <Dialog 
                    open={editingChallengeId === challenge.id}
                    onOpenChange={(open) => {
                      if (!open) setEditingChallengeId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setEditingChallengeId(challenge.id)}
                      >
                        수정
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <ChallengeForm
                        groupId={groupId}
                        challengeId={challenge.id}
                        initialData={{
                          title: challenge.title,
                          description: challenge.description || '',
                        }}
                        onSuccess={handleChallengeUpdated}
                        onClose={() => setEditingChallengeId(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(challenge.id)}
                    disabled={isLoading === challenge.id}
                  >
                    {isLoading === challenge.id ? '삭제 중...' : '삭제'}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
} 