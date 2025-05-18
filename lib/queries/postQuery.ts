import { queryOptions } from "@tanstack/react-query";
import { IPost } from "@/types";

export const postQueryKeys = {
  getAll: (groupId: string) => ["groups", groupId, "posts"] as const,
  byChallenge: (groupId: string, challengeId?: string | null) => [
    ...postQueryKeys.getAll(groupId),
    { challengeId },
  ],
};

export const getPosts = async (
  groupId: string,
  challengeId?: string | null
): Promise<IPost[]> => {
  const params = challengeId ? `?challengeId=${challengeId}` : "";
  const res = await fetch(`/api/groups/${groupId}/posts${params}`);
  return res.json();
};

export const postQueryOptions = (
  groupId: string,
  challengeId?: string | null
) =>
  queryOptions({
    queryKey: postQueryKeys.byChallenge(groupId, challengeId),
    queryFn: () => getPosts(groupId, challengeId),
  });
