import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { challengeQueryKeys } from "../queries/challengeQuery";
import { IChallenge } from "@/types";

type ChallengePayload = Pick<IChallenge, "title" | "description">;

// 챌린지 생성
export const useCreateChallenge = (
  groupId: string,
  options?: Omit<
    UseMutationOptions<IChallenge, Error, ChallengePayload>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<IChallenge, Error, ChallengePayload>({
    mutationFn: async (newChallenge) => {
      const response = await fetch(`/api/groups/${groupId}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChallenge),
      });
      if (!response.ok) throw new Error("챌린지 생성에 실패했습니다.");
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: challengeQueryKeys.getAll(groupId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// 챌린지 수정
export const useUpdateChallenge = (
  groupId: string,
  options?: Omit<
    UseMutationOptions<
      IChallenge,
      Error,
      { challengeId: string; payload: ChallengePayload }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    IChallenge,
    Error,
    { challengeId: string; payload: ChallengePayload }
  >({
    mutationFn: async ({ challengeId, payload }) => {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${challengeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("챌린지 수정에 실패했습니다.");
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: challengeQueryKeys.getAll(groupId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// 챌린지 삭제
export const useDeleteChallenge = (
  groupId: string,
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (challengeId: string) => {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${challengeId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("챌린지 삭제에 실패했습니다.");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: challengeQueryKeys.getAll(groupId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
