/**
 * Environment helpers for Supabase.
 * Privileged keys must never use the NEXT_PUBLIC_ prefix.
 *
 * Client key resolution:
 * - Prefer NEXT_PUBLIC_SUPABASE_ANON_KEY when set (legacy / classic name).
 * - Otherwise accept NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (dashboard "publishable" alias).
 * Both are the browser-safe project key; never confuse with the service-role secret.
 */

export type SupabasePublicEnv = {
  url: string | undefined;
  /** Resolved client key (anon or publishable alias). */
  anonKey: string | undefined;
  /** Which env var supplied the client key (for diagnostics; never log the value). */
  clientKeySource: "anon" | "publishable" | "none";
};

export type SupabaseServerEnv = Omit<SupabasePublicEnv, "clientKeySource"> & {
  serviceRoleKey: string | undefined;
};

function isPlaceholder(value: string | undefined, needles: string[]): boolean {
  if (!value) return true;
  return needles.some((needle) => value.includes(needle));
}

/**
 * Resolve the browser/client Supabase key.
 * Auth and SSR clients keep using the returned `anonKey` field unchanged.
 */
export function resolveSupabaseClientKey(): {
  key: string | undefined;
  source: SupabasePublicEnv["clientKeySource"];
} {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (anon && !isPlaceholder(anon, ["YOUR_SUPABASE", "YOUR_ANON"])) {
    return { key: anon, source: "anon" };
  }
  if (
    publishable &&
    !isPlaceholder(publishable, ["YOUR_SUPABASE", "YOUR_PUBLISHABLE"])
  ) {
    return { key: publishable, source: "publishable" };
  }

  // Fall back to raw values so callers can still detect "set but placeholder"
  if (anon) return { key: anon, source: "anon" };
  if (publishable) return { key: publishable, source: "publishable" };
  return { key: undefined, source: "none" };
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const { key, source } = resolveSupabaseClientKey();
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: key,
    clientKeySource: source,
  };
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const { url, anonKey } = getSupabasePublicEnv();
  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(
    url &&
      anonKey &&
      !isPlaceholder(url, ["YOUR_PROJECT_REF"]) &&
      !isPlaceholder(anonKey, ["YOUR_SUPABASE", "YOUR_ANON", "YOUR_PUBLISHABLE"]),
  );
}

/** Presence-only diagnostics — never returns secret values. */
export function getSupabaseConfigPresence(): {
  configured: boolean;
  urlSet: boolean;
  clientKeySet: boolean;
  clientKeySource: SupabasePublicEnv["clientKeySource"];
  serviceRoleSet: boolean;
  allowUnconfiguredShell: boolean;
} {
  const { url, anonKey, clientKeySource } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    configured: isSupabaseConfigured(),
    urlSet: Boolean(url && !isPlaceholder(url, ["YOUR_PROJECT_REF"])),
    clientKeySet: Boolean(
      anonKey &&
        !isPlaceholder(anonKey, [
          "YOUR_SUPABASE",
          "YOUR_ANON",
          "YOUR_PUBLISHABLE",
        ]),
    ),
    clientKeySource,
    serviceRoleSet: Boolean(
      serviceRoleKey &&
        !isPlaceholder(serviceRoleKey, ["YOUR_SUPABASE", "YOUR_SERVICE"]),
    ),
    allowUnconfiguredShell: allowUnconfiguredShell(),
  };
}

/** Local-only escape hatch when Supabase is not configured. Never enable in production. */
export function allowUnconfiguredShell(): boolean {
  return process.env.DEV_ALLOW_UNCONFIGURED_SHELL === "true";
}
