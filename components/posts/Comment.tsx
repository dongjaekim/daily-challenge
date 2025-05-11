"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface CommentProps {
  comment: IPostComment;
  currentUserId: string;
  postId: string;
  onReplySubmit: (comment: IPostComment) => void;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (comment: IPostComment) => void;
}

export function Comment({
  comment,
  currentUserId,
  postId,
  onReplySubmit,
  onCommentDeleted,
  onCommentUpdated,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();

  const isDeleted =
    comment.is_deleted || comment.content === "삭제된 댓글입니다.";
  const isOwner = comment.user_id === currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReply = comment.parent_id !== null;
  const formattedDate = format(
    new Date(comment.created_at),
    "yyyy. MM. dd. HH:mm",
    { locale: ko }
  );
  const wasEdited = comment.created_at !== comment.updated_at;

  // 아바타 폴백에 표시할 이니셜 생성
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  // API 응답 댓글을 내부 형식으로 변환
  const formatComment = useCallback(
    (apiComment: any): IPostComment => {
      return {
        id: apiComment.id,
        content: apiComment.content,
        created_at: apiComment.created_at || new Date().toISOString(),
        updated_at:
          apiComment.updated_at ||
          apiComment.created_at ||
          new Date().toISOString(),
        user_id: apiComment.user_id || apiComment.author?.id || currentUserId,
        post_id: apiComment.post_id || postId,
        parent_id: apiComment.parent_id || null,
        is_deleted: apiComment.is_deleted || false,
        author: {
          id: apiComment.author?.id || "",
          name: apiComment.author?.name || "",
          avatar_url: apiComment.author?.avatar_url,
          email: apiComment.author?.email,
          created_at: apiComment.author?.created_at,
          updated_at: apiComment.author?.updated_at,
          clerk_id: apiComment.author?.clerk_id,
        },
        isAuthor: apiComment.isAuthor || false,
        replies: apiComment.replies || [],
      };
    },
    [currentUserId, postId]
  );

  const handleEdit = async () => {
    if (isDeleted || !isOwner) return;
    if (!editContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        throw new Error("댓글 수정에 실패했습니다.");
      }

      const updatedComment = await response.json();

      // 댓글 수정 시 기존 replies 유지
      const formattedComment = formatComment(updatedComment);
      formattedComment.replies = comment.replies || [];

      onCommentUpdated(formattedComment);
      setIsEditing(false);

      toast({
        title: "댓글이 수정되었습니다",
      });
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      toast({
        title: "오류",
        description: "댓글 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleted || !isOwner) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soft_delete: true }),
      });

      if (!response.ok) {
        throw new Error("댓글 삭제에 실패했습니다.");
      }

      const result = await response.json();

      if (result.deleted) {
        // 하드 삭제된 경우
        onCommentDeleted(comment.id);
      } else {
        // 소프트 삭제된 경우
        onCommentUpdated({
          ...comment,
          content: "삭제된 댓글입니다.",
          is_deleted: true,
          replies: comment.replies || [], // 댓글의 replies 유지
        });
      }

      toast({
        title: "댓글이 삭제되었습니다",
      });
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      toast({
        title: "오류",
        description: "댓글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <div
      className={`py-4 ${
        comment.parent_id ? "pl-8 border-l" : "border-b"
      } relative`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          {comment.author?.avatar_url && (
            <AvatarImage
              src={comment.author.avatar_url}
              alt={comment.author.name || "사용자"}
            />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(comment.author?.name || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {comment.author?.name || "알 수 없는 사용자"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formattedDate} {wasEdited && !isDeleted && "(수정됨)"}
              </span>
            </div>

            {/* 본인 댓글에만 수정/삭제 버튼 표시 */}
            {!isDeleted && isOwner && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-slate-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-slate-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteAlert(true);
                  }}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEdit}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      수정 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={`mt-1 ${
                isDeleted ? "text-muted-foreground italic" : ""
              }`}
            >
              {isDeleted ? "삭제된 댓글입니다." : comment.content}
            </p>
          )}

          {/* 댓글 작성 도구 - 대댓글이 아닌 경우에만 표시 */}
          {!isDeleted && !isEditing && !isReply && (
            <div className="mt-2 flex items-center gap-2">
              {!isReplying ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReplying(true);
                  }}
                  className="h-7 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  답글
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReplying(false);
                  }}
                  className="h-7 text-xs"
                >
                  답글 취소
                </Button>
              )}
            </div>
          )}

          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentSubmitted={(newComment) => {
                  onReplySubmit(formatComment(newComment));
                  setIsReplying(false);
                }}
                placeholder="답글을 작성하세요..."
                buttonText="답글 작성"
                autoFocus
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 표시 */}
      {hasReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies!.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              postId={postId}
              onReplySubmit={onReplySubmit}
              onCommentDeleted={onCommentDeleted}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 대화상자 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
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
