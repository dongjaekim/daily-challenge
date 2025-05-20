import { supabaseDb } from "@/db";
import { NextResponse } from "next/server";
import { getSupabaseUuid } from "@/utils/server-auth";
import { supabase } from "@/lib/supabase";

// 댓글 작성
export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content, parentId } = body;

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    // 게시글이 존재하는지 확인
    const postArr = await supabaseDb.select("posts", { id: params.postId });
    if (!postArr) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // 부모 댓글이 있는 경우, 존재하는지 확인 및 깊이(depth) 검증
    if (parentId) {
      const parentComment = await supabaseDb.select("post_comments", {
        id: parentId,
      });
      if (!parentComment) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }

      // 부모 댓글이 이미 대댓글인 경우 (parentId가 있는 경우) 더 이상의 대댓글을 달지 못하게 함
      if (parentComment[0].parent_id) {
        return new NextResponse("Maximum comment depth reached (2)", {
          status: 400,
        });
      }
    }

    // 댓글 작성
    const comment = await supabaseDb.insert("post_comments", {
      post_id: params.postId,
      user_id: uuid,
      content,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 작성된 댓글 정보 조회 (사용자 정보 포함)
    const { data: commentWithUser } = await supabase
      .from("post_comments")
      .select(
        `
        *,
        users:user_id (
          id, name, email, avatar_url
        )
      `
      )
      .eq("id", comment.id)
      .single();

    // 사용자 정보
    const author = commentWithUser?.users
      ? {
          ...commentWithUser.users,
        }
      : null;

    return NextResponse.json({
      ...commentWithUser,
      author,
    });
  } catch (error) {
    console.error("[POST_COMMENTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 댓글 목록 조회
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 게시글이 존재하는지 확인
    const postArr = await supabaseDb.select("posts", { id: params.postId });
    if (!postArr) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // 댓글 목록 조회 (사용자 정보 포함, 삭제된 댓글도 포함)
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select(
        `
        *,
        users:user_id (
          id, name, email, avatar_url
        )
      `
      )
      .eq("post_id", params.postId)
      .order("created_at", { ascending: true });

    // 사용자 정보에 avatar_url이 없는 경우 기본 이미지 URL 추가
    const comments =
      commentsData?.map((comment) => {
        const author = comment.users
          ? {
              ...comment.users,
            }
          : null;

        return {
          ...comment,
          author,
        };
      }) || [];

    // 댓글을 계층 구조로 정리
    const rootComments = comments.filter((c) => !c.parent_id);
    const replyComments = comments.filter((c) => c.parent_id);

    // 대댓글을 부모 댓글에 연결
    const hierarchy = rootComments.map((rootComment) => {
      const replies = replyComments.filter(
        (reply) => reply.parent_id === rootComment.id
      );
      return {
        ...rootComment,
        replies,
      };
    });

    return NextResponse.json(hierarchy);
  } catch (error) {
    console.error("[POST_COMMENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
