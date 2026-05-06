"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { segments as ALL_SEGMENTS } from "./segments";
import type { SegmentKey } from "./supabase/types";

const ALL_SEGMENT_KEYS = ALL_SEGMENTS.map((s) => s.key);

/** Sub-segments we expose for primary_care today; expandable per segment. */
export const SUBSEGMENTS: Record<SegmentKey, readonly string[]> = {
  primary_care: ["upcc", "walk_in", "primary_care"],
  diagnostic: [],
  specialist: [],
  dental: [],
  vision: [],
  mental_health: [],
  allied_health: [],
  naturopathic: [],
  aesthetic: [],
  reproductive_health: [],
  pediatric: [],
  travel_health: [],
  cannabis_pain: [],
  telehealth: [],
  private_surgical: [],
  pharmacy_clinical: [],
};

/**
 * Filter state. `null` for `segments` / `subsegments` means "all selected"
 * (the default; absence from URL). An empty Set means "explicitly nothing".
 */
export type Filters = {
  segments: ReadonlySet<SegmentKey> | null;
  subsegments: ReadonlySet<string> | null;
  q: string;
  acceptingOnly: boolean;
  openNow: boolean;
};

const EMPTY: Filters = {
  segments: null,
  subsegments: null,
  q: "",
  acceptingOnly: false,
  openNow: false,
};

// ─── url ⇄ state ─────────────────────────────────────────────────────

export function parseFilters(params: URLSearchParams): Filters {
  const rawSegs = params.get("segments");
  let segments: Filters["segments"];
  if (rawSegs === null) {
    segments = null;
  } else if (rawSegs === "") {
    segments = new Set();
  } else {
    const valid = rawSegs
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is SegmentKey => ALL_SEGMENT_KEYS.includes(s as SegmentKey));
    segments = new Set(valid);
    // collapse "everything" back to default for stable canonicalization
    if (segments.size === ALL_SEGMENT_KEYS.length) segments = null;
  }

  const rawSubs = params.get("subsegments");
  let subsegments: Filters["subsegments"];
  if (rawSubs === null) {
    subsegments = null;
  } else if (rawSubs === "") {
    subsegments = new Set();
  } else {
    subsegments = new Set(
      rawSubs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  return {
    segments,
    subsegments,
    q: params.get("q")?.trim() ?? "",
    acceptingOnly: params.get("accepting") === "1",
    openNow: params.get("open") === "1",
  };
}

export function serializeFilters(f: Filters): URLSearchParams {
  const out = new URLSearchParams();
  if (f.segments !== null) {
    // canonical: emit in segment-priority order so the URL is stable
    const ordered = ALL_SEGMENT_KEYS.filter((k) => f.segments!.has(k));
    out.set("segments", ordered.join(","));
  }
  if (f.subsegments !== null) {
    out.set("subsegments", [...f.subsegments].join(","));
  }
  if (f.q) out.set("q", f.q);
  if (f.acceptingOnly) out.set("accepting", "1");
  if (f.openNow) out.set("open", "1");
  return out;
}

// ─── helpers used by the UI ──────────────────────────────────────────

export function isSegmentOn(filters: Filters, key: SegmentKey): boolean {
  return filters.segments === null || filters.segments.has(key);
}

export function isSubsegmentOn(filters: Filters, sub: string): boolean {
  return filters.subsegments === null || filters.subsegments.has(sub);
}

export function toggleSegment(filters: Filters, key: SegmentKey): Filters {
  const current = filters.segments;
  if (current === null) {
    // demote "all" to "all minus this"
    const next = new Set(ALL_SEGMENT_KEYS);
    next.delete(key);
    return { ...filters, segments: next };
  }
  const next = new Set(current);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  // collapse to "all" if user re-selected everything
  if (next.size === ALL_SEGMENT_KEYS.length) {
    return { ...filters, segments: null };
  }
  return { ...filters, segments: next };
}

export function toggleSubsegment(filters: Filters, sub: string): Filters {
  const current = filters.subsegments;
  if (current === null) {
    // we don't know the full universe of sub-segments cheaply, so demoting
    // "all" to "all minus this" doesn't make sense. Treat null as a one-time
    // implicit "all on" — first toggle starts an explicit set with all
    // sub-segments for primary_care minus the one being toggled.
    const universe = SUBSEGMENTS.primary_care;
    const next = new Set<string>(universe);
    next.delete(sub);
    return { ...filters, subsegments: next };
  }
  const next = new Set(current);
  if (next.has(sub)) next.delete(sub);
  else next.add(sub);
  return { ...filters, subsegments: next };
}

export function selectAllSegments(filters: Filters): Filters {
  return { ...filters, segments: null, subsegments: null };
}

export function clearAllSegments(filters: Filters): Filters {
  return { ...filters, segments: new Set() };
}

export function emptyFilters(): Filters {
  return { ...EMPTY };
}

// ─── react hook ──────────────────────────────────────────────────────

/**
 * Source of truth = URL search params. All setters call `router.replace()`
 * (no scroll, no history push) so back/forward stays clean.
 *
 * Caller component MUST be wrapped in a <Suspense> boundary because
 * useSearchParams suspends until hydration on Next 15.
 */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<Filters>(
    () => parseFilters(new URLSearchParams(params.toString())),
    [params],
  );

  // Hold a ref to the latest filters so debounced setters always merge against
  // current state, not a stale closure.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const writeUrl = useCallback(
    (next: Filters) => {
      const qs = serializeFilters(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router],
  );

  const update = useCallback(
    (mut: (current: Filters) => Filters) => {
      writeUrl(mut(filtersRef.current));
    },
    [writeUrl],
  );

  return { filters, update, writeUrl };
}
