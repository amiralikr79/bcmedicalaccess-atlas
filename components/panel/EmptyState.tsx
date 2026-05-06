"use client";

import { Telescope } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-14 text-center">
      <div
        aria-hidden
        className="grid size-14 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--ink-faint)]"
      >
        <Telescope className="size-6" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-display text-[18px] leading-snug tracking-tight text-[var(--ink)]">
          No clinics match.
        </p>
        <p className="max-w-[28ch] text-[13px] leading-[1.5] text-[var(--ink-muted)]">
          Try widening your search — pan the map, drop a filter, or clear the search box.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
