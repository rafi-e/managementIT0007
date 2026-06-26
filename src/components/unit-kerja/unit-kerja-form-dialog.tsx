"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUnitKerja, useUpdateUnitKerja } from "@/hooks/use-unit-kerja";
import type { UnitKerja } from "@/types";
import type { UnitKerjaInput } from "@/lib/validations";
import toast from "react-hot-toast";

interface UnitKerjaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitKerja?: UnitKerja | null;
}

const JENIS_OPTIONS = [
  { value: "KC", label: "KC (Kantor Cabang)" },
  { value: "KCP", label: "KCP (Kantor Cabang Pembantu)" },
  { value: "KK", label: "KK (Kantor Kas)" },
  { value: "Unit", label: "Unit" },
];

export function UnitKerjaFormDialog({
  open,
  onOpenChange,
  unitKerja,
}: UnitKerjaFormDialogProps) {
  const isEdit = !!unitKerja;
  const createMutation = useCreateUnitKerja();
  const updateMutation = useUpdateUnitKerja();

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("");
  const [alamat, setAlamat] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unitKerja) {
      setKode(unitKerja.kode);
      setNama(unitKerja.nama);
      setJenis(unitKerja.jenis);
      setAlamat(unitKerja.alamat ?? "");
      setLongitude(unitKerja.longitude ?? "");
      setLatitude(unitKerja.latitude ?? "");
    } else {
      resetForm();
    }
  }, [unitKerja, open]);

  const resetForm = () => {
    setKode("");
    setNama("");
    setJenis("");
    setAlamat("");
    setLongitude("");
    setLatitude("");
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!kode.trim()) newErrors.kode = "Kode wajib diisi";
    if (!nama.trim()) newErrors.nama = "Nama wajib diisi";
    if (!jenis) newErrors.jenis = "Pilih jenis unit kerja";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: UnitKerjaInput = {
      kode: kode.trim(),
      nama: nama.trim(),
      jenis: jenis as UnitKerjaInput["jenis"],
      alamat: alamat.trim() || undefined,
      longitude: longitude.trim() || undefined,
      latitude: latitude.trim() || undefined,
    };

    if (isEdit && unitKerja) {
      updateMutation.mutate(
        { id: unitKerja.id, data },
        {
          onSuccess: () => {
            toast.success("Unit kerja berhasil diperbarui");
            onOpenChange(false);
            resetForm();
          },
          onError: () => toast.error("Gagal memperbarui unit kerja"),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Unit kerja berhasil ditambahkan");
          onOpenChange(false);
          resetForm();
        },
        onError: () => toast.error("Gagal menambahkan unit kerja"),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Unit Kerja" : "Tambah Unit Kerja"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data unit kerja"
              : "Isi form untuk menambahkan unit kerja baru"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Kode <span className="text-destructive">*</span>
              </Label>
              <Input
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="Contoh: KC001"
              />
              {errors.kode && (
                <p className="text-xs text-destructive">{errors.kode}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Jenis <span className="text-destructive">*</span>
              </Label>
              <Select value={jenis} onValueChange={setJenis}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.jenis && (
                <p className="text-xs text-destructive">{errors.jenis}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Nama Unit Kerja <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama unit kerja"
            />
            {errors.nama && (
              <p className="text-xs text-destructive">{errors.nama}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Alamat</Label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Alamat lengkap (opsional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Contoh: 106.8456"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Contoh: -6.2088"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
