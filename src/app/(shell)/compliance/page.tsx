import Link from "next/link";
import { RenewComplianceForm } from "@/components/compliance/renew-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { listComplianceOverview } from "@/features/compliance/queries";
import { listMachines } from "@/features/machines/queries";
import {
  COMPLIANCE_DOCUMENT_LABELS,
  bandTone,
} from "@/lib/compliance/bands";

export const metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const auth = await getAuthContext();
  const overview = await listComplianceOverview();
  const machines = await listMachines();
  const canWrite = auth.permissions.includes("compliance:write");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Insurance, fitness, road tracks — bands from actual Document Date.
          </p>
        </div>
        <Badge tone={overview.source === "supabase" ? "green" : "yellow"}>
          {overview.source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      {overview.message ? (
        <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
          {overview.message}
        </p>
      ) : null}

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Add / renew document</CardTitle>
          </CardHeader>
          <CardContent>
            <RenewComplianceForm
              machines={machines.machines.map((m) => ({
                id: m.id,
                code: m.code,
                name: m.name,
              }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Fleet compliance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {overview.rows.length === 0 ? (
            <p className="text-sm text-[var(--ew-muted)]">No machines yet.</p>
          ) : (
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-[var(--ew-muted)]">
                <tr>
                  <th className="py-2 pr-3">Machine</th>
                  {(
                    Object.keys(COMPLIANCE_DOCUMENT_LABELS) as Array<
                      keyof typeof COMPLIANCE_DOCUMENT_LABELS
                    >
                  ).map((t) => (
                    <th key={t} className="py-2 pr-3">
                      {COMPLIANCE_DOCUMENT_LABELS[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.rows.map((row) => (
                  <tr
                    key={row.machineId}
                    className="border-t border-[var(--ew-border)]"
                  >
                    <td className="py-3 pr-3">
                      <Link
                        href={`/machines/${row.machineId}/compliance`}
                        className="font-semibold text-[var(--ew-blue)] hover:underline"
                      >
                        {row.machineCode}
                      </Link>
                      <p className="text-xs text-[var(--ew-muted)]">
                        {row.machineName}
                      </p>
                    </td>
                    {(
                      Object.keys(COMPLIANCE_DOCUMENT_LABELS) as Array<
                        keyof typeof COMPLIANCE_DOCUMENT_LABELS
                      >
                    ).map((t) => (
                      <td key={t} className="py-3 pr-3">
                        <Badge tone={bandTone(row.bands[t])}>
                          {row.bands[t]}
                        </Badge>
                      </td>
                    ))}
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
