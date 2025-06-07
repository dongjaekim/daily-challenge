"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import { IPost, IChallenge } from "@/types";
import { LikeButton } from "@/components/posts/LikeButton";
import { MessageSquare, ImageOff } from "lucide-react";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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

interface PostItemProps {
  post: IPost;
  groupId: string;
  onPostClick: (postId: string) => void;
}

export function PostItem({ post, groupId, onPostClick }: PostItemProps) {
  const postImages = post.image_urls || [];
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>(
    {}
  );

  const handleImageError = (url: string) => {
    setImageLoadError((prev) => ({ ...prev, [url]: true }));
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary/20 rounded-xl overflow-hidden"
      onClick={() => onPostClick(post.id)}
      role="article"
      aria-labelledby={`post-title-${post.id}`}
    >
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage
            src={post.author?.avatar_url || "/default-profile.png"}
            alt={post.author?.name || "작성자 프로필"}
          />
          <AvatarFallback>
            {post.author?.name?.charAt(0) || "익"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm sm:text-base text-foreground">
            {post.author?.name || "익명 사용자"}
          </p>
          <p className="text-xs text-muted-foreground">
            {getDisplayTime(post.created_at)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-sm md:text-base line-clamp-3 text-foreground/90 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {/* 챌린지 정보 표시 */}
        {post.challenges && post.challenges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.challenges.map((challenge: IChallenge) => (
              <Badge key={challenge.id} variant="secondary">
                # {challenge.title}
              </Badge>
            ))}
          </div>
        )}

        {postImages.length > 0 && (
          <div className="grid gap-2 pt-1 grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
            {postImages.slice(0, 5).map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="relative aspect-square w-full overflow-hidden rounded-md bg-muted"
              >
                {imageLoadError[imageUrl] ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
                    <ImageOff className="h-6 w-6" />
                  </div>
                ) : (
                  <NextImage
                    src={imageUrl}
                    alt={`게시글 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 20vw"
                    loading="lazy"
                    onError={() => handleImageError(imageUrl)}
                  />
                )}
                {index === 4 &&
                  postImages.length > 5 &&
                  !imageLoadError[imageUrl] && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white text-lg">
                      +{postImages.length - 5}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pl-6 pt-3 border-t bg-muted/30">
        <div
          className="flex w-full items-center gap-4 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
          role="group"
        >
          <LikeButton
            postId={post.id}
            initialLikeCount={post.likeCount || 0}
            initialLiked={post.isLiked || false}
            size="sm"
            variant="ghost"
            groupId={groupId}
            className="-ml-2 hover:text-rose-500" // 아이콘 색상 등
          />
          <div
            className="flex items-center gap-1.5 text-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onPostClick(post.id);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentCount || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
