import React, { useState } from "react";
import NextImage from "next/image";
import { IPost, IChallenge } from "@/types";
import { LikeButton } from "@/components/posts/LikeButton";
import { MessageSquare, ImageOff } from "lucide-react";
import { ko } from "date-fns/locale";
import { format } from "date-fns";

// 게시글 작성 시간 표시 함수
function getDisplayTime(dateString: string) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now.getTime() - postDate.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    // 하루 이내면 "n시간 전", "n분 전" 등 상대시간
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    return `${Math.floor(diffHours)}시간 전`;
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
    <div
      className="bg-card text-card-foreground rounded-lg p-4 md:p-5 space-y-3 shadow-sm transition-colors hover:bg-muted/20 cursor-pointer border"
      onClick={() => onPostClick(post.id)}
      role="article"
      aria-labelledby={`post-title-${post.id}`}
    >
      <div className="flex items-center gap-3">
        <NextImage
          src={post.author?.avatar_url || "/default-profile.png"}
          alt={post.author?.name || "작성자 프로필"}
          width={40}
          height={40}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-muted"
          onError={(e) => (e.currentTarget.src = "/default-profile.png")}
        />
        <div className="flex-1">
          <p className="font-semibold text-sm sm:text-base text-foreground">
            {post.author?.name || "익명"}
          </p>
          <p className="text-xs text-muted-foreground">
            {getDisplayTime(post.created_at)}
          </p>
        </div>
      </div>

      {post.title && (
        <h3
          id={`post-title-${post.id}`}
          className="font-semibold text-lg line-clamp-2 text-foreground"
        >
          {post.title}
        </h3>
      )}

      <p className="text-sm md:text-base line-clamp-3 text-foreground/90 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* 챌린지 정보 표시 */}
      {post.challenges && post.challenges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.challenges.map((challenge: IChallenge) => (
            <span
              key={challenge.id}
              className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {challenge.title}
            </span>
          ))}
        </div>
      )}

      {postImages.length > 0 && (
        <div className="grid gap-1.5 pt-2 grid-cols-3">
          {postImages.slice(0, 3).map((imageUrl, index) => (
            <div
              key={imageUrl + index}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-muted/50"
            >
              {imageLoadError[imageUrl] ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs mt-1">이미지 로드 실패</span>
                </div>
              ) : (
                <NextImage
                  src={imageUrl}
                  alt={`게시글 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  loading="lazy"
                  onError={() => handleImageError(imageUrl)}
                />
              )}
              {index === 2 &&
                postImages.length > 3 &&
                !imageLoadError[imageUrl] && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-base sm:text-lg font-bold">
                      +{postImages.length - 3}
                    </span>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground pt-3 border-t mt-3">
        <LikeButton
          postId={post.id}
          initialLikeCount={post.likeCount || 0}
          initialLiked={post.isLiked || false}
          size="sm"
          variant="ghost"
          groupId={groupId}
        />
        <div className="flex items-center gap-1.5 text-sm">
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
