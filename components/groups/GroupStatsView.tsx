"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import {
  getChallengeRecords,
  challengeRecordQueryKeys,
} from "@/lib/queries/challengeRecordQuery";

interface IStats {
  challengeId: string;
  challengeName: string;
  progress: number;
  totalPosts: number;
  totalDays: number;
  completedDays: number;
}

interface IGroupStatsViewProps {
  groupId: string;
}

export function GroupStatsView({ groupId }: IGroupStatsViewProps) {
  const [stats, setStats] = useState<IStats[]>([]);
  const [activeTab, setActiveTab] = useState("progress");
  const isMounted = useRef(true);

  const { data: challenges, isPending: isChallengeLoading } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });
  const challengeLength = challenges?.length || 0;

  const { data: challengeRecords, isPending } = useQuery({
    queryKey: challengeRecordQueryKeys.getAll(groupId),
    queryFn: () => getChallengeRecords(groupId),
    enabled: !!groupId && !!challenges?.length,
  });

  const records = challengeRecords || [];

  const challengeStats = challenges?.map((challenge) => {
    // 이 챌린지에 대한 기록 필터링
    const challengeRecords = records.filter(
      (record) => record.challenge_id === challenge.id
    );

    // 완료된 날짜 수 (중복 날짜 제거)
    const uniqueDates = new Set(
      challengeRecords.map(
        (record) => new Date(record.created_at).toISOString().split("T")[0]
      )
    );

    const completedDays = uniqueDates.size;
    const totalDays = 30; // 일단 30일로 고정 (실제로는 챌린지 기간에 맞게 설정)
    const progress = Math.min(
      100,
      Math.round((completedDays / totalDays) * 100)
    );

    return {
      challengeId: challenge.id,
      challengeName: challenge.title,
      progress,
      totalPosts: challengeRecords.length,
      totalDays,
      completedDays,
    };
  });

  // if (isMounted.current) {
  // setStats(challengeStats!);
  // }

  // 차트 데이터 준비 (메모이제이션)
  const chartData = useMemo(
    () =>
      stats.map((stat) => ({
        name: stat.challengeName,
        달성률: stat.progress,
      })),
    [stats]
  );

  // 전체 평균 달성률 계산 (메모이제이션)
  const averageProgress = useMemo(
    () =>
      stats.length
        ? Math.round(
            stats.reduce((acc, stat) => acc + stat.progress, 0) / stats.length
          )
        : 0,
    [stats]
  );

  return (
    <Card className="shadow-sm">
      <CardHeader></CardHeader>
      <CardContent>
        {isPending || isChallengeLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : challengeLength > 0 ? (
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
                      <span className="text-sm font-medium">
                        {stat.progress}%
                      </span>
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
  );
}
