'use client'

import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface ChallengeCalendarProps {
  startDate: Date
  endDate: Date
  progress: {
    date: string
    completed: boolean
  }[]
  onDateClick?: (date: Date) => void
}

export function ChallengeCalendar({
  startDate,
  endDate,
  progress,
  onDateClick,
}: ChallengeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const previousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const getProgressStatus = (date: Date) => {
    const progressForDate = progress.find((p) =>
      isSameDay(new Date(p.date), date)
    )
    return progressForDate?.completed
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isInRange =
            day >= startDate && day <= endDate
          const isCompleted = getProgressStatus(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <Button
              key={day.toString()}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                !isCurrentMonth ? 'text-muted-foreground' : ''
              } ${
                isInRange
                  ? isCompleted
                    ? 'bg-green-100 hover:bg-green-200'
                    : 'bg-red-100 hover:bg-red-200'
                  : ''
              }`}
              onClick={() => onDateClick?.(day)}
              disabled={!isInRange}
            >
              {format(day, 'd')}
            </Button>
          )
        })}
      </div>
    </div>
  )
} 