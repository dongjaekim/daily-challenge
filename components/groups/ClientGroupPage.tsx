'use client'

import { GroupList } from '@/components/groups/GroupList'
import { CreateGroupButton } from '@/components/groups/CreateGroupButton'
import { useState } from 'react'

interface Group {
  id: string
  name: string
  description: string | null
  memberCount: number
  role: 'owner' | 'member'
  created_by: string
}

interface IClientGroupPageProps {
  initialGroups: Group[]
}

export function ClientGroupPage({ initialGroups }: IClientGroupPageProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)

  // 새 모임이 생성되었을 때 목록에 추가
  const handleGroupCreated = (newGroup: any) => {
    // 멤버 수, 역할 등 필요한 속성을 추가
    const groupWithDetails: Group = {
      ...newGroup,
      memberCount: 1, // 생성자 본인만 있으므로 1
      role: 'owner' as const // 타입 명시
    }
    
    // 목록 최상단에 새 모임 추가
    setGroups([groupWithDetails, ...groups])
  }
  
  // 모임이 삭제되었을 때 목록에서 제거
  const handleGroupDeleted = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId))
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
          onGroupDeleted={handleGroupDeleted}
        />
      </div>
    </div>
  )
} 