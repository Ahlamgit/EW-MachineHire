import { ModuleStub } from "@/components/shared/module-stub";
import { FreeTierUsagePanel } from "@/components/settings/free-tier-usage-panel";
import { getAuthContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "System settings" };

type UsageSnapshot = {
  source: "unavailable" | "server";
  message: string;
  dbUsedPct?: number | null;
  storageUsedPct?: number | null;
  assessedUsers?: number;
  assessedMachines?: string;
  profileCount?: number | null;
};

export default async function Page() {
  const ctx = await getAuthContext();
  const canSeeUsage =
    ctx.roles.includes("admin") || ctx.permissions.includes("settings:manage");

  let snapshot: UsageSnapshot;

  if (!canSeeUsage) {
    snapshot = {
      source: "unavailable",
      message:
        "Sign in as admin (or with settings:manage) to load live usage hints. Ceilings below still apply project-wide.",
      assessedUsers: 4,
      assessedMachines: "160–200",
    };
  } else if (!ctx.configured) {
    snapshot = {
      source: "unavailable",
      message:
        "Supabase is not configured in this environment. Use scripts/measure-usage.mjs locally or Dashboard Usage after linking a Free project.",
      assessedUsers: 4,
      assessedMachines: "160–200",
    };
  } else {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      snapshot = {
        source: "unavailable",
        message:
          "SUPABASE_SERVICE_ROLE_KEY not set on the server. Login still works without it. For profile counts via admin client, add the service-role key (server-only) or use scripts/measure-usage.mjs / Dashboard Usage.",
        assessedUsers: 4,
        assessedMachines: "160–200",
        profileCount: null,
      };
    } else {
      let profileCount: number | null = null;
      try {
        const { count, error } = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true });
        if (!error) profileCount = count;
      } catch {
        profileCount = null;
      }

      snapshot = {
        source: "server",
        message:
          profileCount != null
            ? `Live admin read: ${profileCount} profile row(s). DB megabytes still need Dashboard Usage or scripts/measure-usage.mjs.`
            : "Service role present but profiles count failed (migration missing?). DB MB still from Dashboard / measure script.",
        assessedUsers: 4,
        assessedMachines: "160–200",
        profileCount,
        dbUsedPct: null,
        storageUsedPct: null,
      };
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ModuleStub
        title="System settings"
        phase={2}
        description="Settings module scaffold. Free-tier usage monitoring is available below; other settings arrive in later phases. Not a live hire/compliance control panel."
      />
      <FreeTierUsagePanel snapshot={snapshot} />
    </div>
  );
}
