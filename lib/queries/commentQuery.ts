import { IPostComment } from "@/types";

export const commentQueryKeys = {
  getAll: (postId: string) => ["posts", postId, "comments"] as const,
};

export const getComments = async (postId: string): Promise<IPostComment[]> => {
  const res = await fetch(`/api/posts/${postId}/comments`);
  return res.json();
};
