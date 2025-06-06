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
    const { challengeId } = body;

    if (!challengeId) {
      return new NextResponse("Challenge ID is required", { status: 400 });
    }

    // 그룹 멤버 여부 확인
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }

    // 챌린지가 해당 그룹에 속하는지 확인
    const challengeArr = await supabaseDb.select("challenges", {
      id: challengeId,
      group_id: params.groupId,
    });

    if (!challengeArr.length) {
      return new NextResponse("Challenge not found in this group", {
        status: 404,
      });
    }

    const { data } = await supabaseDb.insert("challenge_progress", {
      challenge_id: challengeId,
      user_id: uuid,
      progress: 1.0,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.log("[CHALLENGE_RECORDS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const monthly = searchParams.get("monthly");

    // 직접 쿼리 작성 - challenge_progress 테이블과 users, challenges 테이블 조인
    let query = supabase
      .from("challenge_progress")
      .select(
        `
        *,
        user:user_id (
          id, name, email, avatar_url
        ),
        challenge:challenge_id!inner (
          id, title, description, group_id
        )
      `
      )
      .eq("challenge_id.group_id", params.groupId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 시작일 필터
    if (monthly) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      query = query
        .gte("created_at", `${startOfMonth}T00:00:00`)
        .lte("created_at", `${endOfMonth}T23:59:59`);
    }

    // 쿼리 실행 및 정렬
    const { data } = await query.order("created_at", {
      ascending: false,
    });

    return NextResponse.json(data || []);
  } catch (error) {
    console.log("[CHALLENGE_RECORDS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
