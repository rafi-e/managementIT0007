"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUnitKerjaList, useDeleteUnitKerja } from "@/hooks/use-unit-kerja";
import { UnitKerjaTable } from "@/components/unit-kerja/unit-kerja-table";
import { UnitKerjaFormDialog } from "@/components/unit-kerja/unit-kerja-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin } from "lucide-react";
import type { UnitKerja } from "@/types";

export default function UnitKerjaPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { data, isLoading } = useUnitKerjaList();
  const deleteMutation = useDeleteUnitKerja();

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnitKerja, setEditingUnitKerja] = useState<UnitKerja | null>(
    null
  );

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !data) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.kode.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        item.jenis.toLowerCase().includes(q) ||
        item.alamat?.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const handleEdit = (item: UnitKerja) => {
    setEditingUnitKerja(item);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingUnitKerja(null);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleView = (id: string) => {
    router.push(`/unit-kerja/${id}`);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Unit Kerja
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data unit kerja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/unit-kerja/maps">
              <MapPin className="mr-2 h-4 w-4" />
              Peta
            </Link>
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Cari unit kerja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <UnitKerjaTable
        data={filteredData}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onView={handleView}
      />

      <UnitKerjaFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingUnitKerja(null);
        }}
        unitKerja={editingUnitKerja}
      />
    </div>
  );
}
