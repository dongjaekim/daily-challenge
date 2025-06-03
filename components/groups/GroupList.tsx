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
import { getGroups, groupQueryKeys } from "@/lib/queries/groupQuery";
import { useQuery } from "@tanstack/react-query";
import { useDeleteGroup } from "@/lib/mutations/groupMutations";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  PlusCircle,
  AlertTriangle,
  Edit,
  Trash,
  Loader2,
  ExternalLink,
} from "lucide-react"; // 아이콘 추가
import { SkeletonGroupCard } from "./SkeletonGroupCard"; // 스켈레톤 카드 임포트
import { CreateGroupButton } from "./CreateGroupButton"; // 빈 상태에서 사용

export function GroupList() {
  // EditGroupButton이 자체 Dialog를 갖는다고 가정하고, 이 상태는 EditGroupButton에 직접 전달
  const [openEditModalForGroupId, setOpenEditModalForGroupId] = useState<
    string | null
  >(null);
  const [openDeleteDialogForGroupId, setOpenDeleteDialogForGroupId] = useState<
    string | null
  >(null);

  const { mutate: deleteGroupMutate, isPending: isDeleting } = useDeleteGroup();
  const { toast } = useToast();
  const router = useRouter();

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: groupQueryKeys.getAll(),
    queryFn: getGroups,
  });

  const handleDeleteGroup = async (groupId: string) => {
    try {
      deleteGroupMutate(groupId);

      toast({
        title: "성공",
        description: "모임이 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description:
          (error as Error).message || "모임 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setOpenDeleteDialogForGroupId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonGroupCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-destructive/30 bg-destructive/5 p-8">
        <AlertTriangle className="h-14 w-14 text-destructive mb-5" />
        <h3 className="text-xl font-semibold text-destructive mb-2">
          이런, 문제가 발생했어요!
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          모임 정보를 불러오는 데 실패했습니다. 네트워크 연결을 확인하거나 잠시
          후 다시 시도해주세요.
          {error?.message && (
            <span className="block text-xs mt-2">({error.message})</span>
          )}
        </p>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin hidden" />{" "}
          {/* 실제 refetch 시 로딩 스피너 제어 필요 */}
          다시 시도
        </Button>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-lg bg-card shadow">
        <Users className="mx-auto h-20 w-20 text-muted-foreground/50 mb-6" />
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">
          아직 활동 중인 모임이 없네요.
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md px-4">
          새로운 모임을 만들어 사람들과 교류하거나, 관심 있는 기존 모임에
          참여해보세요!
        </p>
        <CreateGroupButton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <Card
          key={group.id}
          className="flex flex-col hover:shadow-xl transition-all duration-300 ease-in-out rounded-xl overflow-hidden"
        >
          <div
            className="flex-grow cursor-pointer"
            onClick={() => router.push(`/groups/${group.id}`)}
          >
            <CardHeader className="pb-3">
              {/* TODO: 그룹 대표 이미지나 아이콘 표시 영역 (선택 사항) */}
              {/* <div className="h-32 bg-muted rounded-md mb-4 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div> */}
              <CardTitle className="text-lg font-semibold tracking-tight line-clamp-1">
                {group.name}
              </CardTitle>
              {group.description && (
                <CardDescription className="text-xs line-clamp-2 h-[32px] mt-1">
                  {" "}
                  {/* 2줄 고정 높이 */}
                  {group.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>멤버 {group.member_count || 0}명</span>
              </div>
              {/* 추가 정보 예시 (실제 데이터가 있다면 활용) */}
              {/* <p className="text-xs text-muted-foreground mt-1">
                생성일: {format(new Date(group.created_at), "yyyy.MM.dd")}
              </p> */}
            </CardContent>
          </div>
          {group.role === "owner" && (
            <CardFooter className="border-t bg-muted/20 p-3 flex justify-end gap-2">
              <EditGroupButton
                group={group}
                handleButtonClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
              <AlertDialog
                open={openDeleteDialogForGroupId === group.id}
                onOpenChange={(open) =>
                  setOpenDeleteDialogForGroupId(open ? group.id : null)
                }
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 방지
                      setOpenDeleteDialogForGroupId(group.id);
                    }}
                    className="gap-1"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">삭제</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>모임 삭제 확인</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로{" "}
                      <span className="font-bold text-foreground">
                        "{group.name}"
                      </span>{" "}
                      모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모임
                      내 모든 데이터(게시글, 댓글 등)가 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel disabled={isDeleting}>
                      취소
                    </AlertDialogCancel>

                    <AlertDialogAction
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      삭제하기
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
