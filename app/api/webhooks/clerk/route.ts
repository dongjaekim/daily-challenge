import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { Clerk } from "@clerk/backend";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const clerkClient = Clerk({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // 개발 환경에서는 동기화 비활성화
  if (process.env.NODE_ENV === "development") {
    return new Response("Webhook received (sync disabled in development)", {
      status: 200,
    });
  }

  // 운영 환경에서만 동기화 수행
  const eventType = evt.type;
  console.log("eventType", eventType);

  // 이름 생성 함수
  function getUserName(
    first_name: string | null | undefined,
    last_name: string | null | undefined,
    email: string
  ) {
    if (first_name && last_name) {
      return `${first_name} ${last_name}`.trim();
    }
    if (first_name) {
      return first_name;
    }
    if (last_name) {
      return last_name;
    }
    return email.split("@")[0];
  }

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const name = getUserName(
      first_name,
      last_name,
      email_addresses[0].email_address
    );

    const avatar_url =
      image_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        name.replace(/\s+/g, "+")
      )}`;

    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(
          {
            clerk_id: id,
            email: email_addresses[0].email_address,
            name: name,
            avatar_url: avatar_url,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "clerk_id",
          }
        )
        .select();

      if (error) throw error;

      // 신규 사용자 생성 시 Clerk 메타데이터에 UUID 저장
      if (eventType === "user.created" && data?.length) {
        const supabaseUuid = data[0].id.toString(); // Supabase에서 생성된 UUID 추출

        try {
          await clerkClient.users.updateUser(id, {
            publicMetadata: { supabaseUuid },
          });
          console.log("Metadata 업데이트 성공:", supabaseUuid);
        } catch (error) {
          console.error("Error syncing user to Clerk:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error syncing user to Supabase:", error);
      return new Response("Error syncing user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
