"use client";

import { use } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUnitKerja } from "@/hooks/use-unit-kerja";
import { UnitKerjaDetail } from "@/components/unit-kerja/unit-kerja-detail";

export default function UnitKerjaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useCurrentUser();
  const { data, isLoading } = useUnitKerja(id);

  if (!user) return null;

  return <UnitKerjaDetail data={data} isLoading={isLoading} />;
}
