import { Badge } from "@/components/ui/badge";

/**
 * Lightweight free-tier usage reminder for System settings.
 * Live numbers come from /api/admin/usage or scripts/measure-usage.mjs —
 * never from a browser service-role client.
 */
export function FreeTierUsagePanel({
  snapshot,
}: {
  snapshot?: {
    source: "unavailable" | "server";
    message: string;
    dbUsedPct?: number | null;
    storageUsedPct?: number | null;
    assessedUsers?: number;
    assessedMachines?: string;
  };
}) {
  const data = snapshot ?? {
    source: "unavailable" as const,
    message:
      "Live Supabase stats unavailable in this environment. Run scripts/measure-usage.mjs on a host with DATABASE_URL or open Supabase Dashboard → Usage.",
    assessedUsers: 4,
    assessedMachines: "160–200",
  };

  return (
    <section
      aria-labelledby="free-tier-usage-heading"
      className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="free-tier-usage-heading" className="text-lg font-semibold">
          Free-tier usage
        </h2>
        <Badge tone="neutral">Monitoring</Badge>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        Working assessment: {data.assessedUsers ?? 4} users,{" "}
        {data.assessedMachines ?? "160–200"} machines, no attachments initially.
        Details in <code className="text-xs">docs/FREE_TIER_CONSTRAINTS.md</code>{" "}
        and <code className="text-xs">docs/BACKUP_RECOVERY.md</code>.
      </p>
      <ul className="list-inside list-disc text-sm text-[var(--color-muted)]">
        <li>Supabase Free DB: 500 MB · Storage: 1 GB · Egress: 5 GB</li>
        <li>Netlify Free: 300 credits / month (hard pause, no auto-recharge)</li>
        <li>Do not enable paid overages. Prefer stop/restrict on limit.</li>
      </ul>
      <p className="rounded-md bg-black/[0.04] p-3 text-sm dark:bg-white/[0.06]">
        <span className="font-medium">Status: </span>
        {data.message}
        {data.dbUsedPct != null && (
          <> Demo/measured DB use ≈ {data.dbUsedPct}% of 500 MB.</>
        )}
        {data.storageUsedPct != null && (
          <> Storage use ≈ {data.storageUsedPct}% of 1 GB.</>
        )}
      </p>
      <p className="text-xs text-[var(--color-muted)]">
        Admins: <code className="text-xs">node scripts/measure-usage.mjs</code> ·{" "}
        <code className="text-xs">node scripts/seed-capacity-demo.mjs</code>.
        Service-role keys stay server-side only. Endpoint:{" "}
        <code className="text-xs">GET /api/admin/usage</code> (admin /
        settings:manage).
      </p>
    </section>
  );
}
