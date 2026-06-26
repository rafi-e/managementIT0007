"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Building2 } from "lucide-react";
import Link from "next/link";
import type { UnitKerja } from "@/types";

interface UnitKerjaDetailProps {
  data: UnitKerja | undefined | null;
  isLoading: boolean;
}

const JENIS_BADGE: Record<string, string> = {
  KC: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  KCP: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  KK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Unit:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function UnitKerjaDetail({ data, isLoading }: UnitKerjaDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold">Unit kerja tidak ditemukan</h3>
        <Button variant="outline" asChild>
          <Link href="/unit-kerja">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="w-fit -ml-2">
        <Link href="/unit-kerja">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {data.nama}
          </h1>
          <p className="text-sm text-muted-foreground">Kode: {data.kode}</p>
        </div>
        <Badge
          className={`w-fit font-medium text-sm px-3 py-1 ${JENIS_BADGE[data.jenis] || ""}`}
          variant="outline"
        >
          {data.jenis}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Kode" value={data.kode} />
            <InfoRow label="Nama" value={data.nama} />
            <InfoRow label="Jenis" value={data.jenis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latitude && data.longitude && (
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Longitude" value={data.longitude} />
                <InfoRow label="Latitude" value={data.latitude} />
              </div>
            )}
            <InfoRow
              label="Alamat"
              value={data.alamat || "-"}
              isLongText
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  isLongText,
}: {
  label: string;
  value: string;
  isLongText?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={`text-sm font-medium ${isLongText ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
