"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PenSquare, Loader2, Smile, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import { getPosts, postQueryKeys } from "@/lib/queries/postQuery";
import { useInView } from "react-intersection-observer";
import { PostItem } from "../posts/PostItem";

interface GroupPostsViewProps {
  groupId: string;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return; // Guard for SSR or environments without window

    const check = () => setIsMobile(window.innerWidth < breakpoint);

    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

const ITEM_SPACING_PX = 12;

export function GroupPostsView({ groupId }: GroupPostsViewProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ref: loadMoreRef, inView: isLoadMoreVisible } = useInView({
    threshold: 0.1,
  });

  const { data: challenges } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const fetchPosts = async ({ pageParam = 1 }) => {
    return getPosts(
      groupId,
      pageParam,
      5,
      selectedChallenge === "all" ? undefined : selectedChallenge
    );
  };

  const {
    data: postsPagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
    isError: isErrorPosts,
    error: postsError,
  } = useInfiniteQuery({
    queryKey: postQueryKeys.getAll(
      groupId,
      selectedChallenge === "all" ? undefined : selectedChallenge
    ),
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 1,
  });

  const flatPosts = useMemo(
    () => postsPagesData?.pages.flatMap((page) => page?.data || []) || [],
    [postsPagesData]
  );

  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 가상화를 위한 ref와 virtualizer 생성
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(640); // 640px 미만이면 모바일

  const rowVirtualizer = useWindowVirtualizer({
    count: flatPosts.length,
    estimateSize: useCallback(
      (index: number): number => {
        const post = flatPosts[index];
        if (!post) return 350 + ITEM_SPACING_PX;

        // 1. 기본 높이 (패딩, 작성자 정보, 하단 버튼 영역 등)
        let estimatedHeight = isMobile ? 160 : 180;

        // 2. 내용(content) 길이에 따른 높이 추가
        const contentLength = post.content?.length || 0;
        if (contentLength > 0) {
          const avgCharsPerLine = isMobile ? 30 : 45;
          const avgLineHeight = isMobile ? 22 : 26;
          const estimatedLines = Math.ceil(contentLength / avgCharsPerLine);
          // line-clamp-3를 고려하여 최대 3줄 높이만 추가
          estimatedHeight += Math.min(estimatedLines, 3) * avgLineHeight;
        }

        // 3. 챌린지 태그 유무에 따른 높이 추가
        if (post.challenges && post.challenges.length > 0) {
          estimatedHeight += 40; // 한 줄 정도의 높이
        }

        // 4. 이미지 유무에 따른 높이 추가
        if (post.image_urls && post.image_urls.length > 0) {
          estimatedHeight += isMobile ? 100 : 130; // 이미지 그리드 영역의 대략적인 높이
        }

        return estimatedHeight + ITEM_SPACING_PX;
      },
      [flatPosts, isMobile]
    ),
    overscan: 5, // 추가로 렌더링할 아이템 수
  });

  const handleWriteClick = () => {
    router.push(`/groups/${groupId}/write`);
  };

  const handlePostClick = useCallback(
    (postId: string) => {
      router.push(`/groups/${groupId}/posts/${postId}`);
    },
    [router, groupId]
  );

  const handleFilterChange = (value: string) => {
    setSelectedChallenge(value);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex flex-col">
      <CardHeader className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <Select value={selectedChallenge} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px] md:min-w-[220px] text-sm h-9 sm:h-10">
              <SelectValue placeholder="모든 챌린지" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 챌린지</SelectItem>
              {challenges?.map((challenge) => (
                <SelectItem
                  key={challenge.id}
                  value={challenge.id}
                  className="text-sm"
                >
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleWriteClick}
            className="w-full sm:w-auto text-sm h-9 sm:h-10"
            size="default"
          >
            <PenSquare className="h-4 w-4 mr-1.5 sm:mr-2" />
            게시글 작성
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4">
        {isLoadingPosts && flatPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>게시글을 불러오는 중입니다...</p>
          </div>
        )}

        {isErrorPosts && flatPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">게시글 로드 오류</p>
            <p className="text-sm mt-1">
              데이터를 불러오는데 실패했습니다.{(postsError as Error)?.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() =>
                queryClient.refetchQueries(postQueryKeys.getAll(groupId) as any)
              }
            >
              다시 시도
            </Button>
          </div>
        )}

        {!isLoadingPosts && !isErrorPosts && flatPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Smile className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">
              {selectedChallenge === "all"
                ? "아직 게시글이 없어요"
                : "선택된 챌린지에 대한 게시글이 없어요"}
            </p>
            <p className="text-sm mt-1">첫 게시글을 작성해 보세요!</p>
          </div>
        )}

        {flatPosts.length > 0 && (
          <div
            ref={scrollElementRef}
            className="w-full relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {virtualItems.map((virtualItem) => {
              const post = flatPosts[virtualItem.index];
              if (!post) return null;

              return (
                <div
                  key={virtualItem.key}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    ref={rowVirtualizer.measureElement}
                    style={{
                      paddingBottom: `${ITEM_SPACING_PX}px`,
                    }}
                    data-index={virtualItem.index}
                  >
                    <PostItem
                      post={post}
                      groupId={groupId}
                      onPostClick={handlePostClick}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Trigger / Indicator */}
        <div ref={loadMoreRef} className="flex justify-center py-6 mt-2">
          {isFetchingNextPage && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>게시글 더 불러오는 중...</span>
            </div>
          )}
          {!hasNextPage &&
            flatPosts.length > 0 &&
            !isFetchingNextPage &&
            !isLoadingPosts && (
              <p className="text-muted-foreground text-sm">
                모든 게시글을 다 봤어요!
              </p>
            )}
        </div>
      </CardContent>
    </div>
  );
}
