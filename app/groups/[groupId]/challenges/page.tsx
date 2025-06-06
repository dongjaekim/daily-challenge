export const dynamic = "force-dynamic";

import { ClientChallenges } from "@/components/challenges/ClientChallenges";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";
import {
  challengeRecordQueryKeys,
  getChallengeRecords,
} from "@/lib/queries/challengeRecordQuery";
import {
  groupMemberQueryKeys,
  getGroupMember,
} from "@/lib/queries/groupMemberQuery";

interface IChallengesPageProps {
  params: {
    groupId: string;
  };
}

export default async function ChallengesPage({ params }: IChallengesPageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  const queryClient = makeQueryClient();

  queryClient.prefetchQuery({
    queryKey: challengeQueryKeys.getAll(params.groupId),
    queryFn: () => getChallenges(params.groupId),
  });

  queryClient.prefetchQuery({
    queryKey: challengeRecordQueryKeys.getAll(params.groupId),
    queryFn: () =>
      getChallengeRecords(params.groupId, { userId: uuid, monthly: "true" }),
  });

  queryClient.prefetchQuery({
    queryFn: () => getGroupMember(params.groupId, uuid),
    queryKey: groupMemberQueryKeys.getOne(params.groupId, uuid),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientChallenges groupId={params.groupId} currentUserId={uuid} />
    </HydrationBoundary>
  );
}
