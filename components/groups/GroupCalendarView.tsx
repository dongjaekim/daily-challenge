'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { convertToKST } from '@/utils/date'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useChallengeRecordsStore } from '@/store/challenge-records'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

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

interface GroupCalendarViewProps {
  groupId: string
  challenges: IChallenge[]
}

export function GroupCalendarView({ groupId, challenges }: GroupCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedDayRecords, setSelectedDayRecords] = useState<IChallengeRecord[]>([])
  const [records, setRecords] = useState<IChallengeRecord[]>([])
  const isMounted = useRef(true)
  const challengesLengthRef = useRef(challenges.length)
  
  // 챌린지 레코드 스토어 접근 - 개별 함수로 분리
  const getRecords = useChallengeRecordsStore(state => state.getRecords)
  const storeSetRecords = useChallengeRecordsStore(state => state.setRecords)
  const areRecordsCached = useChallengeRecordsStore(state => state.areRecordsCached)
  const invalidateCache = useChallengeRecordsStore(state => state.invalidateCache)

  // 챌린지 기록 가져오기
  useEffect(() => {
    isMounted.current = true
    challengesLengthRef.current = challenges.length
    
    const fetchRecords = async () => {
      if (!groupId || challengesLengthRef.current === 0) return
      
      // 캐시가 유효한 경우 캐시된 데이터 사용
      if (areRecordsCached(groupId)) {
        const cachedData = getRecords(groupId)
        if (cachedData && isMounted.current) {
          console.log(`${cachedData.length}개의 캐시된 챌린지 기록 사용`);
          setRecords(cachedData)
          return
        }
      }
      
      // 캐시가 없거나 유효하지 않은 경우에만 API 호출
      if (isMounted.current) {
        setLoading(true)
      }
      
      try {
        const response = await fetch(`/api/groups/${groupId}/challenge-records?_t=${Date.now()}`)
        if (response.ok && isMounted.current) {
          const data = await response.json()
          console.log(`${data.length}개의 챌린지 기록 조회 완료`);
          
          // 로컬 상태에 직접 저장
          setRecords(data)
          
          // 스토어에도 저장
          storeSetRecords(groupId, data)
        } else {
          console.error('API 호출 실패:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching challenge records:', error)
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }
    
    fetchRecords()
    
    return () => {
      isMounted.current = false
    }
  }, [groupId, storeSetRecords, getRecords, areRecordsCached])
  
  // 이전 달로 이동
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }
  
  // 다음 달로 이동
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }
  
  // 현재 월의 첫날과 마지막 날
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  // 달력 표시를 위해 첫 주의 시작일과 마지막 주의 종료일 계산
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  // 달력에 표시할 모든 날짜 가져오기
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  // 요일 배열
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  
  // 오늘 날짜
  const today = new Date()
  
  // 선택한 날짜의 기록 보기
  const handleDayClick = (dateStr: string, records: IChallengeRecord[]) => {
    setSelectedDay(dateStr)
    setSelectedDayRecords(records)
  }

  // 사용자별 색상 생성 (고정 색상)
  const getUserColor = useMemo(() => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ]
    
    const userColors: Record<string, string> = {}
    let colorIndex = 0
    
    return (userId: string) => {
      if (!userColors[userId]) {
        userColors[userId] = colors[colorIndex % colors.length]
        colorIndex++
      }
      return userColors[userId]
    }
  }, [])

  // KST 날짜 변환 (UTC+9) 함수
  const convertToKstDate = (utcDateStr: string) => {
    // 공통 유틸리티 함수를 사용하여 UTC에서 KST로 변환
    const kstDate = convertToKST(utcDateStr);
    
    // YYYY-MM-DD 형식으로 변환
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // 날짜별 레코드 그룹화
  const recordsByDate = useMemo(() => {
    const result: Record<string, IChallengeRecord[]> = {}
    
    if (!records.length) {
      return result;
    }
    
    records.forEach((record: IChallengeRecord) => {
      try {
        // KST 날짜로 변환
        const kstDateStr = convertToKstDate(record.completed_at);
        
        // 날짜별로 그룹화
        if (!result[kstDateStr]) {
          result[kstDateStr] = [];
        }
        result[kstDateStr].push(record);
      } catch (e) {
        console.error('날짜 처리 오류:', e, record);
      }
    });
    
    return result;
  }, [records])
  
  // 날짜-사용자별 챌린지 레코드 그룹화
  const recordsByDateAndUser = useMemo(() => {
    const result: Record<string, Record<string, IChallengeRecord[]>> = {}
    
    Object.entries(recordsByDate).forEach(([dateStr, dayRecords]) => {
      result[dateStr] = {}
      
      dayRecords.forEach(record => {
        if (!record.user_id) return
        
        if (!result[dateStr][record.user_id]) {
          result[dateStr][record.user_id] = []
        }
        
        result[dateStr][record.user_id].push(record)
      })
    })
    
    return result
  }, [recordsByDate])

  // 빈 레코드 확인
  const hasNoRecords = records.length === 0 && !loading

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="h-6">달력 뷰</CardTitle>
          <CardDescription>모임 구성원들의 챌린지 참여 현황을 확인하세요</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(currentDate, 'yyyy년 MM월', { locale: ko })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* 요일 헤더 */}
            {weekdays.map((day) => (
              <div 
                key={day} 
                className="text-center py-2 font-medium text-sm"
              >
                {day}
              </div>
            ))}
            
            {/* 날짜 그리드 */}
            {daysInCalendar.map((day) => {
              // 오늘 날짜 여부
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, currentDate)
              
              // 해당 날짜에 완료된 챌린지
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayRecords = recordsByDate[dateStr] || []
              const userRecordsMap = recordsByDateAndUser[dateStr] || {}
              
              return (
                <div
                  key={day.toString()}
                  className={`
                    relative min-h-[80px] border rounded-md p-1 
                    ${!isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''}
                    ${isToday ? 'border-primary' : ''}
                  `}
                  onClick={() => dayRecords.length > 0 && handleDayClick(dateStr, dayRecords)}
                  style={{ cursor: dayRecords.length > 0 ? 'pointer' : 'default' }}
                >
                  <div className="text-right text-xs">{format(day, 'd')}</div>
                  
                  {Object.entries(userRecordsMap).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(userRecordsMap).map(([userId, userRecords]) => {
                        const user = userRecords[0]?.users
                        if (!user) return null
                        
                        const challengeCount = userRecords.length
                        const displayName = challengeCount > 1 
                          ? `${user.name} +${challengeCount}` 
                          : user.name

                        return (
                          <div 
                            key={userId} 
                            className={`
                              flex items-center justify-center rounded-full
                              w-7 h-7 text-white text-xs
                              ${getUserColor(userId)}
                            `}
                            title={displayName}
                          >
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {challenges.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            아직 등록된 챌린지가 없습니다.<br/>
            새로운 챌린지를 등록해 보세요!
          </div>
        )}
        {challenges.length > 0 && hasNoRecords && (
          <div className="text-center mt-8 text-muted-foreground">
            아직 참여한 챌린지 기록이 없습니다.<br/>
            챌린지에 참여해 보세요!
          </div>
        )}
      </CardContent>

      {/* 선택한 날짜의 상세 정보 다이얼로그 */}
      <Dialog 
        open={!!selectedDay} 
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(new Date(selectedDay), 'yyyy년 MM월 dd일', { locale: ko })}의 챌린지
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {Object.entries(recordsByDateAndUser[selectedDay || ''] || {}).map(([userId, userRecords]) => {
              const user = userRecords[0]?.users
              if (!user) return null
              
              return (
                <div key={userId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getUserColor(userId)}`}
                    >
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h3 className="font-medium">{user.name || '사용자'}</h3>
                  </div>
                  <ul className="ml-8 list-disc">
                    {userRecords.map(record => {
                      const challenge = challenges.find(c => c.id === record.challenge_id)
                      return (
                        <li key={record.id} className="text-sm">
                          {challenge?.title || '알 수 없는 챌린지'}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 