import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/posts/PostForm";

interface EditPostPageProps {
  params: {
    groupId: string;
    postId: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
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

  const challenges = await supabaseDb.select("challenges", {
    group_id: params.groupId,
    created_by: uuid,
  });

  return (
    <div className="space-y-8">
      <PostForm
        postId={params.postId}
        groupId={params.groupId}
        challenges={challenges}
      />
    </div>
  );
}
