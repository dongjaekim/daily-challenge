'use client'

import { Button } from '@/components/ui/button'
import { EditGroupButton } from '@/components/groups/EditGroupButton'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface IGroup {
  id: string
  name: string
  description: string | null
  memberCount: number
  role: 'owner' | 'member'
}

interface IGroupListProps {
  groups: IGroup[]
  onGroupDeleted?: (groupId: string) => void
  onGroupUpdated?: (newGroup: any) => void
}

export function GroupList({ groups, onGroupDeleted, onGroupUpdated }: IGroupListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 이벤트 버블링 방지
    setIsLoading(groupId)

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('모임 삭제에 실패했습니다.')
      }

      toast({
        title: '성공',
        description: '모임이 삭제되었습니다.',
      })

      if (onGroupDeleted) {
        onGroupDeleted(groupId)
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '모임 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`)
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => handleGroupClick(group.id)}
        >
          <div>
            <h3 className="font-medium">{group.name}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
            <p className="text-sm text-muted-foreground">
              멤버 수: {group.memberCount}명
            </p>
          </div>
          {group.role === 'owner' && (
            <div className="flex gap-2">
              <EditGroupButton 
                group={group}
                onGroupUpdated={onGroupUpdated} 
              />
              <Button
                variant="destructive"
                onClick={(e) => handleDelete(group.id, e)}
                disabled={isLoading === group.id}
              >
                {isLoading === group.id ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 