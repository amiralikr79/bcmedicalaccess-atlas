"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { segments as ALL_SEGMENTS } from "@/lib/segments";
import {
  SUBSEGMENTS,
  clearAllSegments,
  isSegmentOn,
  isSubsegmentOn,
  selectAllSegments,
  toggleSegment,
  toggleSubsegment,
  type Filters,
} from "@/lib/filters";
import type { ClinicMarker } from "@/lib/db";
import type { SegmentKey } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const SUBSEGMENT_LABEL: Record<string, string> = {
  upcc: "UPCC",
  walk_in: "Walk-in",
  primary_care: "Family practice",
};

interface FilterControlsProps {
  filters: Filters;
  update: (mut: (f: Filters) => Filters) => void;
  /** Unfiltered clinics in the current viewport — used to compute chip counts. */
  inViewClinics: readonly ClinicMarker[];
}

export function FilterControls({ filters, update, inViewClinics }: FilterControlsProps) {
  const [showSubsFor, setShowSubsFor] = useState<SegmentKey | null>(
    filters.subsegments !== null ? "primary_care" : null,
  );

  // counts by segment in current viewport (unfiltered)
  const segCounts = new Map<SegmentKey, number>();
  for (const c of inViewClinics) {
    segCounts.set(c.segment, (segCounts.get(c.segment) ?? 0) + 1);
  }
  const subCounts = new Map<string, number>();
  for (const c of inViewClinics) {
    if (c.segment === "primary_care") {
      const sub = c.subsegment ?? "primary_care";
      subCounts.set(sub, (subCounts.get(sub) ?? 0) + 1);
    }
  }

  const allOn = filters.segments === null;
  const noneOn = filters.segments !== null && filters.segments.size === 0;

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="border-b border-[var(--border)] px-5 py-4">
        <SearchInput value={filters.q} onChange={(q) => update((f) => ({ ...f, q }))} />
      </div>

      {/* Toggles */}
      <div className="flex gap-2 border-b border-[var(--border)] px-5 py-3">
        <Toggle
          label="Accepting new"
          on={filters.acceptingOnly}
          onClick={() => update((f) => ({ ...f, acceptingOnly: !f.acceptingOnly }))}
        />
        <Toggle
          label="Open now"
          on={filters.openNow}
          onClick={() => update((f) => ({ ...f, openNow: !f.openNow }))}
        />
      </div>

      {/* Segment header + select-all/clear */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pt-4 pb-2.5">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
          Segments
        </h2>
        <button
          type="button"
          onClick={() => update((f) => (allOn ? clearAllSegments(f) : selectAllSegments(f)))}
          className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink-muted)] uppercase transition-colors hover:text-[var(--ink)]"
        >
          {allOn ? "Clear" : noneOn ? "Select all" : "Select all"}
        </button>
      </div>

      {/* Chips */}
      <motion.ul
        className="flex flex-col gap-1 px-3 py-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.03 } },
        }}
      >
        {ALL_SEGMENTS.map((seg) => {
          const on = isSegmentOn(filters, seg.key);
          const count = segCounts.get(seg.key) ?? 0;
          const hasSubs = SUBSEGMENTS[seg.key].length > 0;
          const expanded = showSubsFor === seg.key && on && hasSubs;
          return (
            <motion.li
              key={seg.key}
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
              }}
            >
              <SegmentChip
                label={seg.label}
                colorVar={seg.cssVar}
                count={count}
                on={on}
                hasSubs={hasSubs}
                expanded={expanded}
                onToggle={() => update((f) => toggleSegment(f, seg.key))}
                onToggleExpand={() => setShowSubsFor(expanded ? null : seg.key)}
              />
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="subs"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1">
                      {SUBSEGMENTS[seg.key].map((sub) => {
                        const subOn = isSubsegmentOn(filters, sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => update((f) => toggleSubsegment(f, sub))}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                              "font-sans text-[11px] transition-colors",
                              subOn
                                ? "border-[var(--brass-dim)] bg-[color-mix(in_oklab,var(--brass)_14%,transparent)] text-[var(--ink)]"
                                : "border-[var(--border)] text-[var(--ink-faint)] hover:text-[var(--ink-muted)]",
                            )}
                          >
                            {SUBSEGMENT_LABEL[sub] ?? sub}
                            <span className="font-mono text-[9.5px] tabular-nums opacity-70">
                              {subCounts.get(sub) ?? 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}

// ─── search input with debounced URL write ───────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // sync down (e.g. when filters cleared from elsewhere)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onChangeRef.current(local), 200);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [local, value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ink-faint)]" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search clinic, address, neighbourhood…"
        className="pr-8 pl-9"
        aria-label="Search clinics"
      />
      {local ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// ─── small toggle pill ───────────────────────────────────────────────

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
        "font-sans text-[11.5px] transition-colors",
        on
          ? "border-[var(--brass-dim)] bg-[color-mix(in_oklab,var(--brass)_14%,transparent)] text-[var(--ink)]"
          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]",
      )}
    >
      <span
        className={cn(
          "grid size-3.5 place-items-center rounded-[3px] border transition-colors",
          on
            ? "border-[var(--brass)] bg-[var(--brass)] text-[#1A1410]"
            : "border-[var(--border-strong)] bg-transparent",
        )}
      >
        {on ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      {label}
    </button>
  );
}

// ─── segment chip ────────────────────────────────────────────────────

function SegmentChip({
  label,
  colorVar,
  count,
  on,
  hasSubs,
  expanded,
  onToggle,
  onToggleExpand,
}: {
  label: string;
  colorVar: string;
  count: number;
  on: boolean;
  hasSubs: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-[var(--radius-md)] transition-colors",
        on ? "bg-[var(--surface-2)]/60" : "bg-transparent",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={cn(
          "flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5",
          "text-left transition-colors",
          "hover:bg-[var(--surface-2)]",
        )}
      >
        {/* dot with halo */}
        <span aria-hidden className="relative inline-flex size-3 items-center justify-center">
          <span
            className={cn(
              "absolute inset-0 rounded-full transition-opacity",
              on ? "opacity-50 blur-[5px]" : "opacity-0",
            )}
            style={{ background: `var(${colorVar})` }}
          />
          <span
            className={cn(
              "relative size-2.5 rounded-full ring-1 ring-black/40 transition-opacity",
              on ? "opacity-100" : "opacity-30",
            )}
            style={{ background: `var(${colorVar})` }}
          />
        </span>
        <span
          className={cn(
            "font-sans text-[13.5px] tracking-tight transition-colors",
            on ? "text-[var(--ink)]" : "text-[var(--ink-faint)]",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "ml-auto font-mono text-[11px] tabular-nums transition-colors",
            on ? "text-[var(--ink-muted)]" : "text-[var(--ink-faint)]",
          )}
        >
          {count.toString().padStart(2, "0")}
        </span>
      </button>
      {hasSubs ? (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? "Hide sub-segments" : "Show sub-segments"}
          aria-expanded={expanded}
          className={cn(
            "mr-1 grid size-7 place-items-center rounded-[var(--radius-sm)] transition-colors",
            "text-[var(--ink-faint)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
            !on && "pointer-events-none opacity-30",
          )}
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
      ) : null}
    </div>
  );
}
