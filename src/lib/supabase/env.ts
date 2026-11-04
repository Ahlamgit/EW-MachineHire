/**
 * Environment helpers for Supabase.
 * Privileged keys must never use the NEXT_PUBLIC_ prefix.
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

/** Local-only escape hatch when Supabase is not configured. Never enable in production. */
export function allowUnconfiguredShell(): boolean {
  return process.env.DEV_ALLOW_UNCONFIGURED_SHELL === "true";
}
