import { NextResponse } from "next/server";
import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";

export async function GET() {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 사용자가 속한 그룹 목록 조회 - 이제 UUID 사용
    const groupMembers = await supabaseDb.select("group_members", {
      user_id: uuid,
    });
    const groupIds = groupMembers.map((m: any) => m.group_id);

    const groups = [];
    for (const groupId of groupIds) {
      const groupsArr = await supabaseDb.select("groups", { id: groupId });
      const group = groupsArr[0];
      if (group) {
        // 각 그룹의 멤버 수 조회
        const members = await supabaseDb.select("group_members", {
          group_id: groupId,
        });
        groups.push({
          ...group,
          memberCount: members.length,
          role:
            groupMembers.find((m: any) => m.group_id === groupId)?.role || null,
        });
      }
    }

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[GROUPS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // 그룹 생성 - 이제 UUID 사용
    const group = await supabaseDb.insert("groups", {
      name,
      description,
      created_by: uuid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 생성자를 그룹 멤버로 추가 - 이제 UUID 사용
    const groupMember = await supabaseDb.insert("group_members", {
      group_id: group.id,
      user_id: uuid,
      role: "owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ...group, members: [groupMember] });
  } catch (error) {
    console.error("[GROUPS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
