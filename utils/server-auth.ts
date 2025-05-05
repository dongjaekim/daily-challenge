import { supabase } from "@/lib/supabase"

// 서버 컴포넌트에서 사용할 UUID 가져오기 함수
export async function getUserUuid(clerkId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (error) {
      console.error("Error fetching user UUID:", error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error("Error getting user UUID:", error)
    return null
  }
} 