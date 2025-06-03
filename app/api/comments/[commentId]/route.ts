import { NextResponse } from "next/server";
import { getSupabaseUuid } from "@/utils/server-auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 요청 본문 파싱
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content are required" },
        { status: 400 }
      );
    }

    // 댓글 조회
    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .select("*")
      .eq("id", params.commentId)
      .single();

    if (commentError) {
      console.error("댓글 조회 오류:", commentError);
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 수정 권한 확인 (작성자만 수정 가능)
    if (comment.user_id !== uuid) {
      return NextResponse.json(
        { error: "You are not authorized to update this comment" },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from("post_comments")
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.commentId)
      .eq("user_id", uuid)
      .select()
      .single();

    if (updateError) {
      console.error("댓글 수정 표시 오류:", updateError);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "댓글이 성공적으로 수정되었습니다.",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("[COMMENT_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 게시글 조회
    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .select("*")
      .eq("id", params.commentId)
      .single();

    if (commentError) {
      console.error("댓글 조회 오류:", commentError);
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 삭제 권한 확인 (작성자만 삭제 가능)
    if (comment.user_id !== uuid) {
      return NextResponse.json(
        { error: "You are not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // 댓글의 is_deleted를 true로 업데이트
    const { error: updateError } = await supabase
      .from("post_comments")
      .update({
        content: "삭제된 댓글입니다.",
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.commentId)
      .eq("user_id", uuid)
      .select()
      .single();

    if (updateError) {
      console.error("댓글 삭제 표시 오류:", updateError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "댓글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[COMMENT_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
