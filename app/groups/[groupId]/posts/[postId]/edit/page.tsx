import { getSupabaseUuid } from "@/utils/server-auth";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/posts/PostForm";

interface EditPostPageProps {
  params: {
    groupId: string;
    postId: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>
        <PostForm postId={params.postId} groupId={params.groupId} />
      </div>
    </HydrationBoundary>
  );
}
