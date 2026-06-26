"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Eye, Plus, Building2 } from "lucide-react";
import type { UnitKerja } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface UnitKerjaTableProps {
  data: UnitKerja[] | undefined;
  isLoading: boolean;
  onEdit: (item: UnitKerja) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onView: (id: string) => void;
}

export function UnitKerjaTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  onView,
}: UnitKerjaTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      toast.success("Unit kerja berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus unit kerja");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold">Belum ada unit kerja</h3>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Tambah unit kerja pertama untuk mulai mengelola data unit kerja
        </p>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Unit Kerja
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="hidden md:table-cell">Alamat</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-medium">{item.kode}</TableCell>
                <TableCell>
                  <span className="font-medium">{item.jenis} {item.nama}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                  {item.alamat || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(item.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={deleteId === item.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteId(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Unit Kerja</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{item.nama}</strong>? Tindakan
                            ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
