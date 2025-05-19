import { supabaseDb } from "@/db";
import { NextResponse } from "next/server";
import { getSupabaseUuid } from "@/utils/server-auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content, challengeIds, imageUrls } = body;

    if (!content || !challengeIds || challengeIds.length === 0) {
      return new NextResponse("content, and challengeId are required", {
        status: 400,
      });
    }

    // 그룹 멤버인지 확인
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (!memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }

    // 챌린지들이 해당 그룹에 속하는지 확인 (본인이 등록한 챌린지인지는 제약 걸지 않음)
    const { data: challenges } = await supabase
      .from("challenges")
      .select("*")
      .eq("group_id", params.groupId)
      .in("id", challengeIds);

    // 모든 챌린지가 존재하는지 확인 (배열 길이 비교)
    if (challenges?.length !== challengeIds.length) {
      return new NextResponse("Some challenges not found in this group", {
        status: 404,
      });
    }

    // 동일한 챌린지에 오늘 게시글을 이미 작성했는지 확인
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    ).toISOString();

    const { data: existingPosts } = await supabase
      .from("posts")
      .select(
        `
          id,
          post_challenges!inner(challenge_id)
        `
      )
      .eq("user_id", uuid)
      .eq("is_deleted", false)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay)
      .in("post_challenges.challenge_id", challengeIds);

    if (existingPosts && existingPosts.length > 0) {
      return new NextResponse(
        "이미 오늘 게시글을 작성한 챌린지가 있습니다. 챌린지당 하루에 1개의 게시글만 작성할 수 있습니다.",
        { status: 400 }
      );
    }

    // 이미지 URL 배열 검증
    const validImageUrls = Array.isArray(imageUrls) ? imageUrls : [];

    // 게시글 생성
    const post = await supabaseDb.insert("posts", {
      content,
      user_id: uuid,
      group_id: params.groupId,
      image_urls: validImageUrls.length > 0 ? validImageUrls : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      for (const challengeId of challengeIds) {
        await supabaseDb.insert("post_challenges", {
          post_id: post.id,
          challenge_id: challengeId,
        });
      }
    } catch (postChallengesError) {
      console.error("[POST_CHALLENGES_ERROR]", postChallengesError);
      return new NextResponse("Internal error", { status: 500 });
    }

    try {
      for (const challengeId of challengeIds) {
        await supabaseDb.insert("challenge_progress", {
          challenge_id: challengeId,
          user_id: uuid,
          progress: 1.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (progressError) {
      console.error("[CHALLENGE_PROGRESS_ERROR]", progressError);
      // 챌린지 진행 상태 오류가 있어도 게시글 생성은 실패하지 않도록 처리
    }

    return NextResponse.json(post);
  } catch (error) {
    console.log("[POSTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 그룹 멤버인지 확인
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (!memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }

    // URL에서 쿼리 파라미터 추출
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "5");
    const challengeId = url.searchParams.get("challengeId");

    // 그룹의 게시글 조회 (챌린지 ID로 필터링 가능)
    // 삭제되지 않은 게시글만 조회
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        users:user_id (
          id, name, email, avatar_url
        ),
        post_challenges${challengeId ? "!inner" : ""} (
          challenges:challenge_id (
            id, title
          )
        )
      `,
        { count: "exact" } // 총 개수 가져오기
      )
      .eq("group_id", params.groupId)
      .eq("is_deleted", false) // 삭제되지 않은 게시글만 조회
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1); // 페이지네이션 적용

    if (challengeId) {
      query = query.eq("post_challenges.challenge_id", challengeId);
    }

    const { data, count } = await query;

    // 각 게시글에 좋아요 수와 댓글 수 추가
    const postsWithIsLiked = await Promise.all(
      (data || []).map(async (post) => {
        try {
          const { data: userLike } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", uuid)
            .maybeSingle();

          const userLiked = !!userLike;

          const author = post.users
            ? {
                id: post.users.id,
                name: post.users.name,
                avatar_url: post.users.avatar_url,
              }
            : null;

          const challengeArr =
            post.post_challenges?.map((pc: any) => ({
              id: pc.challenges?.id,
              title: pc.challenges?.title,
            })) ?? [];

          // 명확한 응답 구조 반환
          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user_id: post.user_id,
            group_id: post.group_id,
            image_urls: post.image_urls || [],
            is_deleted: post.is_deleted,
            likeCount: post.like_count,
            commentCount: post.comment_count,
            isLiked: userLiked,
            isAuthor: post.user_id === uuid,
            author,
            challenges: challengeArr,
          };
        } catch (statsError) {
          console.error("[POST_STATS_ERROR]", statsError, post.id);
          // 좋아요 여부 조회 실패해도 게시글 기본 정보는 반환
          return {
            ...post,
            likeCount: 0,
            commentCount: 0,
            isLiked: false,
            isAuthor: post.user_id === uuid,
            author: post.users,
            challenges: [],
            imageUrls: post.image_urls || [],
          };
        }
      })
    );

    return NextResponse.json({ data: postsWithIsLiked, total: count || 0 });
  } catch (error) {
    console.log("[POSTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
