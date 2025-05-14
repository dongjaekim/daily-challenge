import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postQueryKeys } from "../queries/postQuery";
import { IPost } from "@/types";

// 게시글 생성
export const useCreatePost = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPost: Omit<IPost, "id">) =>
      fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        body: JSON.stringify(newPost),
      }).then((res) => res.json()),
    onSuccess: (newPost) => {
      // 캐시 즉시 업데이트 (낙관적 업데이트)
      queryClient.setQueryData(
        postQueryKeys.all(groupId),
        (old: IPost[] = []) => [newPost, ...old]
      );
    },
  });
};

// 게시글 삭제
export const useDeletePost = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/groups/${groupId}/posts/${postId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, postId) => {
      queryClient.setQueryData(
        postQueryKeys.all(groupId),
        (old: IPost[] = []) => old.filter((post) => post.id !== postId)
      );
    },
  });
};

// 좋아요 토글
export const useToggleLike = (groupId: string, postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isLiked: boolean) =>
      fetch(`/api/groups/${groupId}/posts/${postId}/like`, {
        method: isLiked ? "POST" : "DELETE",
      }),
    onMutate: async (isLiked) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({
        queryKey: postQueryKeys.all(groupId),
      });

      const previousPosts = queryClient.getQueryData<IPost[]>(
        postQueryKeys.all(groupId)
      );

      queryClient.setQueryData(
        postQueryKeys.all(groupId),
        (old: IPost[] = []) =>
          old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked,
                  likeCount: isLiked
                    ? (post.likeCount || 0) + 1
                    : Math.max(0, (post.likeCount || 0) - 1),
                }
              : post
          )
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // 에러 발생 시 롤백
      queryClient.setQueryData(
        postQueryKeys.all(groupId),
        context?.previousPosts
      );
    },
  });
};
