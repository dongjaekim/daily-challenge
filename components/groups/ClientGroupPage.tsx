"use client";

import { getGroup, getGroups, groupQueryKeys } from "@/lib/queries/groupQuery";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getGroupMember,
  groupMemberQueryKeys,
} from "@/lib/queries/groupMemberQuery";
import { useCreateGroupMember } from "@/lib/mutations/groupMemberMutations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  BarChart3Icon,
  MessageSquareTextIcon,
} from "lucide-react";
import Link from "next/link";
import { GroupCalendarView } from "@/components/groups/GroupCalendarView";
import { GroupStatsView } from "@/components/groups/GroupStatsView";
import { GroupPostsView } from "@/components/groups/GroupPostsView";
import { GroupForm } from "@/components/groups/GroupForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface IClientGroupPageProps {
  groupId: string;
  currentTab: string;
  uuid: string;
}

export default function ClientGroupPage({
  groupId,
  currentTab,
  uuid,
}: IClientGroupPageProps) {
  const { data: group } = useQuery({
    queryKey: groupQueryKeys.getOne(groupId),
    queryFn: () => getGroup(groupId),
  });

  const { data: me, isPending } = useQuery({
    queryKey: groupMemberQueryKeys.getOne(groupId, uuid),
    queryFn: () => getGroupMember(groupId, uuid),
    enabled: !!uuid,
  });

  const { mutateAsync: createGroupMember } = useCreateGroupMember(groupId);

  // 자동 가입 로직
  useEffect(() => {
    if (!isPending && !me && uuid) {
      createGroupMember({ user_id: uuid });
    }
  }, [isPending, me, uuid]);

  const role = me?.role || "member";

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 md:text-base">
            {group?.description}
          </p>
        </div>
        <div className="flex gap-3 self-start sm:self-center">
          <Link href={`/groups/${groupId}/challenges`}>
            <Button
              variant="outline"
              className="whitespace-nowrap"
              size="default"
            >
              챌린지 관리
            </Button>
          </Link>
          {role === "owner" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap" size="default">
                  모임 수정
                </Button>
              </DialogTrigger>
              <DialogContent>
                <GroupForm initialData={group} groupId={groupId} />
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
            <Link
              href={`/groups/${groupId}?tab=calendar`}
              className="flex items-center gap-1.5 w-full justify-center py-2"
            >
              <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">챌린지 캘린더</span>
              <span className="sm:hidden">캘린더</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="flex items-center gap-1.5 h-10 md:h-12 md:text-base"
            asChild
          >
            <Link
              href={`/groups/${groupId}?tab=posts`}
              className="flex items-center gap-1.5 w-full justify-center py-2"
            >
              <MessageSquareTextIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">게시판</span>
              <span className="sm:hidden">게시판</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex items-center gap-1.5 h-10 md:h-12 md:text-base"
            asChild
          >
            <Link
              href={`/groups/${groupId}?tab=stats`}
              className="flex items-center gap-1.5 w-full justify-center py-2"
            >
              <BarChart3Icon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">통계</span>
              <span className="sm:hidden">통계</span>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6 md:mt-8">
          <GroupCalendarView groupId={groupId} />
        </TabsContent>

        <TabsContent value="posts" className="mt-6 md:mt-8">
          <GroupPostsView groupId={groupId} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6 md:mt-8">
          <GroupStatsView groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
