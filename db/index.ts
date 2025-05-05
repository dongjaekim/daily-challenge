import { supabase } from '@/lib/supabase'

// Supabase 데이터베이스 쿼리 헬퍼 함수들
export const supabaseDb = {
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
  },

  // 커스텀 SQL 쿼리 실행
  customQuery: async (sql: string, params: any[] = []) => {
    // Supabase는 직접적인 raw SQL 쿼리 실행을 지원하지 않으므로
    // rpc 함수를 사용하여 서버 측에서 SQL을 실행해야 합니다.
    // 이를 위해 Supabase에 저장 프로시저(stored procedure)를 만들거나
    // 대안으로 아래와 같이 일반 쿼리를 조합할 수 있습니다.
    
    // 이 함수는 임시 구현입니다. 실제 환경에서는 적절한 저장 프로시저를 
    // 생성하고 이를 호출하는 것이 좋습니다.
    
    // 예제: 단순 테이블 조회
    if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('from challenge_records')) {
      const { data, error } = await supabase
        .from('challenge_records')
        .select('*, users!inner(*)')
      
      if (error) throw error
      return data
    }
    
    // 실제 구현에서는 저장 프로시저를 호출하는 방식으로 변경해야 합니다.
    throw new Error('Custom SQL queries are not fully implemented yet')
  }
} 