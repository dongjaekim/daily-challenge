import { create } from 'zustand'

interface IChallenge {
  id: string
  title: string
  description?: string
  created_at: string
  group_id: string
  created_by: string
}

interface ChallengesState {
  // 그룹별 챌린지 저장
  challengesByGroup: Record<string, { 
    challenges: IChallenge[], 
    lastFetched: number 
  }>
  
  // 캐시 유효 시간 (10분)
  cacheTimeMs: number
  
  // 특정 그룹의 챌린지 설정
  setChallenges: (groupId: string, challenges: IChallenge[]) => void
  
  // 특정 그룹의 챌린지가 캐시되어 있고, 유효한지 확인
  areChallengesCached: (groupId: string) => boolean
  
  // 특정 그룹의 챌린지 가져오기
  getChallenges: (groupId: string) => IChallenge[] | null
  
  // 특정 그룹의 챌린지 추가
  addChallenge: (groupId: string, challenge: IChallenge) => void
  
  // 특정 그룹의 챌린지 업데이트
  updateChallenge: (groupId: string, challengeId: string, updatedChallenge: Partial<IChallenge>) => void
  
  // 특정 그룹의 챌린지 삭제
  deleteChallenge: (groupId: string, challengeId: string) => void
  
  // 특정 그룹의 캐시 데이터 초기화
  invalidateCache: (groupId: string) => void
  
  // 캐시 타임스탬프만 업데이트 (캐시 무효화 없이 최신상태로 표시)
  updateCacheTimestamp: (groupId: string) => void
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  challengesByGroup: {},
  cacheTimeMs: 60 * 60 * 1000, // 1시간
  
  setChallenges: (groupId: string, challenges: IChallenge[]) => {
    set((state) => ({
      challengesByGroup: {
        ...state.challengesByGroup,
        [groupId]: {
          challenges,
          lastFetched: Date.now()
        }
      }
    }))
  },
  
  areChallengesCached: (groupId: string) => {
    const state = get()
    const groupData = state.challengesByGroup[groupId]
    
    if (!groupData) return false
    
    // 캐시 시간 체크
    const isCacheValid = (Date.now() - groupData.lastFetched) < state.cacheTimeMs
    
    return isCacheValid
  },
  
  getChallenges: (groupId: string) => {
    const state = get()
    
    if (!state.areChallengesCached(groupId)) {
      return null
    }
    
    return state.challengesByGroup[groupId].challenges
  },
  
  addChallenge: (groupId: string, challenge: IChallenge) => {
    set((state) => {
      const groupData = state.challengesByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        challengesByGroup: {
          ...state.challengesByGroup,
          [groupId]: {
            ...groupData,
            challenges: [...groupData.challenges, challenge]
          }
        }
      }
    })
  },
  
  updateChallenge: (groupId: string, challengeId: string, updatedChallenge: Partial<IChallenge>) => {
    set((state) => {
      const groupData = state.challengesByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        challengesByGroup: {
          ...state.challengesByGroup,
          [groupId]: {
            ...groupData,
            challenges: groupData.challenges.map(challenge => 
              challenge.id === challengeId ? { ...challenge, ...updatedChallenge } : challenge
            )
          }
        }
      }
    })
  },
  
  deleteChallenge: (groupId: string, challengeId: string) => {
    set((state) => {
      const groupData = state.challengesByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        challengesByGroup: {
          ...state.challengesByGroup,
          [groupId]: {
            ...groupData,
            challenges: groupData.challenges.filter(challenge => challenge.id !== challengeId)
          }
        }
      }
    })
  },
  
  invalidateCache: (groupId: string) => {
    set((state) => {
      const { [groupId]: _, ...rest } = state.challengesByGroup
      
      return {
        challengesByGroup: rest
      }
    })
  },
  
  updateCacheTimestamp: (groupId: string) => {
    set((state) => {
      const groupData = state.challengesByGroup[groupId]
      
      if (!groupData) return state
      
      return {
        challengesByGroup: {
          ...state.challengesByGroup,
          [groupId]: {
            ...groupData,
            lastFetched: Date.now()
          }
        }
      }
    })
  }
})) 