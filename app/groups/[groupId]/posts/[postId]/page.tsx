import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getPost, postQueryKeys } from "@/lib/queries/postQuery";
import { PostDetail } from "@/components/posts/PostDetail";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";
import { commentQueryKeys, getComments } from "@/lib/queries/commentQuery";

interface IPostPageProps {
  params: {
    groupId: string;
    postId: string;
  };
}

export default async function PostPage({ params }: IPostPageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  const queryClient = makeQueryClient();

  queryClient.prefetchQuery({
    queryKey: postQueryKeys.getOne(params.postId),
    queryFn: () => getPost(params.postId),
  });

  queryClient.prefetchQuery({
    queryKey: commentQueryKeys.getAll(params.postId),
    queryFn: () => getComments(params.postId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>
        <PostDetail
          groupId={params.groupId}
          postId={params.postId}
          currentUserId={uuid}
        />
      </div>
    </HydrationBoundary>
  );
}
