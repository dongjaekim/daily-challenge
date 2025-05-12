import { supabase } from "@/lib/supabase";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;

  const { data } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || "")
    .upload(file.name, file, { upsert: true });

  return data;
}

export function getImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/${path}`;
}

export async function searchFiles(search: string = "") {
  const { data } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || "")
    .list(search);

  return data;
}

export async function deleteFile(fileName: string) {
  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || "")
    .remove([fileName]);

  return data;
}

function handleError(error: any) {
  if (error) {
    console.error("Upload Error: ", error);
    throw error;
  }
}
