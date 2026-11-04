import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PermissionKey } from "@/lib/auth/permissions";

export type AuthContext = {
  configured: boolean;
  userId: string | null;
  email: string | null;
  permissions: PermissionKey[];
  roles: string[];
};

export async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      userId: null,
      email: null,
      permissions: [],
      roles: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      userId: null,
      email: null,
      permissions: [],
      roles: [],
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      userId: null,
      email: null,
      permissions: [],
      roles: [],
    };
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(key)")
    .eq("user_id", user.id);

  const roles =
    roleRows
      ?.map((row) => {
        const nested = row.roles as { key?: string } | { key?: string }[] | null;
        if (Array.isArray(nested)) return nested[0]?.key;
        return nested?.key;
      })
      .filter((key): key is string => Boolean(key)) ?? [];

  const { data: permissionRows } = await supabase.rpc(
    "current_user_permission_keys",
  );

  const permissions = Array.isArray(permissionRows)
    ? (permissionRows as PermissionKey[])
    : [];

  return {
    configured: true,
    userId: user.id,
    email: user.email ?? null,
    permissions,
    roles,
  };
}

export async function requirePermission(permission: PermissionKey) {
  const ctx = await getAuthContext();
  if (!ctx.configured) {
    return { ok: false as const, reason: "unconfigured" as const, ctx };
  }
  if (!ctx.userId) {
    return { ok: false as const, reason: "unauthenticated" as const, ctx };
  }
  if (!ctx.permissions.includes(permission)) {
    return { ok: false as const, reason: "forbidden" as const, ctx };
  }
  return { ok: true as const, ctx };
}
