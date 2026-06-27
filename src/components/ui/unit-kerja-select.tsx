"use client";

import { useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitKerja } from "@/types";

interface UnitKerjaSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options?: UnitKerja[];
  loading?: boolean;
  includeAllOption?: boolean;
  allLabel?: string;
  noneLabel?: string;
  allValue?: string;
  className?: string;
  triggerClassName?: string;
  showBuildingIcon?: boolean;
  portal?: boolean;
}

export function UnitKerjaSelect({
  value,
  onValueChange,
  placeholder = "Pilih unit kerja",
  options = [],
  loading,
  includeAllOption,
  allLabel = "Semua unit kerja",
  noneLabel = "Tidak ada",
  allValue = "__all__",
  className,
  triggerClassName,
  showBuildingIcon,
}: UnitKerjaSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((uk) => {
    const q = search.toLowerCase();
    return (
      uk.kode.toLowerCase().includes(q) ||
      uk.nama.toLowerCase().includes(q) ||
      uk.jenis.toLowerCase().includes(q)
    );
  });

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
        if (o) {
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }}
    >
      <SelectTrigger className={triggerClassName}>
        {showBuildingIcon && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder={placeholder} />
          </div>
        )}
        {!showBuildingIcon && <SelectValue placeholder={placeholder} />}
      </SelectTrigger>
      <SelectContent className={cn("max-h-80", className)}>
        <div
          className="flex items-center gap-1.5 border-b px-2 pb-1.5 mb-1.5"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit kerja..."
            className="flex h-8 w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const items = document.querySelectorAll('[role="option"]');
                if (items.length > 0) {
                  (items[0] as HTMLElement).focus();
                }
              }
            }}
          />
        </div>
        {includeAllOption && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Memuat...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {search ? "Tidak ditemukan" : noneLabel}
          </div>
        ) : (
          filteredOptions.map((uk) => (
            <SelectItem key={uk.id} value={uk.id}>
              <span className="inline-flex items-center gap-1.5">
                <span>
                  {uk.kode} - {uk.jenis} {uk.nama}
                </span>
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
