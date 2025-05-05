'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { GroupForm } from '@/components/groups/GroupForm'
import { useState } from 'react'
import { IGroup } from '@/types'

interface IUpdateGroupButtonProps {
  group: IGroup
  onGroupUpdated?: (newGroup: any) => void
}

export const EditGroupButton = ({ group, onGroupUpdated }: IUpdateGroupButtonProps) => {
  const [open, setOpen] = useState(false)
  
  // 새 모임 생성 후 콜백 처리
  const handleGroupUpdated = (newGroup: any) => {
    if (onGroupUpdated) {
      onGroupUpdated(newGroup)
    }
    setOpen(false)
  }

  // 이벤트 버블링 방지
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleButtonClick}>수정</Button>
      </DialogTrigger>
      <DialogContent onClick={e => e.stopPropagation()}>
        <GroupForm 
          initialData={{
            name: group.name,
            description: group.description
          }}
          groupId={group.id}
          setOpen={setOpen} 
          onSuccess={handleGroupUpdated} 
        />
      </DialogContent>
    </Dialog>
  )
} 