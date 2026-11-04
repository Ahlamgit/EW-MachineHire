import Link from "next/link";
import { DemoStatCards } from "@/components/dashboard/demo-stat-cards";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { getRbacCatalogue } from "@/lib/auth/rbac-catalogue";
import { DEMO_MACHINES } from "@/lib/constants/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabaseReady = isSupabaseConfigured();
  const auth = await getAuthContext();
  const catalogue = await getRbacCatalogue();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ew-black)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Auth/session can be live (Phase 2). Fleet figures below are DEMO
            placeholders until Phase 3+.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={supabaseReady ? "green" : "neutral"}>
            {supabaseReady
              ? "Auth env configured"
              : "Auth env not connected"}
          </Badge>
          <Badge tone="yellow">Fleet DEMO</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Session &amp; RBAC status</CardTitle>
            <Badge tone={catalogue.source === "supabase" ? "green" : "neutral"}>
              {catalogue.source === "supabase" ? "Live Supabase" : "Not live"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--ew-muted)]">
          <p>
            Signed in:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.email ?? "—"}
            </strong>
          </p>
          <p>
            Roles:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.roles.length ? auth.roles.join(", ") : "none"}
            </strong>
            {" · "}
            Permissions:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.permissions.length}
            </strong>
          </p>
          <p>
            DB catalogue:{" "}
            <strong className="text-[var(--ew-black)]">
              {catalogue.source === "supabase"
                ? `${catalogue.roleCount ?? 0} roles · ${catalogue.permissionCount ?? 0} permissions · ${catalogue.profileCount ?? "—"} profiles`
                : catalogue.message}
            </strong>
          </p>
          <p className="text-xs">
            Machines, compliance, and hire modules do{" "}
            <strong className="text-[var(--ew-black)]">not</strong> read
            Supabase yet — see DEMO sections below.
          </p>
        </CardContent>
      </Card>

      <DemoBanner />
      <DemoStatCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DEMO machine snapshot</CardTitle>
              <Badge tone="yellow">DEMO — not Supabase</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--ew-border)]">
              {DEMO_MACHINES.map((machine) => (
                <li
                  key={machine.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/machines/${machine.id}`}
                      className="truncate text-sm font-semibold text-[var(--ew-blue)] hover:underline"
                    >
                      {machine.name}
                    </Link>
                    <p className="truncate text-xs text-[var(--ew-muted)]">
                      {machine.code} · {machine.type} · {machine.branch}
                    </p>
                  </div>
                  <Badge
                    tone={
                      machine.status === "Available"
                        ? "green"
                        : machine.status === "On hire"
                          ? "blue"
                          : "yellow"
                    }
                  >
                    {machine.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <EmptyState
          title="Live activity feed coming later"
          description="Notifications, hire events, and compliance alerts will appear here in Phase 8. No invented live data."
        />
      </div>
    </div>
  );
}
