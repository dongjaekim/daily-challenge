import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "../queries/commentQuery";
import { IPostComment } from "@/types";

// 게시글 생성
export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newComment: Omit<IPostComment, "id">) =>
      fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(newComment),
      }).then((res) => res.json()),
    onSuccess: (newComment) => {
      // 캐시 즉시 업데이트 (낙관적 업데이트)
      // queryClient.setQueryData(
      //   commentQueryKeys.getAll(postId),
      //   (old: IPostComment[] = []) => [newComment, ...old]
      // );

      // comments 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.getAll(postId),
        exact: false,
      });
    },
  });
};

// 게시글 삭제
export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, commentId) => {
      // queryClient.setQueryData(
      //   commentQueryKeys.getAll(postId),
      //   (old: IPostComment[] = []) => old.filter((comment) => comment.id !== pcommentId)
      // );

      // posts 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.getAll(postId),
        exact: false,
      });
    },
  });
};
