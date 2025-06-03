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
    <div className="space-y-6 pt-2">
      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-foreground border-b pb-3 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <span>
          댓글{" "}
          {commentCount > 0 ? (
            <span className="text-primary font-bold">{commentCount}</span>
          ) : (
            ""
          )}
        </span>
      </h3>

      {/* 최상단 댓글 작성 폼 */}
      <div className="p-1">
        <CommentForm
          onSubmit={handleTopLevelCommentSubmit}
          isSubmitting={isCreatingTopLevelComment}
          placeholder="따뜻한 격려와 응원의 댓글을 남겨주세요 :)"
          submitButtonText="등록"
        />
      </div>

      {comments.length > 0 ? (
        <div className="space-y-4 divide-y divide-border pt-4">
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
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-md">
            <MessageCircle className="mx-auto h-10 w-10 mb-3 text-gray-400" />
            <p className="font-medium">아직 등록된 댓글이 없습니다.</p>
            <p className="text-sm">
              가장 먼저 따뜻한 응원의 메시지를 남겨보세요!
            </p>
          </div>
        )
      )}
    </div>
  );
}
