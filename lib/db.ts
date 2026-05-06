import "server-only";

import { Pool } from "pg";
import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";

import type { ClinicHours, Database, SegmentKey } from "./supabase/types";

/**
 * Server-only data access.
 *
 * Two paths, picked at request time:
 *   - Supabase: when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or anon) are set.
 *     Uses the canonical Supabase JS client + RPC.
 *   - Direct Postgres: fallback for local dev without a running Supabase API.
 *     Uses node-postgres against DATABASE_URL.
 *
 * Both paths call the same SQL function (public.clinics_in_bbox) and return
 * the same shape, so callers don't care.
 */

export type ClinicMarker = {
  id: string;
  name: string;
  slug: string;
  segment: SegmentKey;
  subsegment: string | null;
  address_line: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  hours_summary: string | null;
  hours_json: ClinicHours | null;
  accepting_new: boolean | null;
  lat: number;
  lng: number;
};

export type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

let pool: Pool | undefined;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? "postgresql://atlas:atlas@localhost:5432/bc_clinic_atlas",
      max: 4,
    });
  }
  return pool;
}

let supabase: SupabaseClient<Database> | undefined;
function getSupabase(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!supabase) {
    supabase = createSupabase<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

export async function getClinicsInBbox(bbox: Bbox, segment?: SegmentKey): Promise<ClinicMarker[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc(
      "clinics_in_bbox" as never,
      {
        min_lng: bbox.minLng,
        min_lat: bbox.minLat,
        max_lng: bbox.maxLng,
        max_lat: bbox.maxLat,
        segment_filter: segment ?? null,
      } as never,
    );
    if (error) throw new Error(`supabase rpc clinics_in_bbox: ${error.message}`);
    return (data as ClinicMarker[]) ?? [];
  }

  const { rows } = await getPool().query<ClinicMarker>(
    `select id, name, slug, segment, subsegment,
            address_line, city, postal_code, phone, website,
            hours_summary, hours_json, accepting_new,
            lat, lng
       from public.clinics_in_bbox($1, $2, $3, $4, $5)`,
    [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat, segment ?? null],
  );
  return rows;
}
