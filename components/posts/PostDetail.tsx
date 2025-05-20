"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ImageGallery } from "@/components/posts/ImageGallery";
import { LikeButton } from "@/components/posts/LikeButton";
import { CommentList } from "@/components/posts/CommentList";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Loader2, MessageSquare, Trash } from "lucide-react";
import Link from "next/link";
import { getPost, postQueryKeys } from "@/lib/queries/postQuery";
import { getComments, commentQueryKeys } from "@/lib/queries/commentQuery";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeletePost } from "@/lib/mutations/postMutations";
import {
  useCreateComment,
  useDeleteComment,
} from "@/lib/mutations/commentMutations";

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
  const { data: post } = useQuery({
    queryKey: postQueryKeys.getOne(postId),
    queryFn: () => getPost(postId),
  });

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: commentQueryKeys.getAll(postId),
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });

  const { mutate: deletePost } = useDeletePost(postId);
  const { mutate: createComment } = useCreateComment(postId);
  const { mutate: deleteComment } = useDeleteComment(postId);

  const queryClient = useQueryClient();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleLikeToggle = (newIsLiked: boolean) => {
    // setIsLiked(newIsLiked);
    // setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
  };

  const handleCommentSubmit = (newComment: any) => {
    createComment(newComment, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.getAll(postId),
        });
        queryClient.invalidateQueries({
          queryKey: postQueryKeys.getOne(postId),
        });
      },
    });
  };

  const handleCommentDelete = (commentId: string) => {
    deleteComment(commentId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.getAll(postId),
        });
        queryClient.invalidateQueries({
          queryKey: postQueryKeys.getOne(postId),
        });
      },
    });
  };

  const handlePostDelete = async () => {
    setIsDeleteLoading(true);

    try {
      await deletePost(postId);

      toast({
        title: "성공",
        description: "게시글이 삭제되었습니다",
      });

      router.push(`/groups/${groupId}?tab=posts`);
      router.refresh();
    } catch (e) {
      toast({
        title: "오류",
        description: "게시글 삭제 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // post가 없을 때 처리
  if (!post) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between bg-white rounded-lg p-4 md:p-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-2 sm:mr-6 mt-1 md:h-10"
          >
            <Link
              href={`/groups/${groupId}?tab=posts`}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline md:text-base">뒤로가기</span>
            </Link>
          </Button>

          <div className="flex flex-row items-center gap-3">
            <img
              src={post.author?.avatar_url || "/default-profile.png"}
              alt={post.author?.name}
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
            {post.challenges && post.challenges.length > 0 ? (
              post.challenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/groups/${groupId}/challenges/${challenge.id}`}
                >
                  <span
                    key={challenge.id}
                    className="bg-muted px-1.5 py-0.5 rounded text-xs mt-1 mr-1"
                  >
                    {challenge.title}
                  </span>
                </Link>
              ))
            ) : (
              <span className="bg-muted px-1.5 py-0.5 rounded text-xs mt-1">
                삭제된 챌린지
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start sm:items-end">
          {post.isAuthor && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/groups/${post.group_id}/posts/${post.id}/edit`)
                }
                size="sm"
                className="md:h-10 md:px-4 md:py-2 md:text-base"
              >
                <Edit className="h-4 w-4 mr-2 md:h-5 md:w-5" />
                수정
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                className="md:h-10 md:px-4 md:py-2 md:text-base"
              >
                <Trash className="h-4 w-4 mr-2 md:h-5 md:w-5" />
                삭제
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 md:space-y-8 p-4 md:p-6">
        <div className="prose prose-slate max-w-none md:prose-lg">
          <p className="whitespace-pre-wrap text-base md:text-lg">
            {post.content}
          </p>
        </div>

        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mt-4 md:mt-6">
            <ImageGallery images={post.image_urls} postTitle={post.title} />
          </div>
        )}

        <div className="flex items-center space-x-4 pt-4 md:pt-6 border-t">
          <LikeButton
            postId={post.id}
            initialLikeCount={post.likeCount}
            initialLiked={post.isLiked}
            onLikeToggle={handleLikeToggle}
          />
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-1" />
            <span className="text-sm md:text-base">
              {post.commentCount}개의 댓글
            </span>
          </div>
        </div>

        <div className="pt-6 md:pt-8">
          {isCommentsLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <CommentList
              comments={comments}
              postId={post.id}
              currentUserId={currentUserId}
              onCommentSubmitted={handleCommentSubmit}
              onCommentDeleted={handleCommentDelete}
            />
          )}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>
              정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handlePostDelete}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  삭제하는 중입니다
                </>
              ) : (
                "삭제"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
