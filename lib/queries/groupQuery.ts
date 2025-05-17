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
