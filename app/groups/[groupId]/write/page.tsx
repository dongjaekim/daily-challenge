import { PostForm } from "@/components/posts/PostForm";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  groupMemberQueryKeys,
  getGroupMember,
} from "@/lib/queries/groupMemberQuery";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";

interface IWritePageProps {
  params: {
    groupId: string;
  };
}

export default async function WritePage({ params }: IWritePageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  const queryClient = makeQueryClient();

  // 1. 그룹 멤버 여부 확인 (이 데이터는 서버 로직에서 즉시 사용되므로 fetchQuery가 적절)
  const isMember = await queryClient.fetchQuery({
    queryFn: () => getGroupMember(params.groupId, uuid),
    queryKey: groupMemberQueryKeys.getOne(params.groupId, uuid),
  });

  if (!isMember) {
    console.warn(
      `User ${uuid} is not a member of group ${params.groupId}. Access denied.`
    );
    return notFound();
  }

  queryClient.prefetchQuery({
    queryFn: () => getGroupMember(params.groupId, uuid),
    queryKey: groupMemberQueryKeys.getOne(params.groupId, uuid),
  });

  queryClient.prefetchQuery({
    queryKey: challengeQueryKeys.getAll(params.groupId),
    queryFn: () => getChallenges(params.groupId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>
        <PostForm groupId={params.groupId} />
      </div>
    </HydrationBoundary>
  );
}
