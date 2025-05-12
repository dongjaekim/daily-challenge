import { create } from "zustand";
import { IPost } from "@/types";

interface PostsState {
  // 그룹별 게시글 저장
  postsByGroup: Record<
    string,
    {
      posts: IPost[];
      lastFetched: number;
      challengeFilterId: string | null | undefined;
    }
  >;

  cacheTimeMs: number;

  // 특정 그룹의 게시글 설정
  setPosts: (
    groupId: string,
    posts: IPost[],
    challengeId?: string | null
  ) => void;

  // 특정 그룹의 게시글이 캐시되어 있고, 유효한지 확인
  arePostsCached: (groupId: string, challengeId?: string | null) => boolean;

  // 특정 그룹의 게시글 가져오기
  getPosts: (groupId: string, challengeId?: string | null) => IPost[] | null;

  // 특정 게시글 가져오기
  getPost: (groupId: string, postId: string) => IPost | null;

  // 특정 그룹의 게시글 추가
  addPost: (groupId: string, post: IPost) => void;

  // 특정 그룹의 게시글 업데이트
  updatePost: (
    groupId: string,
    postId: string,
    updatedPost: Partial<IPost>
  ) => void;

  // 특정 그룹의 게시글 삭제
  deletePost: (groupId: string, postId: string) => void;

  // 좋아요 토글
  toggleLike: (groupId: string, postId: string, isLiked: boolean) => void;

  // 댓글 수 업데이트
  updateCommentCount: (
    groupId: string,
    postId: string,
    isIncrement: boolean
  ) => void;

  // 특정 그룹의 캐시 데이터 초기화
  invalidateCache: (groupId: string) => void;

  autoCleanUp: () => void;
}

export const usePostsStore = create<PostsState>()((set, get) => ({
  postsByGroup: {},
  cacheTimeMs: 60 * 60 * 1000, // 1시간

  setPosts: (groupId, posts, challengeId = null) => {
    set((state) => ({
      postsByGroup: {
        ...state.postsByGroup,
        [groupId]: {
          posts,
          lastFetched: Date.now(),
          challengeFilterId: challengeId,
        },
      },
    }));
  },

  arePostsCached: (groupId, challengeId = null) => {
    const state = get();
    const groupData = state.postsByGroup[groupId];

    if (!groupData) return false;

    // 다른 챌린지 필터로 요청된 경우 캐시 무효
    if (challengeId !== groupData.challengeFilterId) return false;

    // 캐시 시간 체크
    const isCacheValid = Date.now() - groupData.lastFetched < state.cacheTimeMs;

    return isCacheValid;
  },

  getPosts: (groupId, challengeId = null) => {
    const state = get();

    if (!state.arePostsCached(groupId, challengeId)) {
      return null;
    }

    return state.postsByGroup[groupId].posts;
  },

  getPost: (groupId: string, postId: string) => {
    const state = get();

    // 캐시 유효성 확인
    if (!state.arePostsCached(groupId)) {
      state.invalidateCache(groupId); // 캐시 무효화
      return null;
    }

    const post = state.postsByGroup[groupId].posts.find(
      (post) => post.id === postId
    );

    async function fetchPostFromDB(groupId: string, postId: string) {
      try {
        const response = await fetch(`/api/groups/${groupId}/posts/${postId}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching post:", error);
        return null;
      }
    }

    if (!post) {
      // DB에서 직접 조회 (비동기 처리 예시)
      fetchPostFromDB(groupId, postId).then((fetchedPost) => {
        if (fetchedPost) {
          state.addPost(groupId, fetchedPost);
        }
      });
    }

    return post || null;
  },

  addPost: (groupId, post) => {
    set((state) => {
      const groupData = state.postsByGroup[groupId];

      if (!groupData) return state;

      return {
        postsByGroup: {
          ...state.postsByGroup,
          [groupId]: {
            ...groupData,
            posts: [post, ...groupData.posts],
          },
        },
      };
    });
  },

  updatePost: (groupId, postId, updatedPost) => {
    set((state) => {
      const groupData = state.postsByGroup[groupId];

      if (!groupData) return state;

      return {
        postsByGroup: {
          ...state.postsByGroup,
          [groupId]: {
            ...groupData,
            posts: groupData.posts.map((post) =>
              post.id === postId ? { ...post, ...updatedPost } : post
            ),
          },
        },
      };
    });
  },

  deletePost: (groupId, postId) => {
    set((state) => {
      const groupData = state.postsByGroup[groupId];

      if (!groupData) return state;

      return {
        postsByGroup: {
          ...state.postsByGroup,
          [groupId]: {
            ...groupData,
            posts: groupData.posts.filter((post) => post.id !== postId),
          },
        },
      };
    });
  },

  toggleLike: (groupId, postId, isLiked) => {
    set((state) => {
      const groupData = state.postsByGroup[groupId];

      if (!groupData) return state;

      return {
        postsByGroup: {
          ...state.postsByGroup,
          [groupId]: {
            ...groupData,
            posts: groupData.posts.map((post) => {
              if (post.id === postId) {
                const likeCount = post.likeCount || 0;

                return {
                  ...post,
                  isLiked,
                  likeCount: isLiked
                    ? likeCount + 1
                    : Math.max(0, likeCount - 1),
                };
              }
              return post;
            }),
          },
        },
      };
    });
  },

  updateCommentCount: (groupId, postId, isIncrement) => {
    set((state) => {
      const groupData = state.postsByGroup[groupId];

      if (!groupData) return state;

      return {
        postsByGroup: {
          ...state.postsByGroup,
          [groupId]: {
            ...groupData,
            posts: groupData.posts.map((post) => {
              if (post.id === postId) {
                const commentCount = post.commentCount || 0;

                return {
                  ...post,
                  commentCount: isIncrement
                    ? commentCount + 1
                    : Math.max(0, commentCount - 1),
                };
              }
              return post;
            }),
          },
        },
      };
    });
  },

  invalidateCache: (groupId) => {
    set((state) => {
      const { [groupId]: _, ...rest } = state.postsByGroup;

      return {
        postsByGroup: rest,
      };
    });
  },

  autoCleanUp: () => {
    set((state) => {
      const now = Date.now();
      const newPostsByGroup = { ...state.postsByGroup };
      Object.entries(newPostsByGroup).forEach(([groupId, data]) => {
        if (now - data.lastFetched > state.cacheTimeMs) {
          delete newPostsByGroup[groupId];
        }
      });
      return { postsByGroup: newPostsByGroup };
    });
  },
}));
