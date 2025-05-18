"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { convertToKST } from "@/utils/date";
import { ko } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IChallenge, IChallengeRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import {
  challengeRecordQueryKeys,
  getChallengeRecords,
} from "@/lib/queries/challengeRecordQuery";

interface IGroupCalendarViewProps {
  groupId: string;
}

export function GroupCalendarView({ groupId }: IGroupCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: challenges } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const { data: challengeRecords, isPending } = useQuery({
    queryKey: challengeRecordQueryKeys.getAll(groupId),
    queryFn: () => getChallengeRecords(groupId),
    enabled: !!groupId,
  });

  const records = challengeRecords || [];

  // 이전 달로 이동
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // 다음 달로 이동
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 현재 월의 첫날과 마지막 날
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // 달력 표시를 위해 첫 주의 시작일과 마지막 주의 종료일 계산
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // 달력에 표시할 모든 날짜 가져오기
  const daysInCalendar = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // 요일 배열
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  // 오늘 날짜
  const today = new Date();

  // 선택한 날짜의 기록 보기
  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr);
  };

  // 사용자별 색상 생성 (고정 색상)
  const getUserColor = useMemo(() => {
    const colors = [
      "bg-red-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-indigo-400",
      "bg-orange-400",
      "bg-teal-400",
      "bg-cyan-400",
      "bg-lime-400",
      "bg-emerald-400",
    ];

    const userColors: Record<string, string> = {};
    let colorIndex = 0;

    return (userId: string) => {
      if (!userColors[userId]) {
        userColors[userId] = colors[colorIndex % colors.length];
        colorIndex++;
      }
      return userColors[userId];
    };
  }, []);

  // KST 날짜 변환 (UTC+9) 함수
  const convertToKstDate = (utcDateStr: string) => {
    // 공통 유틸리티 함수를 사용하여 UTC에서 KST로 변환
    const kstDate = convertToKST(utcDateStr);

    // YYYY-MM-DD 형식으로 변환
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, "0");
    const day = String(kstDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // 날짜별 레코드 그룹화
  const recordsByDate = useMemo(() => {
    const result: Record<string, IChallengeRecord[]> = {};

    if (!records.length) {
      return result;
    }

    records.forEach((record: IChallengeRecord) => {
      try {
        // KST 날짜로 변환
        const kstDateStr = convertToKstDate(record.created_at);

        // 날짜별로 그룹화
        if (!result[kstDateStr]) {
          result[kstDateStr] = [];
        }
        result[kstDateStr].push(record);
      } catch (e) {
        console.error("날짜 처리 오류:", e, record);
      }
    });

    return result;
  }, [records]);

  // 날짜-사용자별 챌린지 레코드 그룹화
  const recordsByDateAndUser = useMemo(() => {
    const result: Record<string, Record<string, IChallengeRecord[]>> = {};

    Object.entries(recordsByDate).forEach(([dateStr, dayRecords]) => {
      result[dateStr] = {};

      dayRecords.forEach((record) => {
        if (!record.user_id) return;

        if (!result[dateStr][record.user_id]) {
          result[dateStr][record.user_id] = [];
        }

        result[dateStr][record.user_id].push(record);
      });
    });

    return result;
  }, [recordsByDate]);

  // 빈 레코드 확인
  const hasNoRecords = records.length === 0 && !isPending;

  const getUniqueUsers = () => {
    const usersMap = new Map<string, string>();

    Object.values(recordsByDateAndUser).forEach((dateUsers) => {
      Object.entries(dateUsers).forEach(([userId, userRecords]) => {
        const user = userRecords[0]?.user;
        if (user && !usersMap.has(userId)) {
          usersMap.set(userId, user.name);
        }
      });
    });

    return Array.from(usersMap, ([id, name]) => ({ id, name }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <CardTitle className="h-6">달력 뷰</CardTitle>
          <CardDescription>
            모임 구성원들의 챌린지 참여 현황을 확인하세요
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2 mx-auto sm:mx-0">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(currentDate, "yyyy년 MM월", { locale: ko })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-auto">
        <div className="relative w-full max-w-full mx-auto">
          {isPending ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {/* 요일 헤더 */}
                {weekdays.map((day) => (
                  <div key={day} className="text-center font-medium text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* 날짜 그리드 */}
                {daysInCalendar.map((day) => {
                  // 오늘 날짜 여부
                  const isToday = isSameDay(day, today);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  // 해당 날짜에 완료된 챌린지
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayRecords = recordsByDate[dateStr] || [];
                  const userRecordsMap = recordsByDateAndUser[dateStr] || {};

                  return (
                    <div
                      key={day.toString()}
                      className={`
                          min-h-[40px] sm:min-h-[80px] 
                          border rounded-md p-1 
                    flex flex-col justify-between
                    ${
                      !isCurrentMonth ? "text-muted-foreground bg-muted/20" : ""
                    }
                    ${isToday ? "border-primary" : ""}
                  `}
                      onClick={() =>
                        dayRecords.length > 0 && handleDayClick(dateStr)
                      }
                      style={{
                        cursor: dayRecords.length > 0 ? "pointer" : "default",
                      }}
                    >
                      <div className="text-right text-xs">
                        {format(day, "d")}
                      </div>

                      <div className="flex flex-wrap gap-1 items-end">
                        {Object.entries(userRecordsMap)
                          .slice(0, 5)
                          .map(([userId, userRecords]) => {
                            const challengeCount = userRecords.length;

                            // 챌린지 횟수에 따른 점 크기 계산
                            const dotSize = () => {
                              if (challengeCount === 1)
                                return "w-1 h-1 sm:w-2 sm:h-2";
                              if (challengeCount === 2)
                                return "w-1.5 h-1.5 sm:w-2.5 sm:h-2.5";
                              if (challengeCount === 3)
                                return "w-2 h-2 sm:w-3 sm:h-3";
                              if (challengeCount === 4)
                                return "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5";
                              if (challengeCount >= 5)
                                return "w-3 h-3 sm:w-4 sm:h-4";
                              return "w-1 h-1 sm:w-2 sm:h-2";
                            };

                            return (
                              <div
                                key={userId}
                                className={`${dotSize()} rounded-full ${getUserColor(
                                  userId
                                )}`}
                              />
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 범례 추가 */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {getUniqueUsers().map((user) => (
              <div key={user.id} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-1 h-1 sm:w-2 sm:h-2 rounded-full ${getUserColor(
                    user.id
                  )}`}
                />
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {challenges?.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            아직 등록된 챌린지가 없습니다.
            <br />
            새로운 챌린지를 등록해 보세요!
          </div>
        )}
        {/* {challenges?.length > 0 && hasNoRecords && ( */}
        {hasNoRecords && (
          <div className="text-center mt-8 text-muted-foreground">
            아직 참여한 챌린지 기록이 없습니다.
            <br />
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
              {selectedDay &&
                format(new Date(selectedDay), "yyyy년 MM월 dd일", {
                  locale: ko,
                })}
              의 챌린지
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {Object.entries(recordsByDateAndUser[selectedDay || ""] || {}).map(
              ([userId, userRecords]) => {
                const user = userRecords[0]?.user;
                if (!user) return null;

                return (
                  <div key={userId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getUserColor(
                          userId
                        )}`}
                      >
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <h3 className="font-medium">{user.name || "사용자"}</h3>
                    </div>
                    <ul className="ml-8 list-disc">
                      {userRecords.map((record) => {
                        const challenge = challenges?.find(
                          (c) => c.id === record.challenge_id
                        );
                        return (
                          <li key={record.id} className="text-sm">
                            {challenge?.title || "알 수 없는 챌린지"}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
