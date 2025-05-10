"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChallengeForm } from "@/components/challenges/ChallengeForm";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { IChallenge } from "@/types";
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
import { Loader2 } from "lucide-react";

interface IChallengeListProps {
  groupId: string;
  challenges: IChallenge[];
  role: "owner" | "member";
  currentUserId: string;
  onChallengeUpdated?: (updatedChallenge: IChallenge) => void;
  onChallengeDeleted?: (deletedChallengeId: String) => void;
}

export function ChallengeList({
  groupId,
  challenges,
  role,
  currentUserId,
  onChallengeUpdated,
  onChallengeDeleted,
}: IChallengeListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [editChallengeId, setEditChallengeId] = useState<string | null>(null);
  const [deleteChallengeId, setDeleteChallengeId] = useState<string | null>(
    null
  );
  const router = useRouter();

  // 날짜 형식 변환 헬퍼 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "yyyy년 MM월 dd일", { locale: ko });
    } catch (error) {
      console.error("날짜 형식 변환 오류:", error);
      return "날짜 정보 없음";
    }
  };

  const handleDelete = async (challengeId: string) => {
    setIsLoading(challengeId);

    try {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${challengeId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("챌린지 삭제에 실패했습니다.");
      }

      toast({
        title: "성공",
        description: "챌린지가 삭제되었습니다.",
      });

      if (onChallengeDeleted) {
        onChallengeDeleted(challengeId);
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "챌린지 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleChallengeUpdated = (updatedChallenge: IChallenge) => {
    if (onChallengeUpdated) {
      onChallengeUpdated(updatedChallenge);
    }
    setEditChallengeId(null);
  };

  // const handleChallengeClick = (challengeId: string) => {
  //   router.push(`/groups/${groupId}/challenges/${challengeId}`);
  // };

  return (
    <div className="space-y-4">
      {challenges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          등록한 챌린지가 없습니다. 새 챌린지를 생성해보세요!
        </div>
      ) : (
        challenges.map((challenge) => (
          <div
            key={challenge.id}
            // className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            className="flex items-center justify-between rounded-lg border p-4"
            onClick={(e) => {
              if (
                editChallengeId === challenge.id ||
                deleteChallengeId === challenge.id
              ) {
                e.stopPropagation();
                return;
              }
              // handleChallengeClick(challenge.id);
            }}
          >
            <div>
              <h3 className="font-medium">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
              <p className="text-sm text-muted-foreground">
                생성일: {formatDate(challenge.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                이번 달 달성량: {challenge.progressSum || 0}
              </p>
            </div>
            <div className="flex gap-2">
              {(role === "owner" || challenge.created_by === currentUserId) && (
                <>
                  <Dialog
                    open={editChallengeId === challenge.id}
                    onOpenChange={(open) => {
                      if (!open) setEditChallengeId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChallengeId(challenge.id);
                        }}
                      >
                        수정
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <ChallengeForm
                        groupId={groupId}
                        challengeId={challenge.id}
                        initialData={{
                          title: challenge.title,
                          description: challenge.description || "",
                        }}
                        onSuccess={handleChallengeUpdated}
                        onClose={() => setEditChallengeId(null)}
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
                      <Button
                        variant="destructive"
                        disabled={isLoading === challenge.id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isLoading === challenge.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            삭제 중...
                          </>
                        ) : (
                          "삭제"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>챌린지 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          정말 이 챌린지를 삭제하시겠습니까? 삭제된 챌린지는
                          복구할 수 없으며 챌린지 달성 데이터도 전부 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(challenge.id)}
                          disabled={isLoading === challenge.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isLoading === challenge.id ? "삭제 중..." : "삭제"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
