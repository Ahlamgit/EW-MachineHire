import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Admin-only usage snapshot.
 * Uses service-role only on the server when present.
 * Never returns secrets. Does not enable paid overages.
 */
export async function GET() {
  const ctx = await getAuthContext();

  if (!ctx.configured || !ctx.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canManage =
    ctx.roles.includes("admin") || ctx.permissions.includes("settings:manage");
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({
      source: "unavailable",
      message:
        "SUPABASE_SERVICE_ROLE_KEY not configured on server. Use scripts/measure-usage.mjs with DATABASE_URL, or Supabase Dashboard → Usage.",
      assessedUsers: 4,
      assessedMachines: "160–200",
      attachments: "none initially",
      freeCeilings: {
        dbMb: 500,
        storageGb: 1,
        egressGb: 5,
        netlifyCredits: 300,
      },
      secretsIncluded: false,
    });
  }

  // Best-effort: count profiles if the production profiles table exists.
  // Capacity DEMO schema is not part of Phase migrations — live DB byte size needs Dashboard or psql.
  let profileCount: number | null = null;
  try {
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (!error) profileCount = count;
  } catch {
    profileCount = null;
  }

  return NextResponse.json({
    source: "server",
    message:
      "Service role present. Row counts are admin reads where tables exist. Database byte size is not exposed via PostgREST — run scripts/measure-usage.mjs or Dashboard Usage for MB figures.",
    profileCount,
    assessedUsers: 4,
    assessedMachines: "160–200",
    attachments: "none initially",
    dbUsedPct: null,
    storageUsedPct: null,
    freeCeilings: {
      dbMb: 500,
      storageGb: 1,
      egressGb: 5,
      netlifyCredits: 300,
    },
    docs: ["docs/FREE_TIER_CONSTRAINTS.md", "docs/BACKUP_RECOVERY.md"],
    secretsIncluded: false,
  });
}
