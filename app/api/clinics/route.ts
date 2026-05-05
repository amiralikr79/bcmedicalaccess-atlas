import { NextResponse } from "next/server";

import { getClinicsInBbox, type Bbox } from "@/lib/db";
import type { SegmentKey } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // pg + Supabase JS need node, not edge

const VALID_SEGMENTS = new Set<SegmentKey>([
  "primary_care",
  "diagnostic",
  "specialist",
  "dental",
  "vision",
  "mental_health",
  "allied_health",
  "naturopathic",
  "aesthetic",
  "reproductive_health",
  "pediatric",
  "travel_health",
  "cannabis_pain",
  "telehealth",
  "private_surgical",
  "pharmacy_clinical",
]);

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const bounds = url.searchParams.get("bounds");
  if (!bounds) {
    return NextResponse.json(
      { error: "missing bounds=minLng,minLat,maxLng,maxLat" },
      { status: 400 },
    );
  }

  const parts = bounds.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return NextResponse.json(
      { error: "bounds must be 4 comma-separated numbers" },
      { status: 400 },
    );
  }
  const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];
  if (minLng >= maxLng || minLat >= maxLat) {
    return NextResponse.json({ error: "invalid bounds order" }, { status: 400 });
  }

  const bbox: Bbox = { minLng, minLat, maxLng, maxLat };

  const segParam = url.searchParams.get("segment");
  let segment: SegmentKey | undefined;
  if (segParam) {
    if (!VALID_SEGMENTS.has(segParam as SegmentKey)) {
      return NextResponse.json({ error: `unknown segment "${segParam}"` }, { status: 400 });
    }
    segment = segParam as SegmentKey;
  }

  try {
    const clinics = await getClinicsInBbox(bbox, segment);
    return NextResponse.json(
      { count: clinics.length, clinics },
      { headers: { "cache-control": "private, max-age=10" } },
    );
  } catch (err) {
    console.error("[/api/clinics]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
