"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useToggleLike } from "@/lib/mutations/postMutations";

interface LikeButtonProps {
  groupId: string;
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
  className?: string;
}

export function LikeButton({
  groupId,
  postId,
  initialLikeCount = 0,
  initialLiked = false,
  size = "default",
  variant = "outline",
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const { mutate: toggleLike, isPending } = useToggleLike(groupId, postId, {
    onSuccess: () => {
      setLiked(!liked);
      setLikeCount((prev) => (!liked ? prev + 1 : prev - 1));
    },
    onError: () => {
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant={liked ? "default" : variant}
      size={size}
      onClick={() => toggleLike()}
      disabled={isPending}
      className={`gap-2 ${
        liked ? "bg-rose-500 hover:bg-rose-600 text-white" : ""
      } ${className}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
      )}
      <span>{likeCount}</span>
    </Button>
  );
}
