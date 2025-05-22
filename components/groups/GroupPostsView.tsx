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
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { PenSquare, Loader2, Smile, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
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

// 게시글 작성 시간 표시 함수
function getDisplayTime(dateString: string) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now.getTime() - postDate.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    // 하루 이내면 "n시간 전", "n분 전" 등 상대시간
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    return `${Math.floor(diffHours)}시간 전`;
  } else if (now.getFullYear() === postDate.getFullYear()) {
    return format(postDate, "M월 d일 a h:mm", { locale: ko });
  } else {
    return format(postDate, "yyyy년 M월 d일 a h:mm", { locale: ko });
  }
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

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
      5, // pageSize: 5개씩
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
      undefined,
      5,
      selectedChallenge === "all" ? undefined : selectedChallenge
    ),
    queryFn: fetchPosts,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.data && lastPage.data.length > 0) {
        if (lastPage.nextPage) {
          return lastPage.nextPage;
        }
      }
      return undefined; // No more pages
    },
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

  const rowVirtualizer = useVirtualizer({
    count: flatPosts.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const post = flatPosts[index];
        if (!post) {
          return 350; // 기본 fallback 높이 (데이터 로드 전 등)
        }

        // 기본 UI 요소 높이
        let estimatedHeight = isMobile ? 140 : 150;

        const lineHeight = isMobile ? 20 : 24;
        const charsPerLine = 30;

        // 내용 높이 추정 (실제 라인 수 기반)
        if (post.content) {
          const contentLength = post.content.length;
          const numLines = Math.max(1, Math.ceil(contentLength / charsPerLine));
          estimatedHeight += 12 + numLines * lineHeight;
        }

        // 챌린지 태그
        if (post.challenges && post.challenges.length > 0) {
          estimatedHeight += 40;
        }

        // 이미지
        if (post.image_urls && post.image_urls.length > 0) {
          estimatedHeight += isMobile ? 80 : 230;
        }

        // 최소/최대 높이 설정 (선택적)
        return Math.max(100, Math.min(estimatedHeight, 600));
      },
      [flatPosts]
    ), // flatPosts가 변경될 때마다 이 함수가 재생성되어 virtualizer에 최신 추정치를 제공
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
  };

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-full">
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
      <CardContent
        ref={scrollElementRef}
        className="flex-grow overflow-y-auto p-2 sm:p-3 md:p-4" // Added flex-grow and overflow-y-auto
        style={{ scrollbarGutter: "stable" }} // Prevents layout shift when scrollbar appears
      >
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
            className="w-full relative" // Removed 'relative' if CardContent is the positioning parent
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
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full py-1.5 sm:py-2" // Spacing between items
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <PostItem
                    post={post}
                    groupId={groupId}
                    onPostClick={handlePostClick}
                  />
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
