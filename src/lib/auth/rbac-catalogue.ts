import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type RbacCatalogue = {
  source: "supabase" | "unavailable";
  message: string;
  roleCount: number | null;
  permissionCount: number | null;
  profileCount: number | null;
  roles: { key: string; label: string }[];
  permissions: { key: string; description: string | null }[];
};

/**
 * Read Phase 2 RBAC seed tables when Supabase + session RLS allow.
 * Does not invent machines/compliance/hire data (those phases are later).
 */
export async function getRbacCatalogue(): Promise<RbacCatalogue> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      message:
        "Supabase env not configured. Catalogue below is the in-app Proposed list only — not a live DB read.",
      roleCount: null,
      permissionCount: null,
      profileCount: null,
      roles: [],
      permissions: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      source: "unavailable",
      message: "Supabase server client unavailable.",
      roleCount: null,
      permissionCount: null,
      profileCount: null,
      roles: [],
      permissions: [],
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      source: "unavailable",
      message: "Sign in to read live roles/permissions under RLS.",
      roleCount: null,
      permissionCount: null,
      profileCount: null,
      roles: [],
      permissions: [],
    };
  }

  const [rolesRes, permsRes, profilesRes] = await Promise.all([
    supabase.from("roles").select("key, label").order("key"),
    supabase.from("permissions").select("key, description").order("key"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  if (rolesRes.error || permsRes.error) {
    return {
      source: "unavailable",
      message:
        "Could not read RBAC tables (migration missing, or RLS denied). Apply Phase 2 SQL — docs/AUTH_SETUP.md.",
      roleCount: null,
      permissionCount: null,
      profileCount: null,
      roles: [],
      permissions: [],
    };
  }

  const roles = (rolesRes.data ?? []).map((row) => ({
    key: row.key as string,
    label: row.label as string,
  }));
  const permissions = (permsRes.data ?? []).map((row) => ({
    key: row.key as string,
    description: (row.description as string | null) ?? null,
  }));

  return {
    source: "supabase",
    message: "Live read from public.roles / public.permissions (Phase 2 migration).",
    roleCount: roles.length,
    permissionCount: permissions.length,
    profileCount: profilesRes.error ? null : (profilesRes.count ?? null),
    roles,
    permissions,
  };
}
