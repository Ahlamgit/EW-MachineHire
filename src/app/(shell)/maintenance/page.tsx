import {
  CompleteFixingForm,
  OpenFixingForm,
} from "@/components/maintenance/fixing-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { listFixingJobs } from "@/features/maintenance/queries";
import { listMachines } from "@/features/machines/queries";

export const metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const auth = await getAuthContext();
  const jobs = await listFixingJobs();
  const machines = await listMachines();
  const canWrite = auth.permissions.includes("maintenance:write");
  const openJobs = jobs.jobs.filter((j) => j.status === "open");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Maintenance (minimal fixing)
          </h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Record + complete fixing/service/breakdown to exercise hire
            blocking. Full workshop schedules remain DEMO / not ready.
          </p>
        </div>
        <Badge tone={jobs.source === "supabase" ? "green" : "yellow"}>
          {jobs.source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
        DEMO / not ready: maintenance schedules, spare-parts-on-job, and full
        workshop UI. Only open/complete fixing jobs for hire restriction are
        implemented.
      </p>

      {canWrite ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Open fixing job</CardTitle>
            </CardHeader>
            <CardContent>
              <OpenFixingForm
                machines={machines.machines.map((m) => ({
                  id: m.id,
                  code: m.code,
                  name: m.name,
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Complete open job</CardTitle>
            </CardHeader>
            <CardContent>
              <CompleteFixingForm jobs={openJobs} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.jobs.length === 0 ? (
            <p className="text-sm text-[var(--ew-muted)]">
              {jobs.message ?? "No jobs yet."}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ew-border)] text-sm">
              {jobs.jobs.map((j) => (
                <li key={j.id} className="flex justify-between gap-2 py-2">
                  <span>
                    {j.job_kind} · {j.status} · machine {j.machine_id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-[var(--ew-muted)]">
                    {new Date(j.opened_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
