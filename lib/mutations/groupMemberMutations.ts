import { useMutation } from "@tanstack/react-query";
import { groupMemberQueryKeys } from "../queries/groupMemberQuery";
import { IGroupMember } from "@/types";
import { getQueryClient } from "@/app/providers";

export const useCreateGroupMember = (groupId: string) => {
  const queryClient = getQueryClient();
  return useMutation({
    mutationFn: (newGroupMember: Partial<IGroupMember>) =>
      fetch("/api/groups/${groupId}", {
        method: "POST",
        body: JSON.stringify(newGroupMember),
      }).then((res) => {
        if (!res.ok) throw new Error("멤버 생성에 실패했습니다.");
        return res.json();
      }),
    onMutate: async (newGroupMember) => {
      await queryClient.cancelQueries({
        queryKey: groupMemberQueryKeys.getAll(groupId),
      });

      const previousGroupMembers = queryClient.getQueryData<IGroupMember[]>(
        groupMemberQueryKeys.getAll(groupId)
      );

      queryClient.setQueryData(
        groupMemberQueryKeys.getAll(groupId),
        (old: IGroupMember[] = []) => [...old, newGroupMember]
      );

      return { previousGroupMembers };
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: groupMemberQueryKeys.getAll(groupId),
      });
    },
    onError: (error, newGroupMember, context) => {
      queryClient.setQueryData(
        groupMemberQueryKeys.getAll(groupId),
        context?.previousGroupMembers
      );
    },
  });
};
