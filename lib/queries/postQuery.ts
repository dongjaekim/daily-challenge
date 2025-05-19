import { IPost } from "@/types";

export const postQueryKeys = {
  getAll: (
    groupId: string,
    page: number,
    pageSize: number,
    challengeId?: string | null
  ) => ["groups", groupId, "posts", page, pageSize, challengeId] as const,
};

export const getPosts = async (
  groupId: string,
  page: number,
  pageSize: number,
  challengeId?: string | null
): Promise<{ data: IPost[]; total: number }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(challengeId && { challengeId }),
  });
  const res = await fetch(`/api/groups/${groupId}/posts?${params}`);
  return res.json();
};
