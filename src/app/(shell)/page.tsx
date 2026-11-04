import Link from "next/link";
import { DemoStatCards } from "@/components/dashboard/demo-stat-cards";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_MACHINES } from "@/lib/constants/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function DashboardPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ew-black)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Phase 1 foundation shell with DEMO sample cards only.
          </p>
        </div>
        <Badge tone={supabaseReady ? "green" : "neutral"}>
          {supabaseReady ? "Supabase env detected" : "Supabase stubs (not connected)"}
        </Badge>
      </div>

      <DemoBanner />
      <DemoStatCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DEMO machine snapshot</CardTitle>
              <Badge tone="yellow">DEMO</Badge>
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
