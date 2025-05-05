'use client'

import { ChallengeForm } from '@/components/challenges/ChallengeForm'
import { ChallengeList } from '@/components/challenges/ChallengeList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useState, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  progressSum?: number
  created_by?: string
}

interface ClientChallengesProps {
  groupId: string
  initialChallenges: Challenge[]
  userRole: 'owner' | 'member'
  currentUserId: string
}

export function ClientChallenges({ 
  groupId, 
  initialChallenges,
  userRole,
  currentUserId
}: ClientChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // 새 챌린지 추가 (useCallback으로 메모이제이션)
  const handleChallengeCreated = useCallback((challenge: Challenge) => {
    // 새 챌린지에 달성 횟수 0 추가
    const newChallenge = {
      ...challenge,
      progressSum: 0,
      created_by: currentUserId
    };
    setChallenges((prev) => [newChallenge, ...prev])
    setIsOpen(false)
  }, [currentUserId])

  // 챌린지 업데이트 (useCallback으로 메모이제이션)
  const handleChallengeUpdated = useCallback((updatedChallenge: Challenge) => {
    setChallenges((prev) => 
      prev.map(challenge => 
        challenge.id === updatedChallenge.id 
          ? { ...challenge, ...updatedChallenge } 
          : challenge
      )
    );
    toast({
      title: '성공',
      description: '챌린지가 업데이트되었습니다.',
    });
  }, [toast])

  // 사용자의 챌린지 필터링 (useMemo로 메모이제이션)
  const userChallenges = useMemo(() => 
    challenges.filter(
      challenge => challenge.created_by === currentUserId
    ), 
    [challenges, currentUserId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`/groups/${groupId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">챌린지 목록</h1>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>새 챌린지 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <ChallengeForm 
              groupId={groupId}
              onSuccess={handleChallengeCreated}
              onClose={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <ChallengeList
        groupId={groupId}
        challenges={challenges}
        role={userRole}
        currentUserId={currentUserId}
        onChallengeUpdated={handleChallengeUpdated}
      />
    </div>
  )
} 