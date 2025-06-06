import { getSupabaseUuid } from "@/utils/server-auth";
import { supabaseDb } from "@/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 그룹 정보 조회
    const groupArr = await supabaseDb.select("groups", { id: params.groupId });
    const group = groupArr[0];
    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // 그룹 멤버 role 조회
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (!memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }
    const role = memberArr[0].role;

    return NextResponse.json({ ...group, role });
  } catch (error) {
    console.error("[GROUP_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // 그룹 멤버 role 조회
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (!memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }
    const role = memberArr[0].role;

    const group = await supabaseDb.update(
      "groups",
      {
        name,
        description,
        updated_at: new Date().toISOString(),
      },
      { id: params.groupId }
    );

    return NextResponse.json({ ...group, role });
  } catch (error) {
    console.error("[GROUP_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 그룹 멤버 role 조회
    const memberArr = await supabaseDb.select("group_members", {
      group_id: params.groupId,
      user_id: uuid,
    });
    if (!memberArr) {
      return new NextResponse("Not member of this group", { status: 404 });
    }

    const group = await supabaseDb.delete("groups", { id: params.groupId });
    return NextResponse.json(group);
  } catch (error) {
    console.error("[GROUP_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
