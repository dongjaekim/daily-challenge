'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ChallengeStatsProps {
  startDate: Date
  endDate: Date
  progress: {
    date: string
    completed: boolean
  }[]
}

export function ChallengeStats({
  startDate,
  endDate,
  progress,
}: ChallengeStatsProps) {
  const totalDays = differenceInDays(endDate, startDate) + 1
  const completedDays = progress.filter((p) => p.completed).length
  const completionRate = Math.round((completedDays / totalDays) * 100)
  const remainingDays = differenceInDays(endDate, new Date())
  const isActive = isBefore(new Date(), endDate) && isAfter(new Date(), startDate)

  const stats = [
    {
      title: '진행률',
      value: `${completionRate}%`,
      description: `${completedDays}일 / ${totalDays}일`,
    },
    {
      title: '남은 기간',
      value: `${remainingDays}일`,
      description: isActive ? '진행 중' : '종료됨',
    },
    {
      title: '시작일',
      value: format(startDate, 'yyyy년 MM월 dd일', { locale: ko }),
      description: '챌린지 시작',
    },
    {
      title: '종료일',
      value: format(endDate, 'yyyy년 MM월 dd일', { locale: ko }),
      description: '챌린지 종료',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 