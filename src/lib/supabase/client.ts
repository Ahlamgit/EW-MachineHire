/**
 * Browser Supabase client (anon key only).
 * Do not import service-role credentials here.
 */
import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./env";

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url!, anonKey!);
}
