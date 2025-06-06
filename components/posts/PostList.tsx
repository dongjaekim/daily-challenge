"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { LikeButton } from "@/components/posts/LikeButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IPost } from "@/types";

interface IPostListProps {
  challengeId: string;
  posts: IPost[];
  userId: string;
  onDelete?: (postId: string) => void;
}

export function PostList({
  challengeId,
  posts,
  userId,
  onDelete,
}: IPostListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<string, number>
  >({});
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // 날짜 형식 변환 헬퍼 함수
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "yyyy년 MM월 dd일", { locale: ko });
    } catch (error) {
      console.error("날짜 형식 변환 오류:", error);
      return "날짜 정보 없음";
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      setIsLoading(true);
      setDeletingPostId(postId);

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("게시글 삭제에 실패했습니다.");
      }

      toast({
        title: "게시글이 삭제되었습니다.",
      });

      // 해당 게시글 찾기
      const deletedPost = posts.find((post) => post.id === postId);

      // 캐시 타임스탬프 업데이트 (그룹 ID가 있는 경우)
      if (deletedPost && deletedPost.group_id) {
        // updateRecordsCacheTimestamp(deletedPost.group_id);
        // updateChallengesCacheTimestamp(deletedPost.group_id);
      }

      if (onDelete) {
        onDelete(postId);
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다.",
        description:
          error instanceof Error
            ? error.message
            : "게시글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setDeletingPostId(null);
      setShowDeleteAlert(false);
      setPostToDelete(null);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteAlert(true);
  };

  const showNextImage = (
    e: React.MouseEvent,
    postId: string,
    imageUrls: string[]
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const currentIndex = currentImageIndex[postId] || 0;
    const nextIndex = (currentIndex + 1) % imageUrls.length;
    setCurrentImageIndex({ ...currentImageIndex, [postId]: nextIndex });
  };

  const showPrevImage = (
    e: React.MouseEvent,
    postId: string,
    imageUrls: string[]
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const currentIndex = currentImageIndex[postId] || 0;
    const prevIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    setCurrentImageIndex({ ...currentImageIndex, [postId]: prevIndex });
  };

  const handlePostClick = (postId: string, groupId: string) => {
    router.push(`/groups/${groupId}/posts/${postId}`);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">아직 게시글이 없습니다.</p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/groups/${challengeId}/posts/new`)}
        >
          첫 게시글 작성하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border p-4 transition-colors hover:bg-slate-50 cursor-pointer"
          onClick={() => handlePostClick(post.id, post.group_id || "")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.author?.avatar_url && (
                <div className="h-8 w-8 rounded-full overflow-hidden relative">
                  <Image
                    src={post.author?.avatar_url || ""}
                    alt={post.author?.name || ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium">{post.author?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            {post.author?.id === userId && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/groups/${post.group_id}/posts/${post.id}/edit`
                    );
                  }}
                >
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(post.id);
                  }}
                  disabled={isLoading && deletingPostId === post.id}
                >
                  {isLoading && deletingPostId === post.id ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 삭제
                      중...
                    </>
                  ) : (
                    "삭제"
                  )}
                </Button>
              </div>
            )}
          </div>

          <p className="mt-2 line-clamp-3 text-muted-foreground">
            {post.content}
          </p>

          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mt-3 relative">
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <Image
                  src={post.image_urls[currentImageIndex[post.id] || 0]}
                  alt={`게시글 이미지 ${currentImageIndex[post.id] || 0 + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {post.image_urls.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80"
                    onClick={(e) => showPrevImage(e, post.id, post.image_urls!)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80"
                    onClick={(e) => showNextImage(e, post.id, post.image_urls!)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.image_urls.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 w-5 rounded-full transition-colors ${
                          idx === (currentImageIndex[post.id] || 0)
                            ? "bg-primary"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 py-2">
            <div
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* <LikeButton
                postId={post.id}
                initialLikeCount={
                  typeof post.likeCount === "number" ? post.likeCount : 0
                }
                initialLiked={post.isLiked || false}
                size="sm"
                variant="ghost"
              /> */}
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>
                {typeof post.commentCount === "number" ? post.commentCount : 0}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* 삭제 확인 대화상자 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDelete(postToDelete)}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
