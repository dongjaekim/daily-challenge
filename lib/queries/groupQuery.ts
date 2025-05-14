import { queryOptions } from "@tanstack/react-query";
import { IGroup } from "@/types";

export const groupQueryKeys = {
  getAll: () => ["groups"] as const,
  getOne: (groupId: string) => [...groupQueryKeys.getAll(), groupId] as const,
};

export const getGroups = async (): Promise<IGroup[]> => {
  const res = await fetch(`/api/groups`);
  return res.json();
};

export const getGroup = async (groupId: string): Promise<IGroup> => {
  const res = await fetch(`/api/groups/${groupId}`);
  return res.json();
};

export const groupQueryOptions = () =>
  queryOptions({
    queryKey: groupQueryKeys.getAll(),
    queryFn: () => getGroups(),
    staleTime: 5 * 60 * 1000, // 5분간 신선한 상태 유지
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
  });
