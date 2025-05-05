import { supabaseDb } from '@/db'
import { getSupabaseUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { ClientGroupPage } from '@/components/groups/ClientGroupPage'

export default async function GroupsPage() {
  const uuid = await getSupabaseUuid()
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }
  console.log('[UUID]', uuid)

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