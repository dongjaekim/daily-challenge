import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postQueryKeys } from "../queries/postQuery";
import { IGroup, IPost } from "@/types";

// 게시글 생성
export const useCreatePost = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPost: {
      content: string;
      challengeIds: string[];
      imageUrls: string[];
    }) =>
      fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        body: JSON.stringify(newPost),
      }).then((res) => {
        if (!res.ok) throw new Error("게시글 작성에 실패했습니다.");
        return res.json();
      }),
    onSuccess: () => {
      // posts 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getAll(groupId),
        exact: false,
      });
    },
  });
};

// 게시글 수정
export const useUpdatePost = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedPost: Partial<IPost>) =>
      fetch(`/api/posts/${updatedPost.id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedPost),
      }).then((res) => {
        if (!res.ok) throw new Error("게시글 수정에 실패했습니다.");
        return res.json();
      }),
    onSuccess: (updatedPost) => {
      // posts 관련 캐시 무효화
      queryClient.setQueryData(
        postQueryKeys.getAll(groupId),
        (old: IPost[] = []) =>
          old.map((post) => (post.id === updatedPost.id ? updatedPost : post))
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
      // queryClient.setQueryData(
      //   postQueryKeys.getAll(groupId),
      //   (old: IPost[] = []) => old.filter((post) => post.id !== postId)
      // );

      // posts 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getAll(groupId),
        exact: false,
      });
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
        queryKey: postQueryKeys.getAll(groupId),
      });

      const previousPosts = queryClient.getQueryData<IPost[]>(
        postQueryKeys.getAll(groupId)
      );

      queryClient.setQueryData(
        postQueryKeys.getAll(groupId),
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
        postQueryKeys.getAll(groupId),
        context?.previousPosts
      );
    },
  });
};
