"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

interface CommentFormValues {
  content: string;
}

interface ICommentFormProps {
  onSubmit: (values: CommentFormValues) => void; // 뮤테이션 실행 함수 등을 호출
  isSubmitting: boolean; // 부모 컴포넌트에서 뮤테이션 로딩 상태 전달
  initialContent?: string;
  placeholder?: string;
  submitButtonText?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  initialContent = "",
  placeholder = "댓글을 남겨주세요",
  submitButtonText = "댓글 등록",
  autoFocus = false,
  onCancel,
  className,
}: ICommentFormProps) {
  const [content, setContent] = useState("");

  // initialContent가 외부에서 변경될 경우 content 상태 업데이트
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }
    onSubmit({ content });

    if (!initialContent) {
      // 새 댓글 작성 시에만 초기화 (수정 시에는 유지)
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="resize-none min-h-[70px] sm:min-h-[80px] text-sm rounded-md border-border focus-visible:ring-1 focus-visible:ring-ring"
        autoFocus={autoFocus}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-accent-foreground"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
          className="min-w-[90px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              작성 중...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitButtonText}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
