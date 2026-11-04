import Link from "next/link";
import { FleetStatCards } from "@/components/dashboard/fleet-stat-cards";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { getRbacCatalogue } from "@/lib/auth/rbac-catalogue";
import { getDashboardFleetStats } from "@/features/dashboard/queries";
import { listMachines } from "@/features/machines/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabaseReady = isSupabaseConfigured();
  const auth = await getAuthContext();
  const catalogue = await getRbacCatalogue();
  const stats = await getDashboardFleetStats();
  const machines = await listMachines();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ew-black)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Fleet counts and compliance alerts from saved Supabase data when
            migrations are applied. Auth remains implemented, unverified.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={supabaseReady ? "green" : "neutral"}>
            {supabaseReady
              ? "Auth env configured"
              : "Auth env not connected"}
          </Badge>
          <Badge tone={stats.source === "supabase" ? "green" : "yellow"}>
            {stats.source === "supabase" ? "Fleet live" : "Fleet unavailable"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Session &amp; RBAC status</CardTitle>
            <Badge
              tone={catalogue.source === "supabase" ? "green" : "neutral"}
            >
              {catalogue.source === "supabase"
                ? "RBAC readable"
                : "RBAC not live"}
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
          <p className="text-xs">
            Auth: implemented, unverified until Phase 2 migration + live
            sign-in checks. Do not treat session UI as verified production
            auth.
          </p>
        </CardContent>
      </Card>

      <FleetStatCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved machines</CardTitle>
              <Badge
                tone={machines.source === "supabase" ? "green" : "yellow"}
              >
                {machines.source === "supabase" ? "Live" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {machines.machines.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">
                {machines.message ?? "No machines saved yet."}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ew-border)]">
                {machines.machines.slice(0, 8).map((machine) => (
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
                        {machine.code}
                        {machine.machine_types?.label
                          ? ` · ${machine.machine_types.label}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compliance &amp; fixing alerts</CardTitle>
              <Badge tone={stats.source === "supabase" ? "green" : "yellow"}>
                From saved data
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {stats.alerts.length === 0 ? (
              <EmptyState
                title={
                  stats.source === "supabase"
                    ? "No compliance/fixing alerts"
                    : "Alerts unavailable"
                }
                description={
                  stats.message ??
                  "Alerts appear when saved compliance is missing/yellow/red or fixing jobs are open."
                }
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.alerts.map((alert, index) => (
                  <li
                    key={`${alert.machineId}-${index}`}
                    className="border-b border-[var(--ew-border)] py-2 last:border-0"
                  >
                    <Link
                      href={`/machines/${alert.machineId}`}
                      className="font-semibold text-[var(--ew-blue)] hover:underline"
                    >
                      {alert.machineCode}
                    </Link>
                    <p className="text-xs text-[var(--ew-muted)]">
                      {alert.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
