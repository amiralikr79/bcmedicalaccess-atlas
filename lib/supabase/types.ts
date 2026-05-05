/**
 * Hand-written until `supabase gen types typescript` can run (it needs Docker).
 * Mirrors supabase/migrations/20260505205413_init.sql exactly. Regenerate
 * with `pnpm db:types` once a Supabase Docker stack is running.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SegmentKey =
  | "primary_care"
  | "diagnostic"
  | "specialist"
  | "dental"
  | "vision"
  | "mental_health"
  | "allied_health"
  | "naturopathic"
  | "aesthetic"
  | "reproductive_health"
  | "pediatric"
  | "travel_health"
  | "cannabis_pain"
  | "telehealth"
  | "private_surgical"
  | "pharmacy_clinical";

export interface ClinicHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          slug: string;
          segment: SegmentKey;
          subsegment: string | null;
          address_line: string | null;
          city: string | null;
          province: string;
          postal_code: string | null;
          /** PostGIS geography(Point, 4326) — serialized as GeoJSON or WKB string by PostgREST. */
          location: unknown;
          phone: string | null;
          website: string | null;
          hours_json: ClinicHours | null;
          hours_summary: string | null;
          accepting_new: boolean | null;
          wait_estimate: string | null;
          services: string[];
          languages: string[];
          accessibility: string[];
          parking: string | null;
          transit_notes: string | null;
          verified_at: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          segment: SegmentKey;
          subsegment?: string | null;
          address_line?: string | null;
          city?: string | null;
          province?: string;
          postal_code?: string | null;
          location: unknown;
          phone?: string | null;
          website?: string | null;
          hours_json?: ClinicHours | null;
          hours_summary?: string | null;
          accepting_new?: boolean | null;
          wait_estimate?: string | null;
          services?: string[];
          languages?: string[];
          accessibility?: string[];
          parking?: string | null;
          transit_notes?: string | null;
          verified_at?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type ClinicInsert = Database["public"]["Tables"]["clinics"]["Insert"];
export type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];
