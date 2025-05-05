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
  if (groupIds.length === 0) {
    return <ClientGroupPage initialGroups={[]} />
  }

  // 그룹 정보 한 번에 조회
  const groupsArr = await supabaseDb.select('groups', { id: groupIds })
  // 모든 group_members에서 해당 group_id에 속한 멤버를 한 번에 조회
  const allMembers = await supabaseDb.select('group_members', { group_id: groupIds })

  // 그룹별로 멤버 수와 내 역할 집계
  const userGroups = groupsArr.map((group: any) => {
    const members = allMembers.filter((m: any) => m.group_id === group.id)
    const myMembership = groupMembers.find((m: any) => m.group_id === group.id)
    return {
      ...group,
      memberCount: members.length,
      role: myMembership?.role || null,
    }
  })

  return <ClientGroupPage initialGroups={userGroups} />
} 