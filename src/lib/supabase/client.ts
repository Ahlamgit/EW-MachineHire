/**
 * Browser Supabase client stub (Phase 1).
 * Uses the anon key only. Do not import service-role credentials here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./env";

let browserClient: SupabaseClient | null = null;

/**
 * Returns a browser client when env is configured; otherwise null.
 * Phase 1 shell does not call live APIs.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  browserClient = createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
}
