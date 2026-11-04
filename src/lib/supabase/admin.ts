/**
 * Privileged Supabase client stub — SERVER ONLY.
 * Uses SUPABASE_SERVICE_ROLE_KEY. Never import this module from Client Components.
 * Bypass RLS only for trusted server jobs (migrations helpers, admin maintenance).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerEnv } from "./env";

/**
 * Returns a service-role client when server env is fully configured; otherwise null.
 * Throws if accidentally invoked with a public-looking key pattern (defence in depth).
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  if (!url || !serviceRoleKey || serviceRoleKey.includes("YOUR_SUPABASE")) {
    return null;
  }

  if (serviceRoleKey.length < 20) {
    throw new Error(
      "Refusing to create admin client: SUPABASE_SERVICE_ROLE_KEY looks invalid.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
