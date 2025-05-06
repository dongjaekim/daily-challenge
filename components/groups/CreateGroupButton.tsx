"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GroupForm } from "@/components/groups/GroupForm";
import { useState } from "react";

interface ICreateGroupButtonProps {
  onGroupCreated?: (newGroup: any) => void;
}

export const CreateGroupButton = ({
  onGroupCreated,
}: ICreateGroupButtonProps) => {
  const [open, setOpen] = useState(false);

  // 새 모임 생성 후 콜백 처리
  const handleGroupCreated = (newGroup: any) => {
    if (onGroupCreated) {
      onGroupCreated(newGroup);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>새 모임 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <GroupForm setOpen={setOpen} onSuccess={handleGroupCreated} />
      </DialogContent>
    </Dialog>
  );
};
