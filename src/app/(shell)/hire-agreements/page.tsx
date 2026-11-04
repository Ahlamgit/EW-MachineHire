import {
  ActivateHireForm,
  CloseHireForm,
  CreateHireForm,
} from "@/components/hires/hire-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { listCustomers, listAllSites } from "@/features/customers/queries";
import { listHires } from "@/features/hires/queries";
import { listMachines } from "@/features/machines/queries";

export const metadata = { title: "Hire agreements" };
export const dynamic = "force-dynamic";

export default async function HireAgreementsPage() {
  const auth = await getAuthContext();
  const hires = await listHires();
  const machines = await listMachines();
  const customers = await listCustomers();
  const sites = await listAllSites();
  const canWrite = auth.permissions.includes("hires:write");
  const canClose =
    auth.permissions.includes("hires:close") ||
    auth.permissions.includes("hires:write");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hire agreements</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Explicit activate + close. Single machine per agreement (multi-machine
            still Open). No billing invention.
          </p>
        </div>
        <Badge tone={hires.source === "supabase" ? "green" : "yellow"}>
          {hires.source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      {hires.message ? (
        <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
          {hires.message}
        </p>
      ) : null}

      {canWrite ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create hire</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateHireForm
                machines={machines.machines.map((m) => ({
                  id: m.id,
                  code: m.code,
                  name: m.name,
                }))}
                customers={customers.customers}
                sites={sites.sites}
              />
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activate draft</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivateHireForm hires={hires.hires} />
              </CardContent>
            </Card>
            {canClose ? (
              <Card>
                <CardHeader>
                  <CardTitle>Close active hire</CardTitle>
                </CardHeader>
                <CardContent>
                  <CloseHireForm hires={hires.hires} />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ew-muted)]">
          Sign in with hire permissions to manage agreements.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {hires.hires.length === 0 ? (
            <p className="text-sm text-[var(--ew-muted)]">None yet.</p>
          ) : (
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-[var(--ew-muted)]">
                <tr>
                  <th className="py-2 pr-3">Machine</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Duration</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Activated</th>
                </tr>
              </thead>
              <tbody>
                {hires.hires.map((h) => (
                  <tr key={h.id} className="border-t border-[var(--ew-border)]">
                    <td className="py-2 pr-3">
                      {h.machines?.code ?? h.machine_id}
                    </td>
                    <td className="py-2 pr-3">
                      {h.customers?.name ?? h.customer_id}
                    </td>
                    <td className="py-2 pr-3">
                      {h.duration_type}
                      {h.planned_duration_value != null
                        ? ` · ${h.planned_duration_value}`
                        : ""}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge
                        tone={
                          h.status === "active"
                            ? "green"
                            : h.status === "closed"
                              ? "neutral"
                              : "yellow"
                        }
                      >
                        {h.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs">
                      {h.activated_at
                        ? new Date(h.activated_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
