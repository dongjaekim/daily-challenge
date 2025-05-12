import { NextResponse } from "next/server";
import { getSupabaseUuid } from "@/utils/server-auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 게시글 조회
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", params.postId)
      .single();

    if (error) {
      console.error("게시글 조회 오류:", error);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 요청 본문 파싱
    const body = await req.json();
    const { content, imageUrls } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content are required" },
        { status: 400 }
      );
    }

    // 게시글 조회
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", params.postId)
      .eq("user_id", uuid)
      .single();

    if (postError) {
      return NextResponse.json(
        { error: "Post not found or you are not authorized to edit this post" },
        { status: 404 }
      );
    }

    // 게시글 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        content,
        image_urls: Array.isArray(imageUrls) ? imageUrls : post.image_urls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.postId)
      .eq("user_id", uuid)
      .select()
      .single();

    if (updateError) {
      console.error("게시글 업데이트 오류:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "게시글이 성공적으로 수정되었습니다.",
      post: updatedPost,
    });
  } catch (error) {
    console.error("[POST_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 게시글 조회
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", params.postId)
      .single();

    if (postError) {
      console.error("게시글 조회 오류:", postError);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 삭제 권한 확인 (작성자만 삭제 가능)
    if (post.user_id !== uuid) {
      return NextResponse.json(
        { error: "You are not authorized to delete this post" },
        { status: 403 }
      );
    }

    // 게시글의 is_deleted를 true로 업데이트
    const { data, error: updateError } = await supabase
      .from("posts")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.postId)
      .eq("user_id", uuid)
      .select()
      .single();

    if (updateError) {
      console.error("게시글 삭제 표시 오류:", updateError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    // 챌린지 진행 기록 조회 및 삭제
    const challengeId = post.challenge_id;
    const createdDate = new Date(post.created_at);
    const formattedDate = createdDate.toISOString().split("T")[0];
    const startOfDay = new Date(formattedDate).toISOString();
    const endOfDay = new Date(
      new Date(formattedDate).getTime() + 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: progressData, error: progressError } = await supabase
      .from("challenge_progress")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", uuid)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay);

    if (!progressError && progressData && progressData.length > 0) {
      // 해당 날짜의 challenge_progress 삭제
      const { error: deleteError } = await supabase
        .from("challenge_progress")
        .delete()
        .eq("id", progressData[0].id);

      if (deleteError) {
        console.error("챌린지 진행 기록 삭제 오류:", deleteError);
        // 챌린지 진행 기록 삭제 실패해도 게시글 소프트 삭제는 성공한 것으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[POST_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
