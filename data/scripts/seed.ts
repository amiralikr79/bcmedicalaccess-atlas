/**
 * Seed script: data/seed/upcc_walkin_metrovan.csv → public.clinics.
 *
 * Behaviour
 *   1. Parse CSV.
 *   2. For any row missing lat/lng, geocode against Nominatim
 *      (1 req/sec, custom User-Agent; respects their usage policy).
 *   3. Upsert by slug.
 *   4. Logs per-row outcome; exits non-zero if any insert errored.
 *
 * Insert path
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase JS client (PostgREST).
 *   Otherwise → direct postgres (DATABASE_URL). The fallback is what we use
 *   when the Supabase API stack isn't running locally.
 *   Force one path via SEED_VIA=supabase | pg.
 *
 * Usage
 *   pnpm db:seed
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { parse as parseCsv } from "csv-parse/sync";
import { config as loadEnv } from "dotenv";
import { Client as PgClient } from "pg";
import { createClient as createSupabase } from "@supabase/supabase-js";

import type { ClinicInsert, SegmentKey } from "@/lib/supabase/types";

// ─── env ─────────────────────────────────────────────────────────────
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ?? "BCClinicAtlas/0.1 (seed; contact: maintainer@example.com)";
const NOMINATIM_BASE = process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org";

// ─── csv row shape ───────────────────────────────────────────────────
type CsvRow = {
  name: string;
  slug: string;
  segment: string;
  subsegment: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  lat: string;
  lng: string;
  phone: string;
  website: string;
  hours_summary: string;
  accepting_new: string;
  wait_estimate: string;
  services: string;
  languages: string;
  accessibility: string;
  parking: string;
  transit_notes: string;
  source: string;
};

type Coords = { lat: number; lng: number };

// ─── nominatim geocoder, rate-limited ────────────────────────────────
let lastGeocodeAt = 0;
async function geocode(query: string): Promise<Coords | null> {
  // Nominatim allows max 1 req/sec — keep at least 1100ms apart.
  const elapsed = Date.now() - lastGeocodeAt;
  if (elapsed < 1100) await sleep(1100 - elapsed);
  lastGeocodeAt = Date.now();

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ca");

  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch (err) {
    console.warn(`  · network error querying nominatim: ${(err as Error).message}`);
    return null;
  }
  if (!res.ok) {
    console.warn(`  · nominatim ${res.status} for "${query}"`);
    return null;
  }
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

function buildGeocodeQuery(row: CsvRow): string {
  if (row.address_line && row.city) {
    return `${row.address_line}, ${row.city}, British Columbia, Canada`;
  }
  // Fall back to clinic name + city — less reliable but worth a try.
  return [row.name, row.city, "British Columbia", "Canada"].filter(Boolean).join(", ");
}

// ─── csv parsing helpers ─────────────────────────────────────────────
function splitArr(value: string): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(value: string): boolean | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return true;
  if (v === "false" || v === "no" || v === "0") return false;
  return null;
}

function nullable(value: string): string | null {
  return value && value.trim() ? value.trim() : null;
}

const VALID_SEGMENTS: ReadonlySet<SegmentKey> = new Set<SegmentKey>([
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

// ─── insert paths ────────────────────────────────────────────────────
type Prepared = {
  row: CsvRow;
  coords: Coords;
};

async function insertViaPg(prepared: Prepared[]): Promise<{ ok: number; failed: string[] }> {
  const dbUrl =
    process.env.DATABASE_URL ?? "postgresql://atlas:atlas@localhost:5432/bc_clinic_atlas";
  const client = new PgClient({ connectionString: dbUrl });
  await client.connect();
  try {
    let ok = 0;
    const failed: string[] = [];
    for (const { row, coords } of prepared) {
      try {
        await client.query(
          `insert into public.clinics (
             name, slug, segment, subsegment, address_line, city, province,
             postal_code, location, phone, website, hours_summary,
             accepting_new, wait_estimate, services, languages, accessibility,
             parking, transit_notes, source
           ) values (
             $1,$2,$3,$4,$5,$6,$7,$8,
             ST_SetSRID(ST_MakePoint($9,$10),4326)::geography,
             $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
           )
           on conflict (slug) do update set
             name=excluded.name, segment=excluded.segment, subsegment=excluded.subsegment,
             address_line=excluded.address_line, city=excluded.city, province=excluded.province,
             postal_code=excluded.postal_code, location=excluded.location, phone=excluded.phone,
             website=excluded.website, hours_summary=excluded.hours_summary,
             accepting_new=excluded.accepting_new, wait_estimate=excluded.wait_estimate,
             services=excluded.services, languages=excluded.languages,
             accessibility=excluded.accessibility, parking=excluded.parking,
             transit_notes=excluded.transit_notes, source=excluded.source`,
          [
            row.name,
            row.slug,
            row.segment,
            nullable(row.subsegment),
            nullable(row.address_line),
            nullable(row.city),
            row.province || "BC",
            nullable(row.postal_code),
            coords.lng,
            coords.lat,
            nullable(row.phone),
            nullable(row.website),
            nullable(row.hours_summary),
            parseBool(row.accepting_new),
            nullable(row.wait_estimate),
            splitArr(row.services),
            splitArr(row.languages),
            splitArr(row.accessibility),
            nullable(row.parking),
            nullable(row.transit_notes),
            nullable(row.source),
          ],
        );
        ok++;
      } catch (err) {
        failed.push(`${row.slug}: ${(err as Error).message}`);
      }
    }
    return { ok, failed };
  } finally {
    await client.end();
  }
}

async function insertViaSupabase(prepared: Prepared[]): Promise<{ ok: number; failed: string[] }> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createSupabase(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ok = 0;
  const failed: string[] = [];
  for (const { row, coords } of prepared) {
    // Send geography as WKT string with SRID — PostgREST casts text → geography.
    const wkt = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
    const insert: ClinicInsert = {
      name: row.name,
      slug: row.slug,
      segment: row.segment as SegmentKey,
      subsegment: nullable(row.subsegment),
      address_line: nullable(row.address_line),
      city: nullable(row.city),
      province: row.province || "BC",
      postal_code: nullable(row.postal_code),
      location: wkt,
      phone: nullable(row.phone),
      website: nullable(row.website),
      hours_summary: nullable(row.hours_summary),
      accepting_new: parseBool(row.accepting_new) ?? undefined,
      wait_estimate: nullable(row.wait_estimate),
      services: splitArr(row.services),
      languages: splitArr(row.languages),
      accessibility: splitArr(row.accessibility),
      parking: nullable(row.parking),
      transit_notes: nullable(row.transit_notes),
      source: nullable(row.source),
    };
    const { error } = await supabase.from("clinics").upsert(insert, { onConflict: "slug" });
    if (error) failed.push(`${row.slug}: ${error.message}`);
    else ok++;
  }
  return { ok, failed };
}

// ─── main ────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const csvPath = resolve(process.cwd(), "data/seed/upcc_walkin_metrovan.csv");
  const raw = readFileSync(csvPath, "utf8");
  const rows: CsvRow[] = parseCsv(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`▸ ${rows.length} rows read from ${csvPath}`);

  // validate segment values up front
  for (const r of rows) {
    if (!VALID_SEGMENTS.has(r.segment as SegmentKey)) {
      throw new Error(`row ${r.slug}: invalid segment "${r.segment}"`);
    }
  }

  // resolve coords (CSV first, then geocoder)
  const prepared: Prepared[] = [];
  const geocodeFailures: string[] = [];

  for (const row of rows) {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      prepared.push({ row, coords: { lat, lng } });
      continue;
    }
    const query = buildGeocodeQuery(row);
    process.stdout.write(`  · geocoding ${row.slug} … `);
    const coords = await geocode(query);
    if (coords) {
      console.log(`ok  (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      prepared.push({ row, coords });
    } else {
      console.log(`FAIL  "${query}"`);
      geocodeFailures.push(row.slug);
    }
  }

  console.log(
    `▸ geocode summary: ${prepared.length}/${rows.length} resolved, ${geocodeFailures.length} failed`,
  );

  // pick insert path
  const forced = process.env.SEED_VIA;
  const useSupabase =
    forced === "supabase" ||
    (forced !== "pg" && !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`▸ insert path: ${useSupabase ? "supabase service role" : "postgres direct"}`);

  const { ok, failed } = useSupabase
    ? await insertViaSupabase(prepared)
    : await insertViaPg(prepared);

  console.log(`\n▸ done: ${ok} inserted/updated, ${failed.length} insert errors`);
  if (failed.length) {
    for (const line of failed) console.error(`  ✗ ${line}`);
  }
  if (geocodeFailures.length) {
    console.warn(`\n▸ geocode failures (${geocodeFailures.length}):`);
    for (const slug of geocodeFailures) console.warn(`  ✗ ${slug}`);
  }

  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
