import { getSupabaseUuid } from "@/utils/server-auth";
import { ClientGroupListPage } from "@/components/groups/ClientGroupListPage";
import { dehydrate } from "@tanstack/react-query";
import { groupQueryKeys } from "@/lib/queries/groupQuery";
import { getGroups } from "@/lib/queries/groupQuery";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";

export default async function GroupsPage() {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");

    return null;
  }

  const queryClient = makeQueryClient();
  queryClient.prefetchQuery({
    queryKey: groupQueryKeys.getAll(),
    queryFn: getGroups,
  });

  return <ClientGroupListPage dehydratedState={dehydrate(queryClient)} />;
}
