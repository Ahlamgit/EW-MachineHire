/**
 * Server Supabase client stub (Phase 1).
 * Intended for Server Components, Route Handlers, and Server Actions.
 * Uses the anon key + user session patterns (SSR wiring in Phase 2).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./env";

/**
 * Creates a short-lived server client when configured.
 * Phase 2 will replace this with cookie-based SSR (`@supabase/ssr`).
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url!, anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
