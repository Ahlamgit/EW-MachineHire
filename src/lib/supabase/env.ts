/**
 * Environment helpers for Supabase.
 * Phase 1: placeholders only — no live connection required.
 */

export type SupabasePublicEnv = {
  url: string | undefined;
  anonKey: string | undefined;
};

export type SupabaseServerEnv = SupabasePublicEnv & {
  serviceRoleKey: string | undefined;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  return {
    ...getSupabasePublicEnv(),
    // Server-only — never expose via NEXT_PUBLIC_* or client imports.
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(
    url &&
      anonKey &&
      !url.includes("YOUR_PROJECT_REF") &&
      !anonKey.includes("YOUR_SUPABASE"),
  );
}
