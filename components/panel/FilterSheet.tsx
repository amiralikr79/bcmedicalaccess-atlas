"use client";

import { useState } from "react";
import { ListFilter } from "lucide-react";

import { FilterControls } from "./FilterControls";
import { ClinicList } from "./ClinicList";
import { EmptyState } from "./EmptyState";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ClinicMarker } from "@/lib/db";
import type { DecoratedClinic } from "@/lib/filter-clinics";
import { emptyFilters, type Filters } from "@/lib/filters";

interface FilterSheetProps {
  filters: Filters;
  update: (mut: (f: Filters) => Filters) => void;
  writeUrl: (next: Filters) => void;
  inViewClinics: readonly ClinicMarker[];
  filteredClinics: readonly DecoratedClinic[];
  onSelect: (c: DecoratedClinic) => void;
}

export function FilterSheet({
  filters,
  update,
  writeUrl,
  inViewClinics,
  filteredClinics,
  onSelect,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const activeFilters =
    (filters.segments !== null ? 1 : 0) +
    (filters.subsegments !== null ? 1 : 0) +
    (filters.q ? 1 : 0) +
    (filters.acceptingOnly ? 1 : 0) +
    (filters.openNow ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/85 px-3 py-2 text-[12px] text-[var(--ink)] backdrop-blur-md transition-colors hover:bg-[var(--surface-2)]"
        >
          <ListFilter className="size-3.5" />
          <span>List & filters</span>
          <span className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
            {filteredClinics.length.toString().padStart(2, "0")}
          </span>
          {activeFilters > 0 ? (
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--brass)]" />
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="responsive" className="md:max-w-md">
        <SheetHeader>
          <SheetTitle>Atlas filters</SheetTitle>
          <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
            {filteredClinics.length.toString().padStart(2, "0")} of{" "}
            {inViewClinics.length.toString().padStart(2, "0")} on screen
          </p>
        </SheetHeader>
        <SheetBody className="px-0">
          <FilterControls filters={filters} update={update} inViewClinics={inViewClinics} />
          <div className="flex items-baseline justify-between border-y border-[var(--border)] px-5 pt-3 pb-2">
            <h2 className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
              In view
            </h2>
            <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
              {filteredClinics.length.toString().padStart(2, "0")}
            </span>
          </div>
          {filteredClinics.length === 0 ? (
            <EmptyState onClear={() => writeUrl(emptyFilters())} />
          ) : (
            <ClinicList
              clinics={filteredClinics}
              onHover={() => {}}
              onSelect={(c) => {
                onSelect(c);
                setOpen(false);
              }}
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
