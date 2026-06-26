"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUnitKerjaList } from "@/hooks/use-unit-kerja";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin } from "lucide-react";

const UnitKerjaMap = dynamic(
  () =>
    import("@/components/unit-kerja/unit-kerja-map").then(
      (mod) => mod.UnitKerjaMap
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full rounded-lg" style={{ height: "70vh", minHeight: "400px" }} />
    ),
  }
);

export default function UnitKerjaMapsPage() {
  const user = useCurrentUser();
  const { data, isLoading } = useUnitKerjaList();

  if (!user) return null;

  const withKoordinat = data?.filter((item) => item.latitude && item.longitude) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/unit-kerja">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Peta Unit Kerja
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            {isLoading
              ? "Memuat data..."
              : `${withKoordinat.length} dari ${data?.length || 0} unit kerja memiliki koordinat`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="w-full rounded-lg" style={{ height: "70vh", minHeight: "400px" }} />
      ) : withKoordinat.length > 0 ? (
        <UnitKerjaMap data={withKoordinat} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <MapPin className="h-16 w-16 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">Belum ada data koordinat</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            Tambahkan longitude dan latitude pada data unit kerja untuk
            menampilkannya di peta
          </p>
          <Button variant="outline" asChild>
            <Link href="/unit-kerja">Kembali ke daftar</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
