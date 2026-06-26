"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUnitKerjaAction,
  getUnitKerjaAction,
  createUnitKerjaAction,
  updateUnitKerjaAction,
  deleteUnitKerjaAction,
} from "@/actions/unit-kerja";
import type { UnitKerja } from "@/types";
import type { UnitKerjaInput } from "@/lib/validations";

export function useUnitKerjaList() {
  return useQuery({
    queryKey: ["unit-kerja"],
    queryFn: async () => {
      const data = await getAllUnitKerjaAction();
      return data as unknown as UnitKerja[];
    },
  });
}

export function useUnitKerja(id: string | undefined) {
  return useQuery({
    queryKey: ["unit-kerja", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await getUnitKerjaAction(id);
      return data as unknown as UnitKerja | null;
    },
    enabled: !!id,
  });
}

export function useCreateUnitKerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UnitKerjaInput) => {
      const result = await createUnitKerjaAction(data);
      return result as unknown as UnitKerja;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-kerja"] });
    },
  });
}

export function useUpdateUnitKerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UnitKerjaInput>;
    }) => {
      const result = await updateUnitKerjaAction(id, data);
      return result as unknown as UnitKerja;
    },
    onSuccess: (unitKerja) => {
      queryClient.invalidateQueries({ queryKey: ["unit-kerja"] });
      queryClient.invalidateQueries({ queryKey: ["unit-kerja", unitKerja.id] });
    },
  });
}

export function useDeleteUnitKerja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteUnitKerjaAction(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-kerja"] });
    },
  });
}


