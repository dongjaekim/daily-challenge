import { IChallengeRecord } from "@/types";

export const challengeRecordQueryKeys = {
  getAll: (groupId: string) =>
    ["groups", groupId, "challenge_records"] as const,
};

export const getChallengeRecords = async (
  groupId: string
): Promise<IChallengeRecord[]> => {
  const res = await fetch(`/api/groups/${groupId}/challenge-records`);
  return res.json();
};
