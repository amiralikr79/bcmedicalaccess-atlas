"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

import { FilterControls } from "./FilterControls";
import { ClinicList } from "./ClinicList";
import { EmptyState } from "./EmptyState";
import type { ClinicMarker } from "@/lib/db";
import type { DecoratedClinic } from "@/lib/filter-clinics";
import { emptyFilters, type Filters } from "@/lib/filters";

interface FilterSidebarProps {
  filters: Filters;
  update: (mut: (f: Filters) => Filters) => void;
  writeUrl: (next: Filters) => void;
  inViewClinics: readonly ClinicMarker[];
  filteredClinics: readonly DecoratedClinic[];
  onHover: (slug: string | null) => void;
  onSelect: (c: DecoratedClinic) => void;
}

export function FilterSidebar({
  filters,
  update,
  writeUrl,
  inViewClinics,
  filteredClinics,
  onHover,
  onSelect,
}: FilterSidebarProps) {
  return (
    <aside className="relative z-10 hidden h-full min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
      <SidebarHeader />
      <div className="flex min-h-0 flex-1 flex-col">
        <FilterControls filters={filters} update={update} inViewClinics={inViewClinics} />
        <div className="flex items-baseline justify-between border-y border-[var(--border)] px-5 pt-3 pb-2">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
            In view
          </h2>
          <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
            {filteredClinics.length.toString().padStart(2, "0")}
            <span className="text-[var(--ink-faint)]">
              {" "}
              / {inViewClinics.length.toString().padStart(2, "0")}
            </span>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredClinics.length === 0 ? (
            <EmptyState onClear={() => writeUrl(emptyFilters())} />
          ) : (
            <ClinicList clinics={filteredClinics} onHover={onHover} onSelect={onSelect} />
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
      <Link href="/" className="group inline-flex items-center gap-3" aria-label="Back to landing">
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-2)]"
        >
          <Compass className="size-3.5 text-[var(--brass)] transition-transform duration-500 group-hover:-rotate-45" />
        </span>
        <span className="font-display text-[14px] tracking-tight">BC Clinic Atlas</span>
      </Link>
      <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
        atlas
      </span>
    </header>
  );
}
