"use client";

import { getGroup, groupQueryKeys } from "@/lib/queries/groupQuery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  UsersIcon,
  Loader2,
  Edit3Icon,
} from "lucide-react";
import Link from "next/link";
import { GroupCalendarView } from "@/components/groups/GroupCalendarView";
import { GroupStatsView } from "@/components/groups/GroupStatsView";
import { GroupPostsView } from "@/components/groups/GroupPostsView";
import { GroupForm } from "@/components/groups/GroupForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();
  const [isAutoJoining, setIsAutoJoining] = useState(false);

  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: groupQueryKeys.getOne(groupId),
    queryFn: () => getGroup(groupId),
  });

  const {
    data: me,
    isPending: isMeLoading,
    isError: isMeError,
    error: meError,
  } = useQuery({
    queryKey: groupMemberQueryKeys.getOne(groupId, uuid),
    queryFn: () => getGroupMember(groupId, uuid),
    enabled: !!uuid,
    retry: (failureCount, error: any) => {
      // 404 에러 = 멤버가 아니다 -> 자동 가입 로직을 위해 재시도 하지 않음
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2; // 그 외 에러는 최대 2번 재시도
    },
  });

  const { mutateAsync: createGroupMember, isPending: isCreatingMember } =
    useCreateGroupMember(groupId);

  // 자동 가입 로직
  useEffect(() => {
    if (!isMeLoading && !me && uuid && isMeError && !isAutoJoining) {
      const shouldAutoJoin = (meError as any)?.response?.status === 404;

      if (shouldAutoJoin) {
        const autoJoin = async () => {
          setIsAutoJoining(true);
          try {
            await createGroupMember({ user_id: uuid });
            // 성공 시 'me' 쿼리를 무효화하여 최신 멤버 정보 로드
            queryClient.invalidateQueries({
              queryKey: groupMemberQueryKeys.getOne(groupId, uuid),
            });
          } catch (err) {
            console.error("자동 그룹 가입 실패:", err);
            toast({
              variant: "destructive",
              title: "오류",
              description: "자동 그룹 가입 실패",
            });
          } finally {
            setIsAutoJoining(false);
          }
        };
        autoJoin();
      }
    }
  }, [
    isMeLoading,
    me,
    uuid,
    isMeError,
    meError,
    createGroupMember,
    groupId,
    queryClient,
    isAutoJoining,
  ]);

  const role = me?.role || "member";

  if (isGroupLoading) {
    return (
      <div className="space-y-6 md:space-y-8 p-2 sm:p-4">
        {" "}
        {/* 모바일 패딩 적용 */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-1.5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-grow"> {/* For spacing */} </div>
          <div className="flex gap-2 self-start sm:self-center">
            <Skeleton className="h-9 w-32 sm:h-10 sm:w-36" />
            <Skeleton className="h-9 w-24 sm:h-10 sm:w-28" />
          </div>
        </div>
        <Skeleton className="h-12 w-full md:w-[400px] md:mx-auto" />{" "}
        {/* TabsList Skeleton */}
        <Skeleton className="h-72 w-full mt-4 md:mt-8" />{" "}
        {/* TabsContent Skeleton */}
      </div>
    );
  }

  if (isAutoJoining || (uuid && isMeLoading && !me && !isMeError)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
        <p className="text-base sm:text-lg font-medium text-muted-foreground">
          {isAutoJoining
            ? "그룹에 참여하는 중입니다..."
            : "그룹 정보를 불러오는 중입니다..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
        <div className="flex-grow min-w-0">
          <h1
            className="text-2xl sm:text-3xl font-bold truncate"
            title={group?.name}
          >
            {group?.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base md:mt-1.5 line-clamp-2 sm:line-clamp-none">
            {group?.description}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 self-start sm:self-end flex-shrink-0">
          <Link href={`/groups/${groupId}/challenges`}>
            <Button
              variant="outline"
              className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3"
              size="sm"
            >
              <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              챌린지 관리
            </Button>
          </Link>
          {role === "owner" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3"
                  size="sm"
                >
                  <Edit3Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  모임 수정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-full sm:max-w-md md:max-w-lg">
                <GroupForm initialData={group} groupId={groupId} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={currentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto md:w-auto md:min-w-[400px] md:mx-auto shadow-sm">
          {[
            {
              value: "calendar",
              label: "캘린더",
              icon: CalendarIcon,
              href: `/groups/${groupId}?tab=calendar`,
            },
            {
              value: "posts",
              label: "게시판",
              icon: MessageSquareTextIcon,
              href: `/groups/${groupId}?tab=posts`,
            },
            {
              value: "stats",
              label: "통계",
              icon: BarChart3Icon,
              href: `/groups/${groupId}?tab=stats`,
            },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-col items-center justify-center gap-0.5 h-14 sm:h-12 md:text-base px-1 py-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              asChild
            >
              <Link
                href={tab.href}
                className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 w-full justify-center py-1.5 sm:py-2"
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] sm:text-xs mt-0.5 sm:mt-0">
                  {tab.label}
                </span>
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendar" className="mt-4 md:mt-8">
          <GroupCalendarView groupId={groupId} />
        </TabsContent>

        <TabsContent value="posts" className="mt-4 md:mt-8">
          <GroupPostsView groupId={groupId} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4 md:mt-8">
          <GroupStatsView groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
