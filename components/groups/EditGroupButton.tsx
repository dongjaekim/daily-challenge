"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GroupForm } from "@/components/groups/GroupForm";
import { IGroup } from "@/types";
import { useState } from "react";
import { Edit } from "lucide-react";

interface IUpdateGroupButtonProps {
  group: IGroup;
  onGroupUpdated?: () => void;
  handleButtonClick: (e: React.MouseEvent) => void;
}

export const EditGroupButton = ({
  group,
  onGroupUpdated,
  handleButtonClick,
}: IUpdateGroupButtonProps) => {
  const [open, setOpen] = useState(false);

  // 새 모임 생성 후 콜백 처리
  const handleGroupUpdated = () => {
    onGroupUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button variant="ghost" onClick={handleButtonClick} size="sm">
          <Edit className="h-4 w-4 mr-1" /> 수정
        </Button>
      </DialogTrigger>
      <DialogContent>
        <GroupForm
          initialData={{
            name: group.name,
            description: group.description,
          }}
          groupId={group.id}
          setOpen={setOpen}
          onSuccess={handleGroupUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};
