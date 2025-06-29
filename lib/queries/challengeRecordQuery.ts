import { IChallengeRecord } from "@/types";

export const challengeRecordQueryKeys = {
  getAll: (groupId: string) =>
    ["groups", groupId, "challenge_records"] as const,
  getFilteredList: (
    groupId: string,
    filters: { startDate?: string; endDate?: string; userId?: string }
  ) => [...challengeRecordQueryKeys.getAll(groupId), filters] as const,
};

export const getChallengeRecords = async (
  groupId: string,
  filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<IChallengeRecord[]> => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  const url = `/api/groups/${groupId}/challenge-records${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await fetch(url);
  return res.json();
};
