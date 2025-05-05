require('dotenv').config({ path: '.env.local' })
const { clerkClient } = require('@clerk/nextjs/server')
const { supabase } = require('../lib/supabase')

// Supabase 데이터베이스 쿼리 헬퍼 함수들
const supabaseDb = {
  // 테이블에서 데이터 조회
  select: async (table: string, query: any = {}) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(query)
    
    if (error) throw error
    return data
  },

  // 데이터 삽입
  insert: async (table: string, values: any) => {
    const { data, error } = await supabase
      .from(table)
      .insert(values)
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  // 데이터 업데이트
  update: async (table: string, values: any, query: any) => {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .match(query)
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  // 데이터 삭제
  delete: async (table: string, query: any) => {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .match(query)
      .select()
    
    if (error) throw error
    return data?.[0]
  }
}

async function syncUsers() {
  try {
    // Clerk에서 모든 사용자 가져오기
    const users = await clerkClient.users.getUserList()

    // 각 사용자를 Supabase에 동기화
    for (const user of users) {
      const { id, emailAddresses, firstName, lastName } = user

      try {
        await supabaseDb.insert('users', {
          clerk_id: id,
          email: emailAddresses[0].emailAddress,
          name: `${firstName} ${lastName}`.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log(`Synced user: ${emailAddresses[0].emailAddress}`)
      } catch (error) {
        console.error(`Error syncing user ${emailAddresses[0].emailAddress}:`, error)
      }
    }

    console.log('User sync completed')
  } catch (error) {
    console.error('Error in syncUsers:', error)
  }
}

syncUsers() 