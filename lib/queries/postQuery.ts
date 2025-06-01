import { IPost } from "@/types";

export const postQueryKeys = {
  getAll: (groupId: string, challengeId?: string) =>
    ["groups", groupId, "posts", challengeId] as const,
  getOne: (postId: string) => ["posts", postId] as const,
};

export const getPosts = async (
  groupId: string,
  page?: number,
  pageSize?: number,
  challengeId?: string
): Promise<{ data: IPost[]; total: number; nextPage?: number | null }> => {
  const params = new URLSearchParams({
    ...(page !== undefined && { page: page.toString() }),
    ...(pageSize !== undefined && { pageSize: pageSize.toString() }),
    ...(challengeId && { challengeId }),
  });
  const res = await fetch(`/api/groups/${groupId}/posts?${params}`);
  return res.json();
};

export const getPost = async (postId: string): Promise<IPost> => {
  const res = await fetch(`/api/posts/${postId}`);
  return res.json();
};
