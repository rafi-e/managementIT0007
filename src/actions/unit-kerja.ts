"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  getAllUnitKerja,
  getUnitKerjaById,
  createUnitKerja,
  updateUnitKerja,
  deleteUnitKerja,
} from "@/lib/db";
import type { UnitKerjaInput } from "@/lib/validations";
import { unitKerjaSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getAllUnitKerjaAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const data = await getAllUnitKerja();
  return serialize(data);
}

export async function getUnitKerjaAction(id: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const data = await getUnitKerjaById(id);
  return serialize(data);
}

export async function createUnitKerjaAction(data: UnitKerjaInput) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const parsed = unitKerjaSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        "Validasi gagal: " + JSON.stringify(parsed.error.flatten())
      );
    }

    const unitKerja = await createUnitKerja(parsed.data);
    revalidatePath("/unit-kerja");
    return serialize(unitKerja);
  } catch (error) {
    console.error("createUnitKerjaAction failed:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Gagal menyimpan unit kerja");
  }
}

export async function updateUnitKerjaAction(
  id: string,
  data: Partial<UnitKerjaInput>
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const parsed = unitKerjaSchema.partial().safeParse(data);
    if (!parsed.success) {
      throw new Error(
        "Validasi gagal: " + JSON.stringify(parsed.error.flatten())
      );
    }

    const unitKerja = await updateUnitKerja(id, parsed.data);
    revalidatePath("/unit-kerja");
    return serialize(unitKerja);
  } catch (error) {
    console.error("updateUnitKerjaAction failed:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Gagal memperbarui unit kerja");
  }
}

export async function deleteUnitKerjaAction(id: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;
    await deleteUnitKerja(id);
    revalidatePath("/unit-kerja");
  } catch (error) {
    console.error("deleteUnitKerjaAction failed:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Gagal menghapus unit kerja");
  }
}


