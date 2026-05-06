"use client";

import { motion } from "framer-motion";

import type { DecoratedClinic } from "@/lib/filter-clinics";
import { formatDistance } from "@/lib/filter-clinics";
import { cn } from "@/lib/utils";

interface ClinicCardProps {
  clinic: DecoratedClinic;
  onHover: (slug: string | null) => void;
  onSelect: (clinic: DecoratedClinic) => void;
}

export function ClinicCard({ clinic, onHover, onSelect }: ClinicCardProps) {
  const accent = `var(--seg-${clinic.segment})`;
  return (
    <motion.button
      type="button"
      layout="position"
      onMouseEnter={() => onHover(clinic.slug)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(clinic.slug)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(clinic)}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--radius-md)] px-4 py-3.5 text-left",
        "border border-transparent",
        "transition-colors duration-200",
        "hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        "focus-visible:border-[var(--brass-dim)] focus-visible:bg-[var(--surface-2)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:outline-none",
      )}
    >
      {/* hairline accent bar tied to segment */}
      <span
        aria-hidden
        className="absolute top-3 bottom-3 left-0 w-[2px] rounded-r-full opacity-70"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[16px] leading-snug tracking-tight text-[var(--ink)]">
            {clinic.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[var(--ink-muted)]">
            <SegmentChip label={subsegmentLabel(clinic)} accent={accent} />
            {clinic.hours_summary ? (
              <span className="text-[var(--ink-muted)]">{clinic.hours_summary}</span>
            ) : null}
          </div>

          <div className="mt-1.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.08em] text-[var(--ink-faint)] uppercase">
            {clinic.city ? <span>{clinic.city}</span> : null}
            {clinic.address_line ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{clinic.address_line}</span>
              </>
            ) : null}
          </div>
        </div>

        {clinic.distanceKm !== null ? (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="font-mono text-[12px] text-[var(--ink)] tabular-nums">
              {formatDistance(clinic.distanceKm)}
            </span>
            <span className="font-mono text-[9.5px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
              from centre
            </span>
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}

function SegmentChip({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px]"
      style={{
        borderColor: `color-mix(in oklab, ${accent} 50%, transparent)`,
        background: `color-mix(in oklab, ${accent} 14%, transparent)`,
        color: accent,
      }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: accent }} />
      <span className="font-mono tracking-[0.1em] uppercase">{label}</span>
    </span>
  );
}

function subsegmentLabel(c: DecoratedClinic): string {
  if (c.segment === "primary_care") {
    if (c.subsegment === "upcc") return "UPCC";
    if (c.subsegment === "walk_in") return "Walk-in";
    return "Primary care";
  }
  return c.segment.replace(/_/g, " ");
}
