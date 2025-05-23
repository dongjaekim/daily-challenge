import { PostForm } from "@/components/posts/PostForm";
import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";

interface IWritePageProps {
  params: {
    groupId: string;
  };
}

export default async function WritePage({ params }: IWritePageProps) {
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

  // 해당 그룹의 챌린지 목록 조회
  const challenges = await supabaseDb.select("challenges", {
    group_id: params.groupId,
    created_by: uuid,
  });

  return (
    <div className="space-y-6">
      {challenges.length === 0 ? (
        <div className="p-6 text-center bg-muted rounded-md">
          <p className="text-lg font-medium">아직 등록된 챌린지가 없습니다.</p>
          <p className="text-muted-foreground mt-1">
            게시글을 작성하기 전에 먼저 챌린지를 등록해주세요.
          </p>
        </div>
      ) : (
        <PostForm groupId={params.groupId} challenges={challenges} />
      )}
    </div>
  );
}
