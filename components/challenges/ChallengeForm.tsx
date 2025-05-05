'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

interface Challenge {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

interface ChallengeFormProps {
  groupId: string
  initialData?: {
    title: string
    description: string
  }
  challengeId?: string
  onSuccess?: (challenge: Challenge) => void
  onClose?: () => void
}

export function ChallengeForm({
  groupId,
  initialData,
  challengeId,
  onSuccess,
  onClose,
}: ChallengeFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // 제목 변경 핸들러
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }, [])

  // 설명 변경 핸들러
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
  }, [])

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = challengeId
        ? `/api/groups/${groupId}/challenges/${challengeId}`
        : `/api/groups/${groupId}/challenges`
      const method = challengeId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error('챌린지 생성/수정에 실패했습니다.')
      }

      const challenge = await response.json()

      toast({
        title: '성공',
        description: challengeId
          ? '챌린지가 수정되었습니다.'
          : '챌린지가 생성되었습니다.',
      })

      // 생성/수정 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess(challenge)
      }
      
      // 대화상자 닫기
      if (onClose) {
        onClose()
      }
      
      // 수정인 경우 또는 콜백이 없는 경우에만 페이지 이동
      if (challengeId || (!onSuccess && !onClose)) {
        router.push(`/groups/${groupId}`)
        router.refresh()
      }
      
      // 입력 필드 초기화
      if (!challengeId) {
        setTitle('')
        setDescription('')
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '챌린지 생성/수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [challengeId, description, groupId, onClose, onSuccess, router, title, toast])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          챌린지 제목
        </label>
        <Input
          id="title"
          value={title}
          onChange={handleTitleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          챌린지 설명
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end space-x-2">
        {onClose && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : challengeId ? '수정하기' : '생성하기'}
        </Button>
      </div>
    </form>
  )
} 