import type { ClinicMarker } from "./db";
import type { Filters } from "./filters";
import type { ClinicHours } from "./supabase/types";

// ─── distance ────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(sa));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ─── open-now parser ─────────────────────────────────────────────────

const DAY_KEYS: ReadonlyArray<keyof ClinicHours> = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

/** Parse "9-5", "8:30-16:30", "08:30-16:30" into [startMinutes, endMinutes]. */
function parseRange(spec: string): [number, number] | null {
  const trimmed = spec.trim().toLowerCase();
  if (!trimmed || trimmed === "closed") return null;
  const m = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const sh = Number(m[1]);
  const sm = m[2] ? Number(m[2]) : 0;
  let eh = Number(m[3]);
  const em = m[4] ? Number(m[4]) : 0;
  // crude pm heuristic — "9-5" likely means 9am-5pm; promote end if smaller
  if (eh < sh && eh < 12) eh += 12;
  return [sh * 60 + sm, eh * 60 + em];
}

export function isOpenAt(hours: ClinicHours | null | undefined, when: Date): boolean {
  if (!hours) return false;
  const day = DAY_KEYS[when.getDay()];
  const spec = hours[day];
  if (!spec) return false;
  const range = parseRange(spec);
  if (!range) return false;
  const minutes = when.getHours() * 60 + when.getMinutes();
  return minutes >= range[0] && minutes <= range[1];
}

// ─── filter pipeline ─────────────────────────────────────────────────

export interface DecoratedClinic extends ClinicMarker {
  distanceKm: number | null;
}

export function decorate(
  clinics: readonly ClinicMarker[],
  center: { lat: number; lng: number } | null,
): DecoratedClinic[] {
  return clinics.map((c) => ({
    ...c,
    distanceKm: center ? haversineKm(center, { lat: c.lat, lng: c.lng }) : null,
  }));
}

export function applyFilters(
  clinics: readonly DecoratedClinic[],
  filters: Filters,
  now: Date = new Date(),
): DecoratedClinic[] {
  const q = filters.q.trim().toLowerCase();
  return clinics.filter((c) => {
    if (filters.segments !== null && !filters.segments.has(c.segment)) return false;
    if (filters.subsegments !== null) {
      // sub-segments only narrow within their parent segment; rows from other
      // segments pass through untouched.
      if (c.segment === "primary_care") {
        const sub = c.subsegment ?? "primary_care";
        if (!filters.subsegments.has(sub)) return false;
      }
    }
    if (filters.acceptingOnly && c.accepting_new !== true) return false;
    if (filters.openNow && !isOpenAt(c.hours_json, now)) return false;
    if (q) {
      const hay = [c.name, c.address_line ?? "", c.city ?? "", c.subsegment ?? ""]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortByDistance(clinics: DecoratedClinic[]): DecoratedClinic[] {
  return [...clinics].sort((a, b) => {
    const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });
}
