import { getSupabaseUuid } from "@/utils/server-auth";
import { NextResponse } from "next/server";
import { supabaseDb } from "@/db";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;

  // 이미 가입 여부 확인
  const existingMember = await supabaseDb.select("group_members", {
    group_id: params.groupId,
    user_id: userId,
  });

  if (!existingMember.length) {
    await supabaseDb.insert("group_members", {
      group_id: params.groupId,
      user_id: userId,
      role: "member",
    });
  }

  return new Response("OK", { status: 200 });
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

    // 그룹 멤버 조회
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
    });

    // 그룹 멤버 여부 확인
    if (memberArr.some((m: any) => m.user_id === uuid)) {
      return new NextResponse("Unauthorized - Not member of group", {
        status: 401,
      });
    }

    return NextResponse.json(memberArr);
  } catch (error) {
    console.error("[MEMBERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
