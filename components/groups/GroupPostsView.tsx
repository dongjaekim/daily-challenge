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
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    // 하루 이내면 "n시간 전", "n분 전" 등 상대시간
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    return `${diffHours}시간 전`;
  } else if (now.getFullYear() === postDate.getFullYear()) {
    return format(postDate, "M월 d일 a h:mm", { locale: ko });
  } else {
    return format(postDate, "yyyy년 M월 d일 a h:mm", { locale: ko });
  }
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

const ITEM_SPACING_PX = 8;

// PostItem의 구조를 기반으로 한 높이 추정 상수 (Tailwind 기본값 기준, 1rem = 16px)
// 필요시 isMobile 조건에 따라 다른 값을 사용하도록 확장 가능
const POST_ITEM_STYLE_CONSTANTS = {
  ROOT_PADDING_Y_DESKTOP: 20 * 2, // p-5 (1.25rem * 2)
  ROOT_PADDING_Y_MOBILE: 16 * 2, // p-4 (1rem * 2)
  SPACE_Y: 12, // space-y-3 (0.75rem)
  PROFILE_AREA_HEIGHT_DESKTOP: 44, // 아바타 40px + 여유
  PROFILE_AREA_HEIGHT_MOBILE: 40, // 아바타 36px + 여유
  CONTENT_LINE_HEIGHT_DESKTOP: 24, // text-base (1rem * 1.5)
  CONTENT_LINE_HEIGHT_MOBILE: 20, // text-sm (0.875rem * 1.4 approx)
  CHALLENGE_TAG_AREA_ONE_LINE_HEIGHT: 22, // 태그 한 줄 높이 (py-1, 폰트, pt-1 컨테이너 패딩 포함)
  IMAGE_AREA_CALCULATED_HEIGHT_DESKTOP: 195,
  IMAGE_AREA_CALCULATED_HEIGHT_MOBILE: 90,
  IMAGE_AREA_PT: 4, // pt-2 for image grid
  ACTION_BUTTON_AREA_HEIGHT: 61, // 아이콘/텍스트 높이 + pt-3 (12px) + border-t (1px)
  MIN_CALCULATED_HEIGHT_DESKTOP: 140, // 내용이 거의 없을 때의 최소 추정 높이
  MIN_CALCULATED_HEIGHT_MOBILE: 120,
  MAX_CALCULATED_HEIGHT: 700, // 최대 추정 높이
  CONTENT_CHARS_PER_LINE_DESKTOP: 111,
  CONTENT_CHARS_PER_LINE_MOBILE: 35,
};

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
      selectedChallenge === "all" ? undefined : selectedChallenge
    ),
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => {
      if (lastPage?.data && lastPage.data.length > 0) {
        return lastPage.nextPage ?? undefined;
      }
      return undefined;
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
  const styles = POST_ITEM_STYLE_CONSTANTS; // 짧게 사용하기 위함

  const currentItemSpacing = isMobile ? ITEM_SPACING_PX : ITEM_SPACING_PX * 1.5; // e.g. 8px mobile, 12px desktop

  const rowVirtualizer = useVirtualizer({
    count: flatPosts.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const post = flatPosts[index];
        const componentId = `post-${post?.id?.slice(-5) || index}`; // 디버깅용 ID

        if (!post) {
          console.log(`[${componentId}] Fallback size`);
          // Fallback 높이도 좀 더 현실적으로 조정 (예: 평균 아이템 높이)
          return (
            (isMobile
              ? styles.MIN_CALCULATED_HEIGHT_MOBILE
              : styles.MIN_CALCULATED_HEIGHT_DESKTOP) +
            currentItemSpacing +
            50
          );
        }

        let estimatedHeight = 0;
        let accumulatedHeightLog = ""; // 각 단계별 높이 로깅용
        let elementCount = 0; // space-y 적용을 위한 요소 카운트

        const addHeight = (
          label: string,
          heightToAdd: number,
          isSpacedElement: boolean = true
        ) => {
          if (isSpacedElement && elementCount > 0 && heightToAdd > 0) {
            // 실제 요소가 추가될 때만 space 더함
            estimatedHeight += styles.SPACE_Y;
            accumulatedHeightLog += ` +spaceY(${styles.SPACE_Y})`;
          }
          estimatedHeight += heightToAdd;
          accumulatedHeightLog += ` +${label}(${heightToAdd})`;
          if (isSpacedElement && heightToAdd > 0) {
            // 높이가 0인 요소는 카운트 안 함
            elementCount++;
          }
        };

        // 1. 루트 패딩 (상하) - 이것은 요소 간 간격(spaceY)의 대상이 아님
        const rootPadding = isMobile
          ? styles.ROOT_PADDING_Y_MOBILE
          : styles.ROOT_PADDING_Y_DESKTOP;
        addHeight("rootPadding", rootPadding, false);

        // 2. 프로필 영역 (항상 존재)
        const profileHeight = isMobile
          ? styles.PROFILE_AREA_HEIGHT_MOBILE
          : styles.PROFILE_AREA_HEIGHT_DESKTOP;
        addHeight("profile", profileHeight);

        // 3. 내용 영역
        let contentCalculatedHeight = 0;
        if (post.content && post.content.trim() !== "") {
          const lineHeight = isMobile
            ? styles.CONTENT_LINE_HEIGHT_MOBILE
            : styles.CONTENT_LINE_HEIGHT_DESKTOP;
          const charsPerLine = isMobile
            ? styles.CONTENT_CHARS_PER_LINE_MOBILE
            : styles.CONTENT_CHARS_PER_LINE_DESKTOP;

          // 문자 가중치 계산 함수
          const getCharDisplayWeight = (char: string): number => {
            // 1. 한글 (가 ~ 힣)
            if (char >= "\uAC00" && char <= "\uD7A3") {
              return 1.52; // 예시 값, 실제 폰트와 화면에서 알파벳 대비 한글 너비 비율로 조정
            }

            // 2. 라틴 알파벳 (소문자) - 기준 가중치
            if ((char >= "a" && char <= "z") || char == "*") {
              if (["w", "m"].includes(char)) return 1.5;
              if (char == "r") return 0.75;
              if (["t", "f"].includes(char)) return 0.6;
              if (["i", "j", "l"].includes(char)) return 0.47;
              return 1.0;
            }

            // 3. 라틴 알파벳 (대문자)
            if (char >= "A" && char <= "Z") {
              if (char == "I") return 0.47;
              return 1.25;
            }

            // 4. 숫자 (0-9)
            if (char >= "0" && char <= "9") {
              if (char == "1") return 0.72;
              return 1.1; // 알파벳보다 약간 좁다고 가정
            }

            // 6. 매우 좁은 특수문자 (마침표, 쉼표 등)
            if ([" ", ".", ",", ";", ":", "!", "'", "`", "\\"].includes(char)) {
              return 0.5;
            }

            if (["|"].includes(char)) {
              return 0.6;
            }

            if (["-", '"', "_", "^"].includes(char)) {
              return 0.82;
            }

            if (["?"].includes(char)) {
              return 0.9;
            }

            if (["#", "$"].includes(char)) {
              return 1.1;
            }

            if (["~", "=", "+"].includes(char)) {
              return 1.18;
            }

            // 7. 괄호류 및 일반적인 구두점 (하이픈보다는 넓고 알파벳보다는 좁거나 비슷할 수 있음)
            if (["(", ")", "[", "]", "{", "}", "/"].includes(char)) {
              return 0.7;
            }

            // 8. 너비가 알파벳과 유사하거나 약간 넓을 수 있는 특수문자
            if (["@", "%", "&", "<", ">"].includes(char)) {
              return 1.71; // 또는 1.0, 혹은 개별 조정
            }

            // 기타 위에 정의되지 않은 문자 (기본값)
            return 1.0; // 일단 알파벳과 동일하게 처리, 필요시 확장
          };

          let totalEstimatedLines = 0;
          const linesArray = post.content.split("\n");

          linesArray.forEach((lineSegment, i) => {
            let linesForSegment = 0;
            if (lineSegment.length === 0) {
              // 명시적인 개행으로 생긴 빈 줄
              linesForSegment = 1;
            } else {
              let weightedLineLength = 0;
              for (let k = 0; k < lineSegment.length; k++) {
                weightedLineLength += getCharDisplayWeight(lineSegment[k]);
              }
              linesForSegment = Math.ceil(weightedLineLength / charsPerLine);
              console.log(
                `[Debug] Segment ${i} ("${lineSegment}"): rawLength=${lineSegment.length}, weightedLength=${weightedLineLength}, linesForSegment=${linesForSegment}`
              );
            }
            totalEstimatedLines += linesForSegment;
          });

          let actualContentLines = totalEstimatedLines;
          if (post.content.trim().length > 0 && actualContentLines === 0) {
            actualContentLines = 1;
          }

          const MAX_CONTENT_LINES = 3; // PostItem의 line-clamp-3
          actualContentLines = Math.min(actualContentLines, MAX_CONTENT_LINES);

          // 최종적으로 내용이 없으면 높이도 0, 있으면 계산된 높이
          if (actualContentLines > 0) {
            contentCalculatedHeight = actualContentLines * lineHeight;
          } else {
            contentCalculatedHeight = 0;
          }
        }
        if (contentCalculatedHeight > 0)
          addHeight("content", contentCalculatedHeight);

        // 4. 챌린지 태그 영역
        let challengeCalculatedHeight = 0;
        if (post.challenges && post.challenges.length > 0) {
          // 챌린지 태그가 여러 줄로 늘어날 수 있지만, 여기서는 한 줄로 가정.
          // 실제로는 (챌린지 개수 * 태그 너비) / 사용 가능 너비 로 줄 수 계산 가능
          challengeCalculatedHeight = styles.CHALLENGE_TAG_AREA_ONE_LINE_HEIGHT;
        }
        if (challengeCalculatedHeight > 0)
          addHeight("challenge", challengeCalculatedHeight);

        // 5. 이미지 영역
        let imageCalculatedHeight = 0;
        if (post.image_urls && post.image_urls.length > 0) {
          imageCalculatedHeight =
            (isMobile
              ? styles.IMAGE_AREA_CALCULATED_HEIGHT_MOBILE
              : styles.IMAGE_AREA_CALCULATED_HEIGHT_DESKTOP) +
            styles.IMAGE_AREA_PT;
        }
        if (imageCalculatedHeight > 0)
          addHeight("image", imageCalculatedHeight);

        // 6. 하단 액션 버튼 영역 (항상 존재)
        addHeight("actionButtons", styles.ACTION_BUTTON_AREA_HEIGHT);

        // 최소/최대 높이 제한
        const minHeight = isMobile
          ? styles.MIN_CALCULATED_HEIGHT_MOBILE
          : styles.MIN_CALCULATED_HEIGHT_DESKTOP;
        estimatedHeight = Math.max(minHeight, estimatedHeight);
        estimatedHeight = Math.min(
          estimatedHeight,
          styles.MAX_CALCULATED_HEIGHT
        );

        const finalSize = estimatedHeight + currentItemSpacing;
        console.log(
          `[${componentId}] Content: "${post.content?.substring(
            0,
            20
          )}..." Imgs: ${
            post.image_urls?.length || 0
          } TotalEst: ${estimatedHeight}, Final: ${finalSize}, Details: ${accumulatedHeightLog}`
        );

        return finalSize;
      },
      [flatPosts, isMobile, currentItemSpacing, styles] // styles 추가
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
    scrollElementRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
        className="flex-grow overflow-y-auto p-2 sm:p-3 md:p-4"
        style={{ scrollbarGutter: "stable" }}
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
                  ref={(el) => {
                    if (el) {
                      rowVirtualizer.measureElement(el);
                    }
                  }}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div style={{ paddingBottom: `${currentItemSpacing}px` }}>
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
