import { auth } from '@clerk/nextjs'
import { jwtDecode } from 'jwt-decode';

export async function getSupabaseUuid() {
  const { getToken } = auth()
  
  const token = await getToken({ template: "supabase" });
  if (!token) return undefined;

  const decoded = jwtDecode<{ supabase_uuid?: string }>(token);

  return decoded?.supabase_uuid as string | undefined
}