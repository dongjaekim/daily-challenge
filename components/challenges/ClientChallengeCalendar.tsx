"use client";

import { ChallengeCalendar } from "@/components/challenges/ChallengeCalendar";
import { supabaseDb } from "@/db";
import { convertToKST } from "@/utils/date";
import { useState } from "react";

interface IClientChallengeCalendarProps {
  startDate: Date;
  endDate: Date;
  progress: {
    date: string;
    completed: boolean;
  }[];
  challengeId: string;
  currentUserId: string;
}

export default function ClientChallengeCalendar({
  startDate,
  endDate,
  progress,
  challengeId,
  currentUserId,
}: IClientChallengeCalendarProps) {
  const [progressState, setProgressState] = useState(progress);

  const handleDateClick = async (date: Date) => {
    const kstDate = convertToKST(date);
    const dateString = kstDate.toISOString().split("T")[0];

    // 기존 progressState에서 해당 날짜 찾기
    const existingProgress = progressState.find((p) =>
      p.date.startsWith(dateString)
    );

    if (existingProgress) {
      // 업데이트 로직
      const newCompleted = !existingProgress.completed;
      await supabaseDb.update(
        "challenge_progress",
        {
          progress: newCompleted ? 1.0 : 0,
          updated_at: new Date().toISOString(),
        },
        {
          challenge_id: challengeId,
        }
      );
      // 상태 업데이트
      setProgressState((prev) =>
        prev.map((p) =>
          p.date === existingProgress.date
            ? { ...p, completed: newCompleted }
            : p
        )
      );
    } else {
      // 생성 로직
      await supabaseDb.insert("challenge_progress", {
        challenge_id: challengeId,
        user_id: currentUserId,
        progress: 1.0,
        created_at: new Date().toISOString(),
      });
      setProgressState((prev) => [
        ...prev,
        { date: dateString, completed: true },
      ]);
    }
  };

  return (
    <ChallengeCalendar
      startDate={startDate}
      endDate={endDate}
      progress={progressState}
      onDateClick={handleDateClick}
    />
  );
}
