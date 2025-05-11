"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import { IPostComment } from "@/types";

interface ICommentListProps {
  postId: string;
  currentUserId: string;
  comments?: IPostComment[];
  onCommentDeleted?: (commentId: string) => void;
  onCommentSubmitted?: (comment: any) => void;
}

export function CommentList({
  postId,
  currentUserId,
  comments: initialComments,
  onCommentDeleted,
  onCommentSubmitted,
}: ICommentListProps) {
  const [comments, setComments] = useState<IPostComment[]>(
    initialComments || []
  );
  const [isLoading, setIsLoading] = useState(!initialComments);
  const { toast } = useToast();

  // API에서 받은 댓글을 내부 형식으로 완벽하게 변환
  const formatComment = (apiComment: any): IPostComment => {
    return {
      id: apiComment.id,
      content: apiComment.content,
      created_at: apiComment.created_at || new Date().toISOString(),
      updated_at:
        apiComment.updated_at ||
        apiComment.created_at ||
        new Date().toISOString(),
      user_id: apiComment.user_id || apiComment.author?.id || "",
      post_id: apiComment.post_id || postId,
      parent_id: apiComment.parent_id || null,
      author: apiComment.author || { id: "", clerkId: "", name: "" },
      isAuthor: apiComment.isAuthor || false,
      replies: apiComment.replies || [],
    };
  };

  // 초기 댓글 데이터 변환 & 상태 초기화
  useEffect(() => {
    if (initialComments) {
      const formattedComments = initialComments.map((comment) =>
        formatComment(comment)
      );
      setComments(formattedComments);
    }
  }, [initialComments]);

  useEffect(() => {
    // 초기 댓글이 제공되지 않은 경우에만 API에서 가져옴
    if (!initialComments) {
      fetchComments();
    }
  }, [postId, initialComments]);

  const fetchComments = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`);

      if (!response.ok) {
        throw new Error("댓글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      const formattedComments = data.map((comment: any) =>
        formatComment(comment)
      );
      setComments(formattedComments);
    } catch (error) {
      toast({
        title: "오류",
        description: "댓글을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = (newComment: any) => {
    const formattedComment = formatComment(newComment);

    if (formattedComment.parent_id) {
      // 대댓글인 경우, 부모 댓글에 추가
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === formattedComment.parent_id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), formattedComment],
            };
          }
          return comment;
        })
      );
    } else {
      // 일반 댓글인 경우
      setComments((prev) => [...prev, { ...formattedComment, replies: [] }]);
    }

    // 상위 컴포넌트에 알림
    if (onCommentSubmitted) {
      onCommentSubmitted(newComment);
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    // 최상위 댓글인지 확인
    const isRootComment = comments.some((c) => c.id === commentId);

    if (isRootComment) {
      // 최상위 댓글이면 배열에서 제거
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      // 대댓글이면 부모 댓글의 replies에서 제거
      setComments((prev) =>
        prev.map((comment) => ({
          ...comment,
          replies: comment.replies?.filter((r) => r.id !== commentId) || [],
        }))
      );
    }

    // 상위 컴포넌트에 알림
    if (onCommentDeleted) {
      onCommentDeleted(commentId);
    }
  };

  const handleCommentUpdated = (updatedComment: any) => {
    const formattedComment = formatComment(updatedComment);

    // 최상위 댓글인지 확인
    const isRootComment = comments.some((c) => c.id === formattedComment.id);

    if (isRootComment) {
      // 최상위 댓글이면 직접 업데이트
      setComments((prev) =>
        prev.map((c) =>
          c.id === formattedComment.id ? { ...c, ...formattedComment } : c
        )
      );
    } else {
      // 대댓글이면 부모 댓글의 replies에서 업데이트
      setComments((prev) =>
        prev.map((comment) => ({
          ...comment,
          replies:
            comment.replies?.map((r) =>
              r.id === formattedComment.id ? { ...r, ...formattedComment } : r
            ) || [],
        }))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCommentCount = comments.reduce(
    (total, comment) => total + 1 + (comment.replies?.length || 0),
    0
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        댓글 {totalCommentCount > 0 ? `(${totalCommentCount})` : "작성하기"}
      </h3>

      <CommentForm postId={postId} onCommentSubmitted={handleCommentSubmit} />

      {comments.length > 0 ? (
        <div className="mt-8 space-y-0">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
              onReplySubmit={handleCommentSubmit}
              onCommentDeleted={handleCommentDeleted}
              onCommentUpdated={handleCommentUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </div>
      )}
    </div>
  );
}
