import { NextResponse } from "next/server";
import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const uuid = await getSupabaseUuid();

    if (!uuid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        role, 
        groups:group_id (
          id,
          name,
          member_count,
          description,
          created_by,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", uuid);

    if (error) {
      console.error("[GROUPS_GET_SUPABASE]", error);
      return new NextResponse("Database Error", { status: 500 });
    }

    const transformedData = data.map((item: any) => ({
      ...item.groups,
      role: item.role,
      image_url: item.groups.image_url || null,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[GROUPS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
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

    return NextResponse.json({
      ...group,
      member_count: 1,
      role: "owner",
    });
  } catch (error) {
    console.error("[GROUPS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
