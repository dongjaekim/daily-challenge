"use client";

import { ChallengeForm } from "@/components/challenges/ChallengeForm";
import { ChallengeList } from "@/components/challenges/ChallengeList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IChallenge } from "@/types";
import { Toaster } from "../ui/toaster";

interface IClientChallengesProps {
  groupId: string;
  initialChallenges: IChallenge[];
  userRole: "owner" | "member";
  currentUserId: string;
}

export function ClientChallenges({
  groupId,
  initialChallenges,
  userRole,
  currentUserId,
}: IClientChallengesProps) {
  const [challenges, setChallenges] = useState<IChallenge[]>(initialChallenges);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 새 챌린지 추가 (useCallback으로 메모이제이션)
  const handleChallengeCreated = useCallback(
    (challenge: IChallenge) => {
      // 새 챌린지에 달성 횟수 0 추가
      const newChallenge = {
        ...challenge,
        progressSum: 0,
        created_by: currentUserId,
      };
      setChallenges((prev) => [newChallenge, ...prev]);
      setIsOpen(false);
    },
    [currentUserId]
  );

  // 챌린지 업데이트 (useCallback으로 메모이제이션)
  const handleChallengeUpdated = useCallback((updatedChallenge: IChallenge) => {
    setChallenges((prev) =>
      prev.map((challenge) =>
        challenge.id === updatedChallenge.id
          ? { ...challenge, ...updatedChallenge }
          : challenge
      )
    );
  }, []);

  // 챌린지 삭제 (useCallback으로 메모이제이션)
  const handleChallengeDeleted = useCallback((deletedChallengeId: String) => {
    setChallenges((prev) =>
      prev.filter((challenge) => challenge.id !== deletedChallengeId)
    );
  }, []);

  return (
    <div className="space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/groups/${groupId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">챌린지 목록</h1>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>새 챌린지 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <ChallengeForm
              groupId={groupId}
              onSuccess={handleChallengeCreated}
              onClose={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <ChallengeList
        groupId={groupId}
        challenges={challenges}
        role={userRole}
        currentUserId={currentUserId}
        onChallengeUpdated={handleChallengeUpdated}
        onChallengeDeleted={handleChallengeDeleted}
      />
    </div>
  );
}
