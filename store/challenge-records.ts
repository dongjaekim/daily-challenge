import { create } from 'zustand'

interface IChallenge {
  id: string
  title: string
  description: string
  created_at: string
  group_id: string
  created_by: string
}

interface IUser {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface IChallengeRecord {
  id: string
  challenge_id: string
  user_id: string
  completed_at: string
  created_at: string
  users?: IUser
  challenge?: IChallenge
}

interface ChallengeRecordsState {
  // 그룹별 챌린지 레코드 저장
  recordsByGroup: Record<string, { 
    records: IChallengeRecord[], 
    lastFetched: number 
  }>
  
  // 캐시 유효 시간 (1시간)
  cacheTimeMs: number
  
  // 특정 그룹의 챌린지 레코드 설정
  setRecords: (groupId: string, records: IChallengeRecord[]) => void
  
  // 특정 그룹의 챌린지 레코드가 캐시되어 있고, 유효한지 확인
  areRecordsCached: (groupId: string) => boolean
  
  // 특정 그룹의 챌린지 레코드 가져오기
  getRecords: (groupId: string) => IChallengeRecord[] | null
  
  // 특정 그룹의 챌린지 레코드 추가
  addRecord: (groupId: string, record: IChallengeRecord) => void
  
  // 특정 그룹의 챌린지 레코드 업데이트
  updateRecord: (groupId: string, recordId: string, updatedRecord: Partial<IChallengeRecord>) => void
  
  // 특정 그룹의 챌린지 레코드 삭제
  deleteRecord: (groupId: string, recordId: string) => void
  
  // 특정 그룹의 캐시 데이터 초기화
  invalidateCache: (groupId: string) => void
  
  // 캐시 타임스탬프만 업데이트 (캐시 무효화 없이 최신상태로 표시)
  updateCacheTimestamp: (groupId: string) => void
}

export const useChallengeRecordsStore = create<ChallengeRecordsState>((set, get) => ({
  recordsByGroup: {},
  cacheTimeMs: 60 * 60 * 1000, // 1시간
  
  setRecords: (groupId: string, records: IChallengeRecord[]) => {
    set((state) => ({
      recordsByGroup: {
        ...state.recordsByGroup,
        [groupId]: {
          records,
          lastFetched: Date.now()
        }
      }
    }))
  },
  
  areRecordsCached: (groupId: string) => {
    const state = get()
    const groupData = state.recordsByGroup[groupId]
    
    if (!groupData) return false
    
    // 캐시 시간 체크
    const isCacheValid = (Date.now() - groupData.lastFetched) < state.cacheTimeMs
    
    return isCacheValid
  },
  
  getRecords: (groupId: string) => {
    const state = get()
    const groupData = state.recordsByGroup[groupId]
    
    // 그룹 데이터가 없으면 null 반환
    if (!groupData) return null
    
    // 캐시 시간 직접 체크 (areRecordsCached 호출하지 않음)
    const isCacheValid = (Date.now() - groupData.lastFetched) < state.cacheTimeMs
    
    // 캐시가 유효하지 않으면 null 반환
    if (!isCacheValid) return null
    
    // 캐시가 유효하면 레코드 반환
    return groupData.records
  },
  
  addRecord: (groupId: string, record: IChallengeRecord) => {
    set((state) => {
      const groupData = state.recordsByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        recordsByGroup: {
          ...state.recordsByGroup,
          [groupId]: {
            ...groupData,
            records: [...groupData.records, record]
          }
        }
      }
    })
  },
  
  updateRecord: (groupId: string, recordId: string, updatedRecord: Partial<IChallengeRecord>) => {
    set((state) => {
      const groupData = state.recordsByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        recordsByGroup: {
          ...state.recordsByGroup,
          [groupId]: {
            ...groupData,
            records: groupData.records.map(record => 
              record.id === recordId ? { ...record, ...updatedRecord } : record
            )
          }
        }
      }
    })
  },
  
  deleteRecord: (groupId: string, recordId: string) => {
    set((state) => {
      const groupData = state.recordsByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        recordsByGroup: {
          ...state.recordsByGroup,
          [groupId]: {
            ...groupData,
            records: groupData.records.filter(record => record.id !== recordId)
          }
        }
      }
    })
  },
  
  invalidateCache: (groupId: string) => {
    set((state) => {
      const { [groupId]: _, ...rest } = state.recordsByGroup
      
      return {
        recordsByGroup: rest
      }
    })
  },
  
  updateCacheTimestamp: (groupId: string) => {
    set((state) => {
      const groupData = state.recordsByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        recordsByGroup: {
          ...state.recordsByGroup,
          [groupId]: {
            ...groupData,
            lastFetched: Date.now()
          }
        }
      }
    })
  }
})) 