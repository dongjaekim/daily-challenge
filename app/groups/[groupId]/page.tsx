import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { groupQueryKeys, getGroup } from "@/lib/queries/groupQuery";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";
import {
  groupMemberQueryKeys,
  getGroupMembers,
} from "@/lib/queries/groupMemberQuery";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";
import ClientGroupPage from "@/components/groups/ClientGroupPage";

interface IGroupPageProps {
  params: {
    groupId: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default async function GroupPage({
  params,
  searchParams,
}: IGroupPageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  const queryClient = makeQueryClient();

  queryClient.prefetchQuery({
    queryKey: groupQueryKeys.getOne(params.groupId),
    queryFn: () => getGroup(params.groupId),
  });

  queryClient.prefetchQuery({
    queryKey: challengeQueryKeys.getAll(params.groupId),
    queryFn: () => getChallenges(params.groupId),
  });

  queryClient.prefetchQuery({
    queryKey: groupMemberQueryKeys.getAll(params.groupId),
    queryFn: () => getGroupMembers(params.groupId),
  });

  // 현재 선택된 탭
  const currentTab = searchParams.tab || "calendar";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientGroupPage
        groupId={params.groupId}
        currentTab={currentTab}
        uuid={uuid}
      />
    </HydrationBoundary>
  );
}
