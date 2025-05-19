"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  PenSquare,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LikeButton } from "@/components/posts/LikeButton";
import Image from "next/image";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import { getPosts, postQueryKeys } from "@/lib/queries/postQuery";
import { IPost } from "@/types";

interface GroupPostsViewProps {
  groupId: string;
}

// 게시글 작성 시간 표시 함수
function getDisplayTime(dateString: string) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now.getTime() - postDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    // 하루 이내면 "n시간 전", "n분 전" 등 상대시간
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    return `${Math.floor(diffHours)}시간 전`;
  } else {
    // 24시간 이상이면 날짜+시간 포맷
    return format(postDate, "yyyy년 M월 d일 a h:mm", { locale: ko });
  }
}

export function GroupPostsView({ groupId }: GroupPostsViewProps) {
  const [page, setPage] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const [imageError, setImageError] = useState(false);
  const paginationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pageSize = 5;

  const { data: challenges } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const { data: postsData, isPending } = useQuery({
    queryKey: postQueryKeys.getAll(
      groupId,
      page,
      pageSize,
      selectedChallenge === "all" ? undefined : selectedChallenge
    ),
    queryFn: () =>
      getPosts(
        groupId,
        page,
        pageSize,
        selectedChallenge === "all" ? undefined : selectedChallenge
      ),
    placeholderData: (prev) => prev,
  });
  const totalPages = Math.ceil((postsData?.total || 0) / pageSize);

  // 선택된 챌린지에 따라 게시글 필터링
  const filteredPosts = useMemo(
    () =>
      postsData?.data?.filter((post) =>
        selectedChallenge === "all"
          ? true
          : post.challenges?.some((ch) => ch.id === selectedChallenge)
      ) || [],
    [postsData, selectedChallenge]
  );

  // 가상화를 위한 ref와 virtualizer 생성
  const listRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredPosts.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const post = filteredPosts[index];
      return post.image_urls?.length ? 350 : 200;
    },
    overscan: 5, // 추가로 렌더링할 아이템 수
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  useEffect(() => {
    filteredPosts?.forEach((post) => {
      post.image_urls?.forEach((url) => {
        const img = new window.Image();
        img.src = url;
      });
    });
  }, [filteredPosts]);

  const handleWriteClick = () => {
    router.push(`/groups/${groupId}/write`);
  };

  // 게시글의 이미지 처리
  const getPostImages = (post: IPost) => {
    return post.image_urls || [];
  };

  const handlePostClick = (postId: string) => {
    router.push(`/groups/${groupId}/posts/${postId}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // 게시글 영역 최상단으로 스크롤

    paginationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const renderPost = useCallback(
    (post: IPost) => {
      const postImages = getPostImages(post);

      return (
        <div
          key={post.id}
          className="border rounded-lg p-4 md:p-5 space-y-3 transition-all hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => handlePostClick(post.id)}
        >
          <div className="flex flex-row items-center gap-3">
            <img
              src={post.author?.avatar_url || "/default-profile.png"}
              alt={post.author!.name}
              className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover"
            />
            <div className="flex-1 ">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <div className="flex flex-col">
                  <span className="font-bold">{post.author?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getDisplayTime(post.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {post.challenges && post.challenges.length > 0 ? (
            post.challenges.map((challenge) => (
              <span
                key={challenge.id}
                className="bg-muted px-1.5 py-0.5 rounded text-xs mt-1 mr-1"
              >
                {challenge.title}
              </span>
            ))
          ) : (
            <span className="bg-muted px-1.5 py-0.5 rounded text-xs mt-1">
              삭제된 챌린지
            </span>
          )}

          <p className="text-sm md:text-base line-clamp-2 text-muted-foreground">
            {post.content}
          </p>

          {postImages.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1 md:gap-2 pt-1">
              {postImages.slice(0, 3).map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-video w-full overflow-hidden rounded-md"
                >
                  <Image
                    onError={() => setImageError(true)}
                    src={imageUrl}
                    alt={`${post.title} 이미지 ${index + 1}`}
                    className="object-cover w-full h-full"
                    width={400}
                    height={300}
                    loading="lazy"
                  />

                  {/* 이미지가 3개 이상이고 현재 3번째 이미지인 경우 ... 표시 */}
                  {index === 2 && postImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{postImages.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex text-muted-foreground gap-3 pt-1">
            <LikeButton
              postId={post.id}
              initialLikeCount={post.likeCount || 0}
              initialLiked={post.isLiked || false}
              size="sm"
              variant="outline"
              groupId={groupId}
            />
            <span
              className="flex items-center gap-2
          border border-gray-200
          rounded-md
          px-3 py-1
          text-xs
          "
            >
              <MessageSquare className="h-4 w-4" /> {post.commentCount}
            </span>
          </div>
        </div>
      );
    },
    [getPostImages, handlePostClick, groupId]
  );

  useEffect(() => {
    const handleResize = () => rowVirtualizer.measure();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <CardTitle className="h-6">게시판 뷰</CardTitle>
          <CardDescription>모임 내 게시글을 확인하세요</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Select
            value={selectedChallenge}
            onValueChange={setSelectedChallenge}
          >
            <SelectTrigger className="w-full sm:w-[200px] md:w-[250px]">
              <SelectValue placeholder="모든 챌린지" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 챌린지</SelectItem>
              {challenges?.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleWriteClick}
            className="flex items-center gap-2 w-full sm:w-auto justify-center md:px-6"
          >
            <PenSquare className="h-4 w-4" />
            <span>글쓰기</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-4 md:space-y-5">
            <div className="text-sm text-muted-foreground mt-2">
              총 {postsData?.total || 0}개의 게시글
            </div>

            {/* 가상화 리스트 컨테이너 */}
            <div
              ref={listRef}
              style={{
                height: "70vh", // 뷰포트 기준 높이 고정
                overflow: "auto",
                position: "relative",
                scrollBehavior: "smooth", // 부드러운 스크롤
              }}
            >
              <div
                className="relative w-full"
                style={{ height: rowVirtualizer.getTotalSize() }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                  <div
                    key={virtualItem.key}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderPost(filteredPosts[virtualItem.index])}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-8" ref={paginationRef}>
              <Pagination>
                <PaginationContent>
                  {/* 이전 페이지 */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) handlePageChange(page - 1);
                      }}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {/* 페이지 번호 */}
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    // 페이지가 많으면 1, ..., n-1, n 형태로 표시
                    if (totalPages > 5) {
                      if (
                        idx === 0 ||
                        idx === totalPages - 1 ||
                        Math.abs(page - (idx + 1)) <= 1
                      ) {
                        return (
                          <PaginationItem key={idx}>
                            <PaginationLink
                              href="#"
                              isActive={page === idx + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(idx + 1);
                              }}
                            >
                              {idx + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (
                        (idx === 1 && page > 3) ||
                        (idx === totalPages - 2 && page < totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={idx}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                    // 페이지가 5 이하일 때는 모두 표시
                    return (
                      <PaginationItem key={idx}>
                        <PaginationLink
                          href="#"
                          isActive={page === idx + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(idx + 1);
                          }}
                        >
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {/* 다음 페이지 */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) handlePageChange(page + 1);
                      }}
                      aria-disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 md:py-20 text-muted-foreground">
            {challenges?.length
              ? "아직 게시글이 없습니다. 첫 게시글을 작성해보세요!"
              : "등록된 챌린지가 없습니다. 챌린지를 먼저 등록해주세요."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
