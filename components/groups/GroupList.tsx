"use client";

import { Button } from "@/components/ui/button";
import { EditGroupButton } from "@/components/groups/EditGroupButton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getGroups } from "@/lib/queries/groupQuery";
import { groupQueryKeys } from "@/lib/queries/groupQuery";
import { useQuery } from "@tanstack/react-query";
import { useDeleteGroup } from "@/lib/mutations/groupMutations";

export function GroupList() {
  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);
  const { mutateAsync, isPending: isDeleting } = useDeleteGroup();
  const { toast } = useToast();
  const router = useRouter();

  const { data: groups } = useQuery({
    queryKey: groupQueryKeys.getAll(),
    queryFn: getGroups,
  });

  const handleDelete = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지

    try {
      await mutateAsync(groupId);

      toast({
        title: "성공",
        description: "모임이 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "모임 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setOpenDeleteId(null);
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  return (
    <div className="space-y-4">
      {groups?.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={(e) => {
            if (openEditId === group.id || openDeleteId === group.id) {
              e.stopPropagation();
              return;
            }
            handleGroupClick(group.id);
          }}
        >
          <div>
            <h3 className="font-medium">{group.name}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
            <p className="text-sm text-muted-foreground">
              멤버 수: {group.member_count}명
            </p>
          </div>
          {group.role === "owner" && (
            <div className="flex gap-2">
              <EditGroupButton
                group={group}
                onGroupUpdated={() => {
                  setOpenEditId(null);
                }}
                handleButtonClick={(e) => {
                  e.stopPropagation();
                  setOpenEditId(group.id);
                }}
              />
              <AlertDialog
                open={openDeleteId === group.id}
                onOpenChange={(open) => setOpenDeleteId(open ? group.id : null)}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={group.id === openDeleteId}
                    onClick={(e) => e.stopPropagation()}
                  >
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>모임 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말 이 모임을 삭제하시겠습니까? 삭제된 모임은 복구할 수
                      없으며 모임 내 데이터도 전부 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => handleDelete(group.id, e)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
