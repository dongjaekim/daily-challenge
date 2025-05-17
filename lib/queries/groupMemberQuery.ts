import { IGroupMember } from "@/types";

export const groupMemberQueryKeys = {
  getAll: (groupId: string) => ["group_members"] as const,
  getOne: (groupId: string, userId: string) =>
    [...groupMemberQueryKeys.getAll(groupId), userId] as const,
};

export const getGroupMembers = async (
  groupId: string
): Promise<IGroupMember[]> => {
  const res = await fetch(`/api/groups/${groupId}/challenges`);
  return res.json();
};

export const getGroupMember = async (
  groupId: string,
  userId: string
): Promise<IGroupMember> => {
  const res = await fetch(`/api/groups/${groupId}/members/${userId}`);
  return res.json();
};
