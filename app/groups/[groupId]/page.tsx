import { GroupForm } from '@/components/groups/GroupForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { auth } from '@clerk/nextjs'
import { supabaseDb } from '@/db'
import { getUserUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, BarChart3Icon, MessageSquareTextIcon } from "lucide-react"
import Link from 'next/link'
import { GroupCalendarView } from '@/components/groups/GroupCalendarView'
import { GroupStatsView } from '@/components/groups/GroupStatsView'
import { GroupPostsView } from '@/components/groups/GroupPostsView'

interface GroupPageProps {
  params: {
    groupId: string
  },
  searchParams: {
    tab?: string
  }
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const { userId: clerkUserId } = auth()
  
  if (!clerkUserId) {
    return notFound()
  }
  
  // clerk_id로 Supabase users 테이블에서 UUID 조회
  const uuid = await getUserUuid(clerkUserId)
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }
  
  // 그룹 정보 조회
  const groupArr = await supabaseDb.select('groups', { id: params.groupId })
  const group = groupArr[0]
  
  if (!group) {
    return notFound()
  }
  
  // 그룹 멤버 role 조회
  const memberArr = await supabaseDb.select('group_members', { group_id: params.groupId, user_id: uuid })
  const role = memberArr[0]?.role || null
  
  const groupWithRole = {
    ...group,
    role
  }

  // 챌린지 목록 조회
  const challenges = await supabaseDb.select('challenges', { group_id: params.groupId })
  
  // 현재 선택된 탭
  const currentTab = searchParams.tab || 'calendar'

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 md:text-base">{group.description}</p>
        </div>
        <div className="flex gap-3 self-start sm:self-center">
          <Link href={`/groups/${params.groupId}/challenges`}>
            <Button variant="outline" className="whitespace-nowrap" size="default">챌린지 관리</Button>
          </Link>
          {(role === 'owner' || role === 'admin') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap" size="default">모임 수정</Button>
              </DialogTrigger>
              <DialogContent>
                <GroupForm initialData={groupWithRole} groupId={params.groupId} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={currentTab} className="w-full">
        <TabsList className="grid w-full h-full grid-cols-3 md:w-auto md:min-w-[400px] mx-auto shadow-sm">
          <TabsTrigger 
            value="calendar" 
            className="flex items-center gap-1.5 h-10 md:h-12 md:text-base"
            asChild
          >
            <Link href={`/groups/${params.groupId}?tab=calendar`} className="flex items-center gap-1.5 w-full justify-center py-2">
              <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">달력 뷰</span>
              <span className="sm:hidden">달력</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger 
            value="posts" 
            className="flex items-center gap-1.5 h-10 md:h-12 md:text-base"
            asChild
          >
            <Link href={`/groups/${params.groupId}?tab=posts`} className="flex items-center gap-1.5 w-full justify-center py-2">
              <MessageSquareTextIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">게시판 뷰</span>
              <span className="sm:hidden">게시판</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="flex items-center gap-1.5 h-10 md:h-12 md:text-base"
            asChild
          >
            <Link href={`/groups/${params.groupId}?tab=stats`} className="flex items-center gap-1.5 w-full justify-center py-2">
              <BarChart3Icon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">통계 뷰</span>
              <span className="sm:hidden">통계</span>
            </Link>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6 md:mt-8">
          <GroupCalendarView 
            groupId={params.groupId} 
            challenges={challenges}
          />
        </TabsContent>
        
        <TabsContent value="posts" className="mt-6 md:mt-8">
          <GroupPostsView 
            groupId={params.groupId} 
            challenges={challenges}
          />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6 md:mt-8">
          <GroupStatsView 
            groupId={params.groupId} 
            challenges={challenges}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 