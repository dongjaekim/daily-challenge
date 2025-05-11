import { Button } from "@/components/ui/button";
import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostDetail } from "@/components/posts/PostDetail";

// 아바타 폴백에 표시할 이니셜 생성 함수
function getInitials(name: string) {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
}

interface IPostPageProps {
  params: {
    groupId: string;
    postId: string;
  };
}

export default async function PostPage({ params }: IPostPageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  // 그룹 멤버 여부 확인
  const memberArr = await supabaseDb.select("group_members", {
    group_id: params.groupId,
    user_id: uuid,
  });

  if (!memberArr.length) {
    return notFound();
  }

  // 게시글 조회 (목록 -> 상세로 넘어가는 동안 삭제되었는지 확인 용도)
  const { data: postData, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      users:user_id (
        id, name, email
      )
    `
    )
    .eq("id", params.postId)
    .eq("group_id", params.groupId)
    .eq("is_deleted", false)
    .single();

  if (error || !postData) {
    console.error("Post not found or error:", error);
    return notFound();
  }

  // 사용자 정보 포맷팅
  const author = postData.users
    ? {
        ...postData.users,
      }
    : null;

  // 최종 게시글 객체 생성
  const post = {
    ...postData,
    author: author,
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex items-start bg-white rounded-lg shadow-sm p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mr-2 sm:mr-6 mt-1 md:h-10"
        >
          <Link
            href={`/groups/${params.groupId}?tab=posts`}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline md:text-base">돌아가기</span>
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <Avatar className="h-8 w-8 hidden sm:flex md:h-10 md:w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(post.author?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {post.title}
              </h1>
              <div className="flex flex-wrap gap-2 text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
                <span className="font-medium">{post.author.name}</span>
                <span>·</span>
                <span>
                  {format(new Date(post.created_at), "yyyy년 MM월 dd일 HH:mm", {
                    locale: ko,
                  })}
                </span>
                <span>·</span>
                <Link
                  href={`/groups/${params.groupId}/challenges/${post.challenge_id}`}
                >
                  <span className="bg-muted px-1.5 py-0.5 rounded text-xs md:text-sm hover:bg-muted/80">
                    {post.challenge?.title || "삭제된 챌린지"}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-0">
        <PostDetail
          groupId={params.groupId}
          challengeId={post.challenge_id}
          postId={params.postId}
          currentUserId={uuid}
        />
      </div>
    </div>
  );
}
