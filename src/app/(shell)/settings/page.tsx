import { ModuleStub } from "@/components/shared/module-stub";
import { FreeTierUsagePanel } from "@/components/settings/free-tier-usage-panel";
import { getAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "System settings" };

export default async function Page() {
  const ctx = await getAuthContext();
  const canSeeUsage =
    ctx.roles.includes("admin") || ctx.permissions.includes("settings:manage");

  let snapshot:
    | {
        source: "unavailable" | "server";
        message: string;
        dbUsedPct?: number | null;
        storageUsedPct?: number | null;
        assessedUsers?: number;
        assessedMachines?: string;
      }
    | undefined;

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
    snapshot = {
      source: "server",
      message:
        "Call GET /api/admin/usage for JSON counts when the service role is set. Database megabytes still come from psql measure scripts or the Supabase Usage dashboard.",
      assessedUsers: 4,
      assessedMachines: "160–200",
      dbUsedPct: null,
      storageUsedPct: null,
    };
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ModuleStub
        title="System settings"
        phase={2}
        description="Settings module scaffold. Free-tier usage monitoring is available below; other settings arrive in later phases."
      />
      <FreeTierUsagePanel snapshot={snapshot} />
    </div>
  );
}
