import { ChallengeCalendar } from '@/components/challenges/ChallengeCalendar'
import { ChallengeStats } from '@/components/challenges/ChallengeStats'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { supabaseDb } from '@/db'
import { getSupabaseUuid } from '@/utils/server-auth'
import { notFound } from 'next/navigation'
import { convertToKST } from '@/utils/date'

interface ChallengePageProps {
  params: {
    challengeId: string
  }
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const uuid = await getSupabaseUuid()
  
  if (!uuid) {
    console.error("User UUID not found")
    return notFound()
  }

  // 챌린지 조회
  const challengeArr = await supabaseDb.select('challenges', { id: params.challengeId })
  
  if (!challengeArr.length) {
    return notFound()
  }
  
  const challenge = challengeArr[0]

  // 그룹 멤버 여부 확인
  const memberArr = await supabaseDb.select('group_members', { 
    group_id: challenge.group_id, 
    user_id: uuid 
  })
  
  if (!memberArr.length) {
    return notFound()
  }

  // 챌린지 진행 상황 조회
  const progressArr = await supabaseDb.select('challenge_progress', { challenge_id: params.challengeId })

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <p className="text-muted-foreground">{challenge.description}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>진행 상황 업데이트</Button>
            </DialogTrigger>
            <DialogContent>
              <ChallengeCalendar
                startDate={new Date(challenge.start_date)}
                endDate={new Date(challenge.end_date)}
                progress={progressArr.map((p) => {
                  // date 필드가 있으면 그 값을 사용하고, 없으면 created_at 필드를 KST로 변환하여 사용
                  const dateToUse = p.date 
                    ? new Date(p.date) 
                    : convertToKST(new Date(p.created_at));
                  
                  return {
                    date: dateToUse.toISOString(),
                    completed: p.progress >= 1.0,
                  };
                })}
                onDateClick={async (date) => {
                  // 선택한 날짜를 KST 기준으로 변환
                  const kstDate = convertToKST(date);
                  const dateString = kstDate.toISOString().split('T')[0];
                  
                  // 날짜 비교 로직 개선
                  const existingProgress = progressArr.find((p) => {
                    // p.date가 있으면 그 값을 사용하고, 없으면 created_at을 KST로 변환하여 사용
                    const progressDate = p.date 
                      ? new Date(p.date) 
                      : convertToKST(new Date(p.created_at));
                    
                    return progressDate.toISOString().startsWith(dateString);
                  });

                  if (existingProgress) {
                    // 업데이트
                    const newProgress = existingProgress.progress >= 1.0 ? 0 : 1.0;
                    await supabaseDb.update('challenge_progress', {
                      progress: newProgress,
                      updated_at: new Date().toISOString()
                    }, {
                      id: existingProgress.id
                    });
                  } else {
                    // 생성 - KST 날짜를 문자열로 저장
                    const kstDateStr = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
                    
                    await supabaseDb.insert('challenge_progress', {
                      challenge_id: params.challengeId,
                      user_id: uuid,
                      date: kstDateStr, // KST 날짜 문자열
                      progress: 1.0,
                      created_at: new Date().toISOString()
                    });
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ChallengeStats
        startDate={new Date(challenge.start_date)}
        endDate={new Date(challenge.end_date)}
        progress={progressArr.map((p) => {
          // date 필드가 있으면 그 값을 사용하고, 없으면 created_at 필드를 KST로 변환하여 사용
          const dateToUse = p.date 
            ? new Date(p.date) 
            : convertToKST(new Date(p.created_at));
          
          return {
            date: dateToUse.toISOString(),
            completed: p.progress >= 1.0,
          };
        })}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">게시글</h2>
        <Button
          onClick={() =>
            window.location.href = `/challenges/${params.challengeId}/posts`
          }
        >
          게시글 목록 보기
        </Button>
      </div>
    </div>
  )
} 