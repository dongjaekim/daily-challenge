import { getSupabaseUuid } from "@/utils/server-auth";
import { ClientGroupListPage } from "@/components/groups/ClientGroupListPage";
import { groupQueryKeys } from "@/lib/queries/groupQuery";
import { getGroups } from "@/lib/queries/groupQuery";
import { useQueryClient } from "@tanstack/react-query";

export default async function GroupListPage() {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");

    return null;
  }

  const queryClient = useQueryClient();
  queryClient.prefetchQuery({
    queryKey: groupQueryKeys.getAll(),
    queryFn: getGroups,
  });

  return <ClientGroupListPage />;
}
