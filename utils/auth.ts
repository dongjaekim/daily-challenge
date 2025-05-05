'use client'

import { useAuth } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

// 클라이언트 컴포넌트에서 사용할 커스텀 훅
export function useUserUuid() {
  const { userId } = useAuth()
  const [uuid, setUuid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    if (!userId) {
      setIsLoading(false)
      setUuid(null)
      return
    }

    async function fetchUuid() {
      if (!isMounted) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single()

        if (error) {
          console.error("Error fetching user UUID:", error)
          if (isMounted) setUuid(null)
        } else {
          if (isMounted) setUuid(data?.id || null)
        }
      } catch (error) {
        console.error("Error in useUserUuid:", error)
        if (isMounted) setUuid(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    setIsLoading(true);
    fetchUuid()
    
    return () => {
      isMounted = false;
    };
  }, [userId])

  return { uuid, isLoading }
} 