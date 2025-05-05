'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useChallengeRecordsStore } from '@/store/challenge-records'
import { Loader2 } from 'lucide-react'

interface IChallenge {
  id: string
  title: string
  description: string
  created_at: string
  group_id: string
  created_by: string
}

interface IStats {
  challengeId: string
  challengeName: string
  progress: number
  totalPosts: number
  totalDays: number
  completedDays: number
}

interface GroupStatsViewProps {
  groupId: string
  challenges: IChallenge[]
}

export function GroupStatsView({ groupId, challenges }: GroupStatsViewProps) {
  const [stats, setStats] = useState<IStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('progress')
  const isMounted = useRef(true)
  const challengesLengthRef = useRef(challenges.length)
  
  // 챌린지 레코드 스토어 접근 - 필요한 함수만 선택적으로 가져옴
  const getRecords = useChallengeRecordsStore(state => state.getRecords)
  const setRecords = useChallengeRecordsStore(state => state.setRecords)
  const areRecordsCached = useChallengeRecordsStore(state => state.areRecordsCached)
  const invalidateCache = useChallengeRecordsStore(state => state.invalidateCache)
  
  useEffect(() => {
    // 마운트 상태 초기화
    isMounted.current = true
    challengesLengthRef.current = challenges.length
    
    async function fetchStats() {
      if (challengesLengthRef.current === 0) {
        if (isMounted.current) {
          setIsLoading(false)
        }
        return
      }
      
      if (isMounted.current) {
        setIsLoading(true)
      }
      
      try {
        let localRecords: any[] = [];
        
        // 캐시가 있고 유효한 경우 캐시된 데이터 사용
        if (areRecordsCached(groupId)) {
          localRecords = getRecords(groupId) || [];
          console.log(`${localRecords.length}개의 캐시된 챌린지 기록 사용 (통계 뷰)`);
        } else {
          // 캐시가 없거나 유효하지 않은 경우에만 API 호출
          const response = await fetch(`/api/groups/${groupId}/challenge-records`)
          if (response.ok && isMounted.current) {
            const data = await response.json()
            setRecords(groupId, data)
            localRecords = data;
            console.log(`${data.length}개의 챌린지 기록 새로 로드 (통계 뷰)`);
          }
        }
        
        // 레코드 데이터를 기반으로 통계 생성
        if (localRecords.length > 0) {
          // 각 챌린지별 통계 계산
          const challengeStats = challenges.map(challenge => {
            // 이 챌린지에 대한 기록 필터링
            const challengeRecords = localRecords.filter(record => 
              record.challenge_id === challenge.id
            )
            
            // 완료된 날짜 수 (중복 날짜 제거)
            const uniqueDates = new Set(
              challengeRecords.map(record => 
                new Date(record.completed_at).toISOString().split('T')[0]
              )
            )
            
            const completedDays = uniqueDates.size
            const totalDays = 30 // 일단 30일로 고정 (실제로는 챌린지 기간에 맞게 설정)
            const progress = Math.min(100, Math.round((completedDays / totalDays) * 100))
            
            return {
              challengeId: challenge.id,
              challengeName: challenge.title,
              progress,
              totalPosts: challengeRecords.length,
              totalDays,
              completedDays
            }
          })
          
          if (isMounted.current) {
            setStats(challengeStats)
          }
        } else {
          // API가 구현되지 않은 경우 더미 데이터 생성
          const dummyStats = challenges.map((challenge) => {
            const progress = Math.floor(Math.random() * 100)
            const totalDays = 30
            const completedDays = Math.floor(totalDays * (progress / 100))
            
            return {
              challengeId: challenge.id,
              challengeName: challenge.title,
              progress,
              totalPosts: Math.floor(Math.random() * 50) + 1,
              totalDays,
              completedDays
            }
          })
          
          if (isMounted.current) {
            setStats(dummyStats)
          }
        }
      } catch (error) {
        console.error('통계 데이터를 불러오는 중 오류가 발생했습니다:', error)
        if (isMounted.current) {
          setStats([])
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }
    
    fetchStats()
    
    // 클린업 함수
    return () => {
      isMounted.current = false
    }
  }, [groupId, areRecordsCached, setRecords, getRecords, challenges])
  
  // 차트 데이터 준비 (메모이제이션)
  const chartData = useMemo(() => 
    stats.map(stat => ({
      name: stat.challengeName,
      달성률: stat.progress
    })), 
    [stats]
  )
  
  // 전체 평균 달성률 계산 (메모이제이션)
  const averageProgress = useMemo(() => 
    stats.length 
      ? Math.round(stats.reduce((acc, stat) => acc + stat.progress, 0) / stats.length) 
      : 0,
    [stats]
  )
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>통계 뷰</CardTitle>
        <CardDescription>모임 내 챌린지 달성 통계를 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">모임 평균 달성률</h3>
              <div className="flex items-center gap-2">
                <Progress value={averageProgress} className="h-4" />
                <span className="font-medium">{averageProgress}%</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="progress">챌린지 달성률</TabsTrigger>
                <TabsTrigger value="chart">차트 보기</TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-4 mt-4">
                {stats.map((stat) => (
                  <div key={stat.challengeId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{stat.challengeName}</h4>
                      <span className="text-sm text-muted-foreground">
                        {stat.completedDays}/{stat.totalDays}일 완료
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={stat.progress} className="h-2" />
                      <span className="text-sm font-medium">{stat.progress}%</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="chart" className="mt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        height={70}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="달성률" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            등록된 챌린지가 없습니다. 챌린지를 먼저 등록해주세요.
          </div>
        )}
      </CardContent>
    </Card>
  )
} 