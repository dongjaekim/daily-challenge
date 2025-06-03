"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ImageGallery } from "@/components/posts/ImageGallery";
import { LikeButton } from "@/components/posts/LikeButton";
import { CommentList } from "@/components/posts/CommentList";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Loader2,
  MessageSquare,
  Trash,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getPost, postQueryKeys } from "@/lib/queries/postQuery";
import { getComments, commentQueryKeys } from "@/lib/queries/commentQuery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeletePost } from "@/lib/mutations/postMutations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

interface IPostDetailProps {
  groupId: string;
  postId: string;
  currentUserId: string;
}

export function PostDetail({
  groupId,
  postId,
  currentUserId,
}: IPostDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: post,
    isLoading: isPostLoading,
    isError: isPostError,
    error: postFetchError,
  } = useQuery({
    queryKey: postQueryKeys.getOne(postId),
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  const {
    data: comments,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
    error: commentsFetchError,
  } = useQuery({
    queryKey: commentQueryKeys.getAll(postId),
    queryFn: () => getComments(postId),
    enabled: !!post,
  });

  const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost(
    groupId,
    {
      onSuccess: () => {
        toast({ title: "성공", description: "게시글이 삭제되었습니다." });
        router.push(`/groups/${groupId}?tab=posts`);
        router.refresh();
      },
      onError: (error) => {
        toast({
          title: "삭제 오류",
          description: error.message || "게시글 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setShowDeleteDialog(false);
      },
    }
  );

  const handlePostDelete = () => {
    deletePost(postId);
  };

  if (isPostLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">게시글을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isPostError || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">
          게시글을 불러올 수 없습니다
        </h2>
        <p className="text-muted-foreground mb-4">
          {postFetchError?.message ||
            "요청한 게시글을 찾을 수 없거나 로드 중 오류가 발생했습니다."}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/groups/${groupId}?tab=posts`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full -ml-2 sm:ml-0"
              asChild
            >
              <Link href={`/groups/${groupId}?tab=posts`} aria-label="뒤로가기">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">게시글 상세</h1>
          </div>
          <div className="flex items-center gap-2">
            {post.isAuthor && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/groups/${groupId}/posts/${postId}/edit`)
                  }
                >
                  <Edit className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">수정</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeletingPost}
                >
                  {isDeletingPost ? (
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                  ) : (
                    <Trash className="h-4 w-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">삭제</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-6">
        <Card className="overflow-hidden shadow-lg rounded-xl">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border">
                  <AvatarImage
                    src={post.author?.avatar_url || "/default-profile.png"}
                    alt={post.author?.name || "익명 사용자"}
                  />
                  <AvatarFallback>
                    {post.author?.name?.charAt(0) || "익"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-foreground">
                    {post.author?.name || "익명 사용자"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {getDisplayTime(post.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {post.challenges && post.challenges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.challenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/groups/${groupId}/challenges/${challenge.id}`}
                    passHref
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      # {challenge.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert break-words whitespace-pre-wrap mt-2">
              <p>{post.content}</p>
            </div>
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="mt-6 rounded-lg overflow-hidden border">
                <ImageGallery
                  images={post.image_urls}
                  postTitle={`게시글 ${postId}`}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 sm:p-6 bg-muted/30 border-t flex items-center justify-start gap-4 sm:gap-6">
            <LikeButton
              postId={post.id}
              initialLikeCount={post.likeCount || 0}
              initialLiked={post.isLiked || false}
              size="default"
              variant="ghost"
              groupId={groupId}
              className="text-muted-foreground hover:text-primary"
            />
          </CardFooter>
        </Card>

        <div className="mt-8">
          <CommentList
            comments={comments || []}
            postId={post.id}
            currentUserId={currentUserId}
            isCommentsLoading={isCommentsLoading}
            commentCount={post.commentCount}
          />
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              게시글 삭제 확인
            </DialogTitle>
            <DialogDescription>
              정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeletingPost}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handlePostDelete}
              disabled={isDeletingPost}
            >
              {isDeletingPost ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
