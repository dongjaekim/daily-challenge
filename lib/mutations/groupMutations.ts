import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupQueryKeys } from "../queries/groupQuery";
import { IGroup } from "@/types";

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newGroup: Partial<IGroup>) =>
      fetch("/api/groups", {
        method: "POST",
        body: JSON.stringify(newGroup),
      }).then((res) => {
        if (!res.ok) throw new Error("모임 생성에 실패했습니다.");
        return res.json();
      }),
    onSuccess: (newGroup) => {
      // 캐시 즉시 업데이트 (낙관적 업데이트)
      queryClient.setQueryData(
        groupQueryKeys.getAll(),
        (old: IGroup[] = []) => [...old, newGroup]
      );
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) =>
      fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) throw new Error("모임 삭제에 실패했습니다.");
        return res.json();
      }),
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({
        queryKey: groupQueryKeys.getAll(),
      });

      const previousGroups = queryClient.getQueryData<IGroup[]>(
        groupQueryKeys.getAll()
      );

      queryClient.setQueryData(groupQueryKeys.getAll(), (old: IGroup[] = []) =>
        old.filter((group) => group.id !== groupId)
      );

      return { previousGroups };
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.getAll(),
      });
    },
    onError: (error, groupId, context) => {
      queryClient.setQueryData(
        groupQueryKeys.getAll(),
        context?.previousGroups
      );
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedGroup: Partial<IGroup>) =>
      fetch(`/api/groups/${updatedGroup.id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedGroup),
      }).then((res) => {
        if (!res.ok) throw new Error("모임 업데이트에 실패했습니다.");
        return res.json();
      }),
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(groupQueryKeys.getAll(), (old: IGroup[] = []) =>
        old.map((group) =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      );
    },
  });
};
