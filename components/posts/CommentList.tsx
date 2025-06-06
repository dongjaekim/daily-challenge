"use client";

import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import { IPostComment } from "@/types";
import { useCreateComment } from "@/lib/mutations/commentMutations"; // 뮤테이션 훅 임포트

interface ICommentListProps {
  postId: string;
  currentUserId: string;
  comments: IPostComment[];
  isCommentsLoading: boolean;
  commentCount: number;
}

export function CommentList({
  postId,
  currentUserId,
  comments,
  isCommentsLoading,
  commentCount,
}: ICommentListProps) {
  const { toast } = useToast();

  // 최상단 댓글 작성을 위한 뮤테이션
  const {
    mutate: createTopLevelComment,
    isPending: isCreatingTopLevelComment,
  } = useCreateComment(postId, {
    onSuccess: () => {
      toast({ description: "댓글이 성공적으로 등록되었습니다." });
    },
    onError: (error) => {
      toast({
        title: "댓글 작성 실패",
        description: error.message || "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleTopLevelCommentSubmit = (values: { content: string }) => {
    createTopLevelComment({
      content: values.content,
      parent_id: null,
    });
  };

  if (isCommentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p>댓글을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="comment-section-title"
      className="pt-6 pb-2 space-y-6"
    >
      <div className="px-1 md:px-0">
        <h2
          id="comment-section-title"
          className="text-xl sm:text-2xl font-semibold flex items-center text-foreground mb-5"
        >
          <MessageCircle className="h-6 w-6 mr-2.5 text-primary" />
          <span>
            {commentCount > 0
              ? `댓글 ${commentCount}개`
              : "첫 댓글을 남겨주세요!"}
          </span>
        </h2>
        <CommentForm
          onSubmit={handleTopLevelCommentSubmit}
          isSubmitting={isCreatingTopLevelComment}
          placeholder="따뜻한 격려와 응원의 댓글을 남겨주세요 :)"
          submitButtonText="댓글 등록"
          className="mb-8"
        />
      </div>

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="divide-y divide-border border-b border-t border-border p-0 md:p-0">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
            />
          ))}
        </div>
      ) : (
        !isCommentsLoading && ( // 로딩 중이 아닐 때만 "댓글 없음" 메시지 표시
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-lg font-medium">아직 댓글이 없습니다.</p>
            <p className="text-sm mt-1">
              가장 먼저 따뜻한 응원의 메시지를 남겨보세요!
            </p>
          </div>
        )
      )}
    </section>
  );
}
