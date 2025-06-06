"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ChallengeForm } from "@/components/challenges/ChallengeForm";
import { ChallengeList } from "@/components/challenges/ChallengeList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useCreateChallenge } from "@/lib/mutations/challengeMutations";
import { ArrowLeft, Plus } from "lucide-react";

interface IClientChallengesProps {
  groupId: string;
  currentUserId: string;
}

export function ClientChallenges({
  groupId,
  currentUserId,
}: IClientChallengesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();

  const { mutate: createChallenge, isPending: isCreating } = useCreateChallenge(
    groupId,
    {
      onSuccess: () => {
        toast({
          title: "성공",
          description: "새로운 챌린지가 생성되었습니다.",
        });
        setIsCreateDialogOpen(false);
      },
      onError: (error) => {
        toast({
          title: "생성 실패",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/groups/${groupId}`)}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">챌린지 관리</h1>
            <p className="text-muted-foreground mt-1">
              모임의 목표를 설정하고 관리하세요.
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />새 챌린지 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ChallengeForm
              onSubmit={(data) => createChallenge(data)}
              isSubmitting={isCreating}
              onClose={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>
      <main>
        <ChallengeList groupId={groupId} currentUserId={currentUserId} />
      </main>
    </div>
  );
}
