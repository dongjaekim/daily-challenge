import { getSupabaseUuid } from "@/utils/server-auth";
import { NextResponse } from "next/server";
import { supabaseDb } from "@/db";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string; memberId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 그룹 멤버 조회
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: params.memberId,
    });

    if (!memberArr[0]) {
      return NextResponse.json(
        { error: "멤버를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(memberArr[0]);
  } catch (error) {
    console.error("[MEMBER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
