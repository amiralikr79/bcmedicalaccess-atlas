import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Browser / Server Component client — anon key, RLS enforced.
 * Reads NEXT_PUBLIC_* so it works in both runtimes.
 */
export function createBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)",
    );
  }
  return createClient<Database>(url, anon, {
    auth: { persistSession: false },
  });
}

/**
 * Service-role client — bypasses RLS. Only call from server-only code
 * (route handlers, scripts). Throws if used in the browser bundle.
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient may not be called in browser context");
  }
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
