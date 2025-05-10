"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePostsStore } from "@/store/posts";

interface LikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  initialLiked?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onLikeToggle?: (isLiked: boolean) => void;
  groupId?: string; // 그룹 ID (스토어 업데이트용)
}

export function LikeButton({
  postId,
  initialLikeCount = 0,
  initialLiked = false,
  size = "default",
  variant = "outline",
  onLikeToggle,
  groupId,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 게시글 스토어 접근
  const toggleLike = usePostsStore((state) => state.toggleLike);

  useEffect(() => {
    let isMounted = true;

    // 초기 좋아요 상태 조회
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/likes`);

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setLiked(data.hasLiked);
            setLikeCount(data.totalLikes || 0);
          }
        }
      } catch (error) {
        console.error("좋아요 상태 조회 실패:", error);
      }
    };

    // 초기값이 이미 설정되어 있으면 API 호출 건너뛰기
    if (initialLiked !== undefined && initialLikeCount !== undefined) {
      return;
    }

    fetchLikeStatus();

    return () => {
      isMounted = false;
    };
  }, [postId, initialLiked, initialLikeCount]);

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: "POST",
      });

      if (response.ok) {
        const { liked: isLiked } = await response.json();

        // UI 업데이트
        setLiked(isLiked);
        setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));

        // 스토어 업데이트 (그룹 ID가 있는 경우)
        if (groupId) {
          toggleLike(groupId, postId, isLiked);
        }

        // 콜백 호출
        if (onLikeToggle) {
          onLikeToggle(isLiked);
        }
      } else {
        throw new Error("좋아요 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={liked ? "default" : variant}
      size={size}
      onClick={handleLike}
      disabled={isLoading}
      className={`gap-2 ${
        liked ? "bg-rose-500 hover:bg-rose-600 text-white" : ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
      )}
      <span>{likeCount}</span>
    </Button>
  );
}
