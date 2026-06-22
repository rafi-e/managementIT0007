import { supabase } from "./supabase";

const BUCKET_NAME = "task-attachments";

export interface UploadResult {
  url: string;
  publicId: string;
  size: number;
  type: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: File,
  taskId: string
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${taskId}/${timestamp}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: publicUrl,
    publicId: data.path,
    size: file.size,
    type: file.type,
    width: 0,
    height: 0,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([publicId]);

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
