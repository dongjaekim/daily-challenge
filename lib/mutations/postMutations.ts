import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { postQueryKeys } from "../queries/postQuery";
import { IPost } from "@/types";
import { challengeRecordQueryKeys } from "../queries/challengeRecordQuery";

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
      queryClient.invalidateQueries({
        queryKey: challengeRecordQueryKeys.getAll(groupId),
        exact: false,
      });
    },
  });
};

// 게시글 수정
export const useUpdatePost = (
  groupId: string,
  options?: Omit<
    UseMutationOptions<Response, Error, Partial<IPost>, unknown>, // Response 타입은 API 응답에 따라 조절
    "mutationFn" // mutationFn은 훅 내부에서 정의하므로 제외
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Response, Error, Partial<IPost>, unknown>({
    mutationFn: async (updatedPost: Partial<IPost>) => {
      const response = await fetch(`/api/posts/${updatedPost.id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedPost),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `게시글 수정에 실패했습니다. 상태 코드: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `게시글 수정에 실패했습니다. 상태 코드: ${response.status}`
        );
      }
      return response;
    },
    onSuccess: (data, updatedPost, context) => {
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getAll(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getOne(updatedPost.id!),
      });
      if (options?.onSuccess) {
        options.onSuccess(data, updatedPost, context);
      }
    },
    onError: (error, updatedPost, context) => {
      console.error(`Error updating post ${updatedPost}:`, error);
      if (options?.onError) {
        options.onError(error, updatedPost, context);
      }
    },
    onSettled: (data, error, updatedPost, context) => {
      if (options?.onSettled) {
        options.onSettled(data, error, updatedPost, context);
      }
    },
  });
};

// 게시글 삭제
export const useDeletePost = (
  groupId: string,
  options?: Omit<
    UseMutationOptions<Response, Error, string, unknown>, // Response 타입은 API 응답에 따라 조절
    "mutationFn" // mutationFn은 훅 내부에서 정의하므로 제외
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Response, Error, string, unknown>({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `게시글 삭제에 실패했습니다. 상태 코드: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `게시글 삭제에 실패했습니다. 상태 코드: ${response.status}`
        );
      }
      return response;
    },
    onSuccess: (data, postId, context) => {
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getAll(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: challengeRecordQueryKeys.getAll(groupId),
        exact: false,
      });
      if (options?.onSuccess) {
        options.onSuccess(data, postId, context);
      }
    },
    onError: (error, postId, context) => {
      console.error(`Error deleting post ${postId}:`, error);
      if (options?.onError) {
        options.onError(error, postId, context);
      }
    },
    onSettled: (data, error, postId, context) => {
      if (options?.onSettled) {
        options.onSettled(data, error, postId, context);
      }
    },
  });
};

// 좋아요 토글
export const useToggleLike = (
  groupId: string,
  postId: string,
  options?: Omit<
    UseMutationOptions<Response, Error, void, unknown>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Response, Error, void, unknown>({
    mutationFn: () =>
      fetch(`/api/posts/${postId}/likes`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.getAll(groupId),
      });

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error(`Error toggling postLike ${postId}:`, error);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      if (options?.onSettled) {
        options.onSettled(data, error, variables, context);
      }
    },
  });
};
