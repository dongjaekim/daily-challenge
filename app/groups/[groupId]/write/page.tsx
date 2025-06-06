import { PostForm } from "@/components/posts/PostForm";
import {
  dehydrate,
  HydrationBoundary,
  useQueryClient,
} from "@tanstack/react-query";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";

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

  const queryClient = useQueryClient();

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
