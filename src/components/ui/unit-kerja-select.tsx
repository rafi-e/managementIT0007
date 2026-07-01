"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = value
    ? options.find((uk) => uk.id === value) || null
    : null;

  const displayValue =
    value === allValue
      ? allLabel
      : selectedOption
      ? `${selectedOption.kode} - ${selectedOption.jenis} ${selectedOption.nama}`
      : "";

  const filteredOptions = options.filter((uk) => {
    const q = search.toLowerCase();
    return (
      uk.kode.toLowerCase().includes(q) ||
      uk.nama.toLowerCase().includes(q) ||
      uk.jenis.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
            triggerClassName
          )}
        >
          {showBuildingIcon && (
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={open ? search : displayValue}
            onChange={(e) => {
              if (!open) setOpen(true);
              setSearch(e.target.value);
            }}
            onFocus={() => {
              if (!open) setOpen(true);
            }}
            placeholder={open ? "Cari unit kerja..." : displayValue || placeholder}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
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
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 min-w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Memuat...
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>
                {search ? "Tidak ditemukan" : noneLabel}
              </CommandEmpty>
            ) : (
              <>
                {includeAllOption && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onValueChange(allValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === allValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {allLabel}
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup>
                  {filteredOptions.map((uk) => (
                    <CommandItem
                      key={uk.id}
                      onSelect={() => {
                        onValueChange(uk.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === uk.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>
                        {uk.kode} - {uk.jenis} {uk.nama}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
