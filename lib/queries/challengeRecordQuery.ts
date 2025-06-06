import { IChallengeRecord } from "@/types";

export const challengeRecordQueryKeys = {
  getAll: (groupId: string) =>
    ["groups", groupId, "challenge_records"] as const,
};

export const getChallengeRecords = async (
  groupId: string,
  filters?: {
    userId?: string;
    monthly?: string;
  }
): Promise<IChallengeRecord[]> => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId);
  if (filters?.monthly) params.append("monthly", filters.monthly);

  const queryString = params.toString();
  const url = `/api/groups/${groupId}/challenge-records${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await fetch(url);
  return res.json();
};
