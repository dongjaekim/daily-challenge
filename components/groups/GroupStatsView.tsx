"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Crown,
  Trophy,
  BarChartHorizontal,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import {
  getChallengeRecords,
  challengeRecordQueryKeys,
} from "@/lib/queries/challengeRecordQuery";
import {
  getGroupMembers,
  groupMemberQueryKeys,
} from "@/lib/queries/groupMemberQuery";
import { startOfMonth, endOfMonth, subMonths, formatISO } from "date-fns";
import { IChallenge, IChallengeRecord, IUser } from "@/types";

interface IUserStats {
  user: IUser;
  thisMonthCount: number;
  lastMonthCount: number;
  growthRate: number | null;
  byChallenge: Record<string, number>; // { [challengeId]: count }
}

interface IGroupStatsViewProps {
  groupId: string;
  currentUserId: string;
}

export function GroupStatsView({
  groupId,
  currentUserId,
}: IGroupStatsViewProps) {
  const now = new Date();
  const thisMonthStart = formatISO(startOfMonth(now), {
    representation: "date",
  });
  const thisMonthEnd = formatISO(endOfMonth(now), { representation: "date" });
  const lastMonth = subMonths(now, 1);
  const lastMonthStart = formatISO(startOfMonth(lastMonth), {
    representation: "date",
  });
  const lastMonthEnd = formatISO(endOfMonth(lastMonth), {
    representation: "date",
  });

  const { data: challenges, isLoading: isLoadingChallenges } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: groupMemberQueryKeys.getAll(groupId),
    queryFn: () => getGroupMembers(groupId),
  });

  const { data: thisMonthRecords, isLoading: isLoadingThisMonth } = useQuery({
    queryKey: challengeRecordQueryKeys.getFilteredList(groupId, {
      startDate: thisMonthStart,
      endDate: thisMonthEnd,
    }),
    queryFn: () =>
      getChallengeRecords(groupId, {
        startDate: thisMonthStart,
        endDate: thisMonthEnd,
      }),
    enabled: !!groupId,
  });

  const { data: lastMonthRecords, isLoading: isLoadingLastMonth } = useQuery({
    queryKey: challengeRecordQueryKeys.getFilteredList(groupId, {
      startDate: lastMonthStart,
      endDate: lastMonthEnd,
    }),
    queryFn: () =>
      getChallengeRecords(groupId, {
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
      }),
    enabled: !!groupId,
  });

  const processedStats = useMemo(() => {
    if (!challenges || !members || !thisMonthRecords || !lastMonthRecords) {
      return null;
    }

    // 성능을 위해 기록 데이터를 Map으로 변환
    const getCountsByUser = (records: IChallengeRecord[]) => {
      const counts = new Map<string, number>();
      for (const record of records) {
        counts.set(record.user_id, (counts.get(record.user_id) || 0) + 1);
      }
      return counts;
    };

    const getCountsByUserAndChallenge = (records: IChallengeRecord[]) => {
      const counts = new Map<string, Record<string, number>>();
      for (const record of records) {
        const userCounts = counts.get(record.user_id) || {};
        userCounts[record.challenge_id] =
          (userCounts[record.challenge_id] || 0) + 1;
        counts.set(record.user_id, userCounts);
      }
      return counts;
    };

    const thisMonthCountsByUser = getCountsByUser(thisMonthRecords);
    const lastMonthCountsByUser = getCountsByUser(lastMonthRecords);
    const thisMonthCountsByChallenge =
      getCountsByUserAndChallenge(thisMonthRecords);

    const userStats: IUserStats[] = members.map((member) => {
      const thisMonthCount = thisMonthCountsByUser.get(member.user_id) || 0;
      const lastMonthCount = lastMonthCountsByUser.get(member.user_id) || 0;
      let growthRate: number | null = null;
      if (lastMonthCount > 0) {
        growthRate = Math.round(
          ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
        );
      } else if (thisMonthCount > 0) {
        growthRate = Infinity; // 지난 달 기록이 없는데 이번 달 기록이 있으면 무한대 증가
      }

      return {
        user: member.user!,
        thisMonthCount,
        lastMonthCount,
        growthRate: growthRate,
        byChallenge: thisMonthCountsByChallenge.get(member.user_id) || {},
      };
    });

    const rankedUsers = [...userStats].sort(
      (a, b) => b.thisMonthCount - a.thisMonthCount
    );

    // 가장 인기 있는 챌린지 계산
    const challengeParticipation = new Map<string, number>();
    thisMonthRecords.forEach((record) => {
      challengeParticipation.set(
        record.challenge_id,
        (challengeParticipation.get(record.challenge_id) || 0) + 1
      );
    });

    let mostPopularChallenge: IChallenge | null = null;
    let maxCount = 0;
    for (const [challengeId, count] of Array.from(
      challengeParticipation.entries()
    )) {
      if (count > maxCount) {
        maxCount = count;
        mostPopularChallenge =
          challenges.find((c) => c.id === challengeId) || null;
      }
    }

    return {
      rankedUsers,
      currentUserStats: userStats.find(
        (stat) => stat.user.id === currentUserId
      ),
      mostPopularChallenge: mostPopularChallenge
        ? { ...mostPopularChallenge, count: maxCount }
        : null,
    };
  }, [challenges, members, thisMonthRecords, lastMonthRecords, currentUserId]);

  const isLoading =
    isLoadingChallenges ||
    isLoadingMembers ||
    isLoadingThisMonth ||
    isLoadingLastMonth;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!processedStats) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive-foreground mb-4" />
        <p>통계 데이터를 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

  const { rankedUsers, currentUserStats, mostPopularChallenge } =
    processedStats;

  return (
    <div className="space-y-8">
      {/* 1. 나의 이번 달 현황 */}
      {currentUserStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📅 나의 이번 달 현황</CardTitle>
            <CardDescription>
              이번 달 챌린지 달성 기록을 확인해보세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">총 인증 횟수</p>
                <p className="text-3xl font-bold">
                  {currentUserStats.thisMonthCount}회
                </p>
              </div>
              {currentUserStats.growthRate !== null && (
                <div
                  className={`flex items-center text-sm font-semibold ${
                    currentUserStats.growthRate >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {currentUserStats.growthRate >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {currentUserStats.growthRate === Infinity
                    ? "새로 시작!"
                    : `${currentUserStats.growthRate}%`}
                  <span className="text-xs text-muted-foreground ml-1">
                    (지난 달 대비)
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm">챌린지별 달성 현황</h4>
              {challenges && challenges.length > 0 ? (
                challenges.map((challenge) => {
                  const count = currentUserStats.byChallenge[challenge.id] || 0;
                  // 챌린지별 목표 횟수가 있다면 progress 계산, 없다면 그냥 횟수만 표시
                  return (
                    <div key={challenge.id}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {challenge.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / 30) * 100} className="h-2" />{" "}
                        {/* 30일 목표 가정 */}
                        <span className="text-xs font-mono text-foreground">
                          {count}회
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  진행 중인 챌린지가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. 이번 달 챌린지 랭킹 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🏆 이번 달 챌린지 랭킹</CardTitle>
          <CardDescription>
            이번 달에 가장 활발하게 활동한 멤버를 확인해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankedUsers.slice(0, 5).map((stat, index) => (
              <div
                key={stat.user.id}
                className="flex items-center gap-4 p-3 rounded-md hover:bg-accent"
              >
                <span className="text-lg font-bold w-6 text-center text-muted-foreground">
                  {index + 1}
                </span>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage
                    src={stat.user.avatar_url || ""}
                    alt={stat.user.name || ""}
                  />
                  <AvatarFallback>
                    {stat.user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{stat.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.thisMonthCount}회 인증
                  </p>
                </div>
                {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. 모임 전체 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📊 모임 전체 현황</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              이번 달 총 인증 횟수
            </h4>
            <p className="text-3xl font-bold">
              {thisMonthRecords?.length || 0}회
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              가장 인기있는 챌린지
            </h4>
            {mostPopularChallenge ? (
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-bold text-base">
                    {mostPopularChallenge.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mostPopularChallenge.count}회 인증
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">기록 없음</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
