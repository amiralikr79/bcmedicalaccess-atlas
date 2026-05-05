"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, ListFilter } from "lucide-react";

import { MapShell } from "./MapShell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ClinicMarker } from "@/lib/db";

export function AtlasShell() {
  const [clinics, setClinics] = useState<ClinicMarker[]>([]);

  return (
    <div className="relative grid h-full min-h-0 grid-cols-1 lg:grid-cols-[380px_1fr]">
      {/* ───── Desktop sidebar ───── */}
      <aside className="relative z-10 hidden h-full min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <SidebarHeader />
        <SidebarBody clinics={clinics} />
        <SidebarFooter clinicCount={clinics.length} />
      </aside>

      {/* ───── Map ───── */}
      <section className="relative h-full min-h-0">
        <MapShell onClinicsInView={setClinics} className="absolute inset-0" />

        {/* Mobile-only chrome */}
        <MobileTopBar count={clinics.length} clinics={clinics} />
      </section>
    </div>
  );
}

// ─── desktop sidebar pieces ──────────────────────────────────────────

function SidebarHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
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

function SidebarBody({ clinics }: { clinics: ClinicMarker[] }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filters placeholder */}
      <section className="border-b border-[var(--border)] px-6 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
            Filters
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-2 py-0.5 font-mono text-[9.5px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
            soon
          </span>
        </div>
        <p className="font-display mt-3 text-[15px] leading-snug text-[var(--ink-muted)]">
          Filter by segment, accepting status,
          <br />
          and language — next phase.
        </p>
      </section>

      {/* In-view list */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
            In view
          </h2>
          <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
            {clinics.length.toString().padStart(2, "0")}
          </span>
        </div>
        <ClinicList clinics={clinics} />
      </section>
    </div>
  );
}

function ClinicList({ clinics }: { clinics: ClinicMarker[] }) {
  if (!clinics.length) {
    return (
      <div className="px-6 py-10 text-[13px] text-[var(--ink-faint)]">
        Pan or zoom the map. Clinics in view will appear here.
      </div>
    );
  }
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto pb-4">
      {clinics.map((c) => (
        <li
          key={c.id}
          className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[var(--surface-2)]"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{
              background: `var(--seg-${c.segment})`,
              boxShadow: `0 0 6px var(--seg-${c.segment})`,
            }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] text-[var(--ink)]">{c.name}</span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">
              {c.subsegment ?? c.segment.replace("_", " ")} · {c.city ?? ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SidebarFooter({ clinicCount }: { clinicCount: number }) {
  return (
    <footer className="flex items-center justify-between border-t border-[var(--border)] px-6 py-3 font-mono text-[10px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
      <span>Metro Van · Beta</span>
      <span className="tabular-nums">{clinicCount} in view</span>
    </footer>
  );
}

// ─── mobile chrome ───────────────────────────────────────────────────

function MobileTopBar({ count, clinics }: { count: number; clinics: ClinicMarker[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-start justify-between p-4 lg:hidden">
      <Link
        href="/"
        aria-label="Back to landing"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/85 px-3 py-2 text-[12px] text-[var(--ink)] backdrop-blur-md"
      >
        <Compass className="size-3.5 text-[var(--brass)]" />
        <span className="font-display">BC Clinic Atlas</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/85 px-3 py-2 text-[12px] text-[var(--ink)] backdrop-blur-md transition-colors hover:bg-[var(--surface-2)]"
          >
            <ListFilter className="size-3.5" />
            <span>List</span>
            <span className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
              {count.toString().padStart(2, "0")}
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="responsive" className="md:max-w-sm">
          <SheetHeader>
            <SheetTitle>In view</SheetTitle>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
              {count} clinic{count === 1 ? "" : "s"} on screen
            </p>
          </SheetHeader>
          <SheetBody className="px-0">
            <ClinicList clinics={clinics} />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
