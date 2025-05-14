"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCreateGroup, useUpdateGroup } from "@/lib/mutations/groupMutations";

interface IGroupFormProps {
  initialData?: {
    name: string;
    description: string | null;
  };
  groupId?: string;
  setOpen?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const GroupForm = ({
  initialData,
  groupId,
  setOpen,
  onSuccess,
}: IGroupFormProps) => {
  const { toast } = useToast();
  const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutateAsync: updateGroup, isPending: isUpdating } = useUpdateGroup();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const isLoading = isCreating || isUpdating;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!name) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "모임 이름은 필수입니다.",
      });
      return;
    }

    try {
      if (groupId) {
        // 모임 정보 업데이트
        await updateGroup({
          id: groupId,
          name,
          description,
        });

        toast({
          title: "성공",
          description: "모임 정보가 업데이트되었습니다.",
        });

        // 다이얼로그 닫기
        setOpen?.(false);

        // 수정 성공 콜백
        onSuccess?.();
      } else {
        // 새 모임 생성
        await createGroup({ name, description });

        toast({
          title: "성공",
          description: "새 모임이 생성되었습니다.",
        });

        // 다이얼로그 닫기
        setOpen?.(false);

        setName("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {groupId ? "모임 정보 수정" : "새 모임 만들기"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {groupId
            ? "모임의 정보를 수정하세요."
            : "함께 활동할 새 모임을 만들어보세요."}
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            모임 이름
          </label>
          <Input
            id="name"
            placeholder="모임 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            모임 설명
          </label>
          <Textarea
            id="description"
            placeholder="모임에 대한 설명을 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading || !name}>
        {isLoading ? "처리 중..." : groupId ? "수정" : "만들기"}
      </Button>
    </form>
  );
};
