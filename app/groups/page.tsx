import { GroupList } from '@/components/groups/GroupList'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { CreateGroupButton } from '@/components/groups/CreateGroupButton'
import { ClientGroupPage } from '@/components/groups/ClientGroupPage'

export default async function GroupsPage() {
  const { userId: clerkUserId } = auth()

  if (!clerkUserId) {
    return null
  }

  // clerk_id로 Supabase users 테이블에서 UUID 조회
  const uuid = await getUserUuid(clerkUserId)
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }

  // 사용자가 속한 모임 목록 조회 (이제 clerk_id가 아닌 UUID 사용)
  const groupMembers = await supabaseDb.select('group_members', { user_id: uuid })
  const groupIds = groupMembers.map((m: any) => m.group_id)
  let userGroups: any[] = []
  if (groupIds.length > 0) {
    userGroups = await Promise.all(
      groupIds.map(async (groupId: string) => {
        const groupArr = await supabaseDb.select('groups', { id: groupId })
        const group = groupArr[0]
        if (!group) return null
        // 멤버 수 조회
        const members = await supabaseDb.select('group_members', { group_id: groupId })
        return {
          ...group,
          memberCount: members.length,
          role: groupMembers.find((m: any) => m.group_id === groupId)?.role || null,
        }
      })
    )
    userGroups = userGroups.filter(Boolean)
  }

  return <ClientGroupPage initialGroups={userGroups} />
} 