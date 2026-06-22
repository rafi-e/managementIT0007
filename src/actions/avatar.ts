"use server";

import { requireAuth } from "@/lib/auth-actions";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAvatarUrl(url: string): Promise<void> {
  const session = await requireAuth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
}

export async function deleteAvatarAction() {
  const session = await requireAuth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (user?.image) {
    const publicUrl = supabase.storage.from("task-attachments").getPublicUrl("");
    const baseUrl = publicUrl.data.publicUrl.replace(/\/$/, "");
    const filePath = user.image.replace(`${baseUrl}/`, "");

    if (filePath.startsWith("avatars/")) {
      await supabase.storage.from("task-attachments").remove([filePath]);
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
}
