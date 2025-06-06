"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  getChallenges,
  challengeQueryKeys,
} from "@/lib/queries/challengeQuery";
import {
  useUpdateChallenge,
  useDeleteChallenge,
} from "@/lib/mutations/challengeMutations";
import {
  challengeRecordQueryKeys,
  getChallengeRecords,
} from "@/lib/queries/challengeRecordQuery";
import { IChallenge } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChallengeForm } from "@/components/challenges/ChallengeForm";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Edit,
  Trash,
  AlertTriangle,
  Trophy,
  CalendarDays,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGroupMember,
  groupMemberQueryKeys,
} from "@/lib/queries/groupMemberQuery";

const SkeletonCard = () => (
  <Card className="flex flex-col">
    <CardHeader>
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="h-4 w-4/5 mt-2" />
    </CardHeader>
    <CardContent className="flex-grow space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </CardContent>
    <CardFooter className="border-t pt-4">
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-9 w-16 ml-2" />
    </CardFooter>
  </Card>
);

interface IChallengeListProps {
  groupId: string;
  currentUserId: string;
}

export function ChallengeList({ groupId, currentUserId }: IChallengeListProps) {
  const [editChallenge, setEditChallenge] = useState<IChallenge | null>(null);
  const [deleteChallengeId, setDeleteChallengeId] = useState<string | null>(
    null
  );
  const router = useRouter();

  const {
    data: challenges,
    isLoading: isChallengeLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const { data: member } = useQuery({
    queryKey: groupMemberQueryKeys.getOne(groupId, currentUserId),
    queryFn: () => getGroupMember(groupId, currentUserId),
  });

  const { data: challengeRecords, isLoading: isChallengeRecordLoading } =
    useQuery({
      queryKey: challengeRecordQueryKeys.getAll(groupId),
      queryFn: () =>
        getChallengeRecords(groupId, {
          userId: currentUserId,
          monthly: "true",
        }),
    });

  const { mutate: updateChallenge, isPending: isUpdating } = useUpdateChallenge(
    groupId,
    {
      onSuccess: () => {
        toast({ title: "성공", description: "챌린지가 수정되었습니다." });
        setEditChallenge(null);
      },
      onError: (err) =>
        toast({
          title: "수정 실패",
          description: err.message,
          variant: "destructive",
        }),
    }
  );

  const { mutate: deleteChallenge, isPending: isDeleting } = useDeleteChallenge(
    groupId,
    {
      onSuccess: () => {
        toast({ title: "성공", description: "챌린지가 삭제되었습니다." });
        setDeleteChallengeId(null);
      },
      onError: (err) =>
        toast({
          title: "삭제 실패",
          description: err.message,
          variant: "destructive",
        }),
    }
  );

  const challengesWithProgressSum = useMemo(() => {
    if (!challenges || !challengeRecords) {
      return (
        challenges?.map((challenge) => ({
          ...challenge,
          challengeRecordCount: 0,
        })) || []
      );
    }

    const recordCountsByChallengeId = new Map<string, number>();

    challengeRecords.forEach((record) => {
      if (record.challenge_id) {
        const currentCount =
          recordCountsByChallengeId.get(record.challenge_id) || 0;
        recordCountsByChallengeId.set(record.challenge_id, currentCount + 1);
      }
    });

    return challenges.map((challenge) => {
      const challengeRecordCount =
        recordCountsByChallengeId.get(challenge.id) || 0;

      return {
        ...challenge,
        challengeRecordCount,
      };
    });
  }, [challenges, challengeRecords]);

  if (isChallengeLoading || isChallengeRecordLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-destructive/30 bg-destructive/5 p-8">
        <AlertTriangle className="h-14 w-14 text-destructive mb-5" />
        <h3 className="text-xl font-semibold text-destructive mb-2">
          챌린지 목록을 불러올 수 없습니다.
        </h3>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
        <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold">첫 챌린지를 만들어보세요!</h3>
        <p className="mt-2">
          모임의 첫 번째 목표를 설정하고 멤버들과 함께 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {challengesWithProgressSum.map((challenge) => (
        <Card
          key={challenge.id}
          className="flex flex-col hover:shadow-lg transition-shadow rounded-xl"
        >
          <div
            className="flex-grow cursor-pointer"
            onClick={() =>
              router.push(`/groups/${groupId}/challenges/${challenge.id}`)
            }
          >
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {challenge.title}
              </CardTitle>
              {challenge.description && (
                <CardDescription className="text-xs line-clamp-2 h-[32px]">
                  {challenge.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>
                  생성일:{" "}
                  {format(new Date(challenge.created_at), "yyyy.MM.dd", {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Trophy className="h-4 w-4 mr-2" />
                <span>
                  이번 달 달성량: {challenge.challengeRecordCount || 0}
                </span>
              </div>
            </CardContent>
          </div>
          {(member?.role === "owner" ||
            challenge.created_by === currentUserId) && (
            <CardFooter className="border-t p-3 flex justify-end gap-2">
              <Dialog
                open={editChallenge?.id === challenge.id}
                onOpenChange={(open) => !open && setEditChallenge(null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditChallenge(challenge)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> 수정
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <ChallengeForm
                    initialData={{
                      title: challenge.title,
                      description: challenge.description || "",
                    }}
                    onSubmit={(updatedData) =>
                      updateChallenge({
                        challengeId: challenge.id,
                        payload: updatedData,
                      })
                    }
                    isSubmitting={isUpdating}
                    mode={"edit"}
                    onClose={() => setEditChallenge(null)}
                  />
                </DialogContent>
              </Dialog>
              <AlertDialog
                open={deleteChallengeId === challenge.id}
                onOpenChange={(open) =>
                  setDeleteChallengeId(open ? challenge.id : null)
                }
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-4 w-4 mr-1" /> 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>챌린지 삭제 확인</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{challenge.title}" 챌린지를 정말 삭제하시겠습니까? 삭제된
                      챌린지는 복구할 수 없으며 챌린지 달성 데이터도 전부
                      삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteChallenge(challenge.id)}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}{" "}
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
