'use client'

import { GroupList } from '@/components/groups/GroupList'
import { CreateGroupButton } from '@/components/groups/CreateGroupButton'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IGroup } from '@/types'

interface IClientGroupPageProps {
  initialGroups: IGroup[]
}

export function ClientGroupPage({ initialGroups }: IClientGroupPageProps) {
  const router = useRouter()
  const [groups, setGroups] = useState<IGroup[]>(initialGroups)

  // 새 모임이 생성되었을 때 목록에 추가
  const handleGroupCreated = (newGroup: any) => {
    // 멤버 수, 역할 등 필요한 속성을 추가
    const groupWithDetails: IGroup = {
      ...newGroup,
      memberCount: 1, // 생성자 본인만 있으므로 1
      role: 'owner' as const // 타입 명시
    }
    
    // 목록 최상단에 새 모임 추가
    setGroups([groupWithDetails, ...groups])

    // 라우터 리프레시로 서버 컴포넌트 데이터 재검증
    router.refresh()
  }
  
  // 모임이 수정되었을 때 목록에서 수정
  const handleGroupUpdated = (newGroup: any) => {
    setGroups(groups.map(group => 
      group.id === newGroup.id 
        ? { ...group, name: newGroup.name, description: newGroup.description } 
        : group
    ))
    router.refresh()
  }

  // 모임이 삭제되었을 때 목록에서 제거
  const handleGroupDeleted = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId))
    router.refresh()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">모임 목록</h1>
        <CreateGroupButton onGroupCreated={handleGroupCreated} />
      </div>
      <div className="mt-8">
        <GroupList 
          groups={groups} 
          onGroupUpdated={handleGroupUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      </div>
    </div>
  )
} 