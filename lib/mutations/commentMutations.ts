import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { commentQueryKeys } from "../queries/commentQuery";
import { postQueryKeys } from "../queries/postQuery";
import { IPostComment } from "@/types";

// 게시글 생성
export const useCreateComment = (
  postId: string,
  options?: Omit<
    UseMutationOptions<Response, Error, Omit<IPostComment, "id">, unknown>, // Response 타입은 API 응답에 따라 조절
    "mutationFn" // mutationFn은 훅 내부에서 정의하므로 제외
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newComment: Omit<IPostComment, "id">) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(newComment),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `댓글 등록에 실패했습니다. 상태 코드: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `댓글 등록에 실패했습니다. 상태 코드: ${response.status}`
        );
      }
      return response;
    },
    onSuccess: (data, newComment, context) => {
      // 캐시 즉시 업데이트 (낙관적 업데이트)
      // queryClient.setQueryData(
      //   commentQueryKeys.getAll(postId),
      //   (old: IPostComment[] = []) => [newComment, ...old]
      // );

      // comments 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.getAll(postId),
      });
      // 댓글 수 업데이트
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getOne(postId),
      });
      if (options?.onSuccess) {
        options.onSuccess(data, newComment, context);
      }
    },
    onError: (error, newComment, context) => {
      console.error(`Error creating comment ${newComment}:`, error);
      if (options?.onError) {
        options.onError(error, newComment, context);
      }
    },
    onSettled: (data, error, newComment, context) => {
      if (options?.onSettled) {
        options.onSettled(data, error, newComment, context);
      }
    },
  });
};

// 게시글 삭제
export const useDeleteComment = (
  postId: string,
  options?: Omit<
    UseMutationOptions<Response, Error, string, unknown>, // Response 타입은 API 응답에 따라 조절
    "mutationFn" // mutationFn은 훅 내부에서 정의하므로 제외
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Response, Error, string, unknown>({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `댓글 삭제에 실패했습니다. 상태 코드: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `댓글 삭제에 실패했습니다. 상태 코드: ${response.status}`
        );
      }
      return response;
    },
    onSuccess: (data, commentId, context) => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.getAll(postId),
        exact: false,
      });
      // 댓글 수 업데이트
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getOne(postId),
      });

      if (options?.onSuccess) {
        options.onSuccess(data, commentId, context);
      }
    },
    onError: (error, commentId, context) => {
      console.error(`Error deleting comment ${commentId}:`, error);
      if (options?.onError) {
        options.onError(error, commentId, context);
      }
    },
    onSettled: (data, error, commentId, context) => {
      if (options?.onSettled) {
        options.onSettled(data, error, commentId, context);
      }
    },
  });
};
