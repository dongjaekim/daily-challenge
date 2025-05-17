"use client";

import { GroupList } from "@/components/groups/GroupList";
import { CreateGroupButton } from "@/components/groups/CreateGroupButton";

export function ClientGroupListPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">모임 목록</h1>
        <CreateGroupButton />
      </div>
      <div className="mt-8">
        <GroupList />
      </div>
    </div>
  );
}
