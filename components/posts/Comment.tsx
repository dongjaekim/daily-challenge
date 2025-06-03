"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CommentForm } from "./CommentForm";
import { Edit, Loader2, Reply, Trash } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IPostComment } from "@/types";
import {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/lib/mutations/commentMutations"; // 모든 댓글 뮤테이션 훅 임포트

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

interface CommentProps {
  comment: IPostComment;
  currentUserId: string;
  postId: string;
  isReply?: boolean;
}

export function Comment({
  comment,
  currentUserId,
  postId,
  isReply = false,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();

  const isDeleted =
    comment.is_deleted || comment.content === "삭제된 댓글입니다.";
  const isOwner = comment.user_id === currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const formattedDate = getDisplayTime(comment.created_at);
  const wasEdited = comment.created_at !== comment.updated_at;

  // 아바타 폴백에 표시할 이니셜 생성
  const getInitials = (name?: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }
    return name.substring(0, Math.min(name.length, 2)).toUpperCase();
  };

  // 댓글 관련 뮤테이션 훅 사용
  const { mutate: createReplyMutate, isPending: isSubmittingReply } =
    useCreateComment(postId, {
      onSuccess: () => {
        toast({ description: "답글이 작성되었습니다." });
        setIsReplying(false); // 답글 폼 닫기
      },
      onError: (error) =>
        toast({
          title: "답글 작성 실패",
          description: error.message,
          variant: "destructive",
        }),
    });

  const { mutate: updateCommentMutate, isPending: isSubmittingEdit } =
    useUpdateComment(postId, {
      onSuccess: () => {
        toast({ description: "댓글이 수정되었습니다." });
        setIsEditing(false);
      },
      onError: (error) =>
        toast({
          title: "댓글 수정 실패",
          description: error.message,
          variant: "destructive",
        }),
    });

  const { mutate: deleteCommentMutate, isPending: isDeleting } =
    useDeleteComment(postId, {
      onSuccess: () => {
        toast({ description: "댓글이 삭제되었습니다." });
      },
      onError: (error) =>
        toast({
          title: "댓글 삭제 실패",
          description: error.message,
          variant: "destructive",
        }),
      onSettled: () => setShowDeleteAlert(false),
    });

  const handleEditSubmit = (updatedContent: string) => {
    if (isDeleted || !isOwner || !updatedContent.trim()) return;

    updateCommentMutate({
      id: comment.id,
      content: updatedContent,
    });
  };

  const handleDeleteConfirm = () => {
    if (isDeleted || !isOwner) return;
    deleteCommentMutate(comment.id);
  };

  const handleReplyFormSubmit = (values: { content: string }) => {
    createReplyMutate({
      content: values.content,
      parent_id: comment.id,
    });
  };

  const authorName = comment.author?.name || "익명 사용자";
  const avatarUrl = comment.author?.avatar_url;

  return (
    <div
      className={`py-4 ${
        isReply
          ? "ml-6 sm:ml-8 pl-4 border-l border-dashed"
          : "border-b border-border last:border-b-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className={`h-8 w-8 ${isReply ? "h-7 w-7" : ""}`}>
          <AvatarImage src={avatarUrl} alt={authorName} />
          <AvatarFallback
            className={`text-xs ${
              isReply ? "text-[10px]" : ""
            } bg-muted text-muted-foreground`}
          >
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {authorName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formattedDate} {wasEdited && !isDeleted && "(수정됨)"}
              </span>
            </div>

            {/* 본인 댓글에만 수정/삭제 버튼 표시 */}
            {!isDeleted && isOwner && !isEditing && (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(comment.content);
                  }}
                  aria-label="댓글 수정"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  aria-label="댓글 삭제"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={({ content }) => {
                  handleEditSubmit(content);
                }}
                isSubmitting={isSubmittingEdit}
                initialContent={editContent}
                submitButtonText="수정 완료"
                placeholder="댓글 수정..."
                onCancel={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                autoFocus
                className="!space-y-2"
              />
            </div>
          ) : (
            <p
              className={`mt-1.5 leading-relaxed ${
                isDeleted
                  ? "text-muted-foreground italic"
                  : "text-foreground/90"
              }`}
            >
              {comment.content}
            </p>
          )}

          {/* 답글 - 삭제된 댓글이나 수정 중이 아닌 경우에만 표시 */}
          {!isDeleted && !isEditing && !isReply && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying((prev) => !prev)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                {isReplying ? "답글 취소" : "답글 달기"}
              </Button>
            </div>
          )}

          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3 pl-0 sm:pl-0">
              <CommentForm
                onSubmit={handleReplyFormSubmit}
                isSubmitting={isSubmittingReply}
                placeholder={`${authorName}님에게 답글 작성...`}
                submitButtonText="답글 등록"
                autoFocus
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 표시 */}
      {hasReplies && (
        <div className="mt-3 space-y-0">
          {comment.replies!.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              postId={postId}
              isReply={true}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 대화상자 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
