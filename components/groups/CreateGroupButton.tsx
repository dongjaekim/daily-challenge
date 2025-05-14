"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GroupForm } from "@/components/groups/GroupForm";
import { useState } from "react";

export const CreateGroupButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>새 모임 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <GroupForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
