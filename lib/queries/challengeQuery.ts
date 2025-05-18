import { IChallenge } from "@/types";

export const challengeQueryKeys = {
  getAll: (groupId: string) => ["groups", groupId, "challenges"] as const,
  getOne: (groupId: string, challengeId: string) =>
    [...challengeQueryKeys.getAll(groupId), challengeId] as const,
};

export const getChallenges = async (groupId: string): Promise<IChallenge[]> => {
  const res = await fetch(`/api/groups/${groupId}/challenges`);
  return res.json();
};

export const getChallenge = async (
  groupId: string,
  challengeId: string
): Promise<IChallenge> => {
  const res = await fetch(`/api/groups/${groupId}/challenges/${challengeId}`);
  return res.json();
};
