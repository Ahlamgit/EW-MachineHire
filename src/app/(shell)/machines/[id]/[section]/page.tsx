import { notFound } from "next/navigation";
import { RenewComplianceForm } from "@/components/compliance/renew-form";
import {
  CompleteFixingForm,
  OpenFixingForm,
} from "@/components/maintenance/fixing-forms";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { getMachine } from "@/features/machines/queries";
import { getMachineCompliance } from "@/features/compliance/queries";
import { listHireEvents, listHires } from "@/features/hires/queries";
import { listFixingJobs } from "@/features/maintenance/queries";
import {
  COMPLIANCE_DOCUMENT_LABELS,
  bandTone,
  complianceBandFromDocumentDate,
} from "@/lib/compliance/bands";
import { MACHINE_DETAIL_SECTIONS } from "@/lib/constants/modules";

export const dynamic = "force-dynamic";

const SECTION_IDS = MACHINE_DETAIL_SECTIONS.map((s) => s.id).filter(
  (id) => id !== "overview",
);

export default async function MachineSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  const meta = MACHINE_DETAIL_SECTIONS.find((item) => item.id === section);

  if (
    !meta ||
    section === "overview" ||
    !SECTION_IDS.includes(section as (typeof SECTION_IDS)[number])
  ) {
    notFound();
  }

  const machineResult = await getMachine(id);
  if (!machineResult.machine) {
    return (
      <EmptyState
        title="Machine unavailable"
        description={machineResult.message ?? "Could not load machine."}
      />
    );
  }

  const auth = await getAuthContext();

  if (section === "compliance") {
    const compliance = await getMachineCompliance(id);
    const canWrite = auth.permissions.includes("compliance:write");
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current bands</CardTitle>
              <Badge
                tone={compliance.source === "supabase" ? "green" : "yellow"}
              >
                {compliance.source === "supabase" ? "Live" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              Object.keys(COMPLIANCE_DOCUMENT_LABELS) as Array<
                keyof typeof COMPLIANCE_DOCUMENT_LABELS
              >
            ).map((type) => {
              const band = compliance.summary.bands[type];
              const latest = compliance.summary.latest[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between gap-2 border-b border-[var(--ew-border)] py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {COMPLIANCE_DOCUMENT_LABELS[type]}
                    </p>
                    <p className="text-xs text-[var(--ew-muted)]">
                      {latest
                        ? `Document Date ${latest.document_date}`
                        : "No record — missing"}
                    </p>
                  </div>
                  <Badge tone={bandTone(band)}>{band}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Renew / add document</CardTitle>
          </CardHeader>
          <CardContent>
            {canWrite ? (
              <RenewComplianceForm machineId={id} />
            ) : (
              <p className="text-sm text-[var(--ew-muted)]">
                Requires <code>compliance:write</code>.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Renewal history (append-only)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {compliance.summary.history.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">No records yet.</p>
            ) : (
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="text-[var(--ew-muted)]">
                  <tr>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Document Date</th>
                    <th className="py-2 pr-3">Band now</th>
                    <th className="py-2 pr-3">Entered</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.summary.history.map((row) => {
                    const band = complianceBandFromDocumentDate(
                      row.document_date,
                    );
                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[var(--ew-border)]"
                      >
                        <td className="py-2 pr-3">
                          {COMPLIANCE_DOCUMENT_LABELS[row.document_type]}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs">
                          {row.document_date}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge tone={bandTone(band)}>{band}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-xs text-[var(--ew-muted)]">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="py-2">{row.notes ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (section === "hiring-history") {
    const hires = await listHires({ machineId: id });
    const events = await listHireEvents(id);
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hire agreements</CardTitle>
              <Badge tone={hires.source === "supabase" ? "green" : "yellow"}>
                {hires.source === "supabase" ? "Live" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {hires.hires.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">No hires yet.</p>
            ) : (
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-[var(--ew-muted)]">
                  <tr>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Activated</th>
                  </tr>
                </thead>
                <tbody>
                  {hires.hires.map((h) => (
                    <tr
                      key={h.id}
                      className="border-t border-[var(--ew-border)]"
                    >
                      <td className="py-2 pr-3">
                        {h.customers?.name ?? h.customer_id}
                      </td>
                      <td className="py-2 pr-3">
                        {h.duration_type}
                        {h.planned_duration_value != null
                          ? ` · ${h.planned_duration_value}`
                          : ""}
                      </td>
                      <td className="py-2 pr-3">{h.status}</td>
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
        <Card>
          <CardHeader>
            <CardTitle>Hire events (append-only)</CardTitle>
          </CardHeader>
          <CardContent>
            {events.events.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">No events.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.events.map((e) => (
                  <li
                    key={e.id}
                    className="border-b border-[var(--ew-border)] py-2"
                  >
                    <strong>{e.event_type}</strong> — {e.detail ?? ""}{" "}
                    <span className="text-xs text-[var(--ew-muted)]">
                      {new Date(e.occurred_at).toLocaleString()}
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

  if (section === "maintenance") {
    const jobs = await listFixingJobs({ machineId: id });
    const canWrite = auth.permissions.includes("maintenance:write");
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open / complete fixing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-[var(--ew-muted)]">
              Minimal flow to exercise hire restriction. Any open
              service/breakdown/repair blocks new hire activation (DB
              enforced).
            </p>
            {canWrite ? (
              <>
                <OpenFixingForm machineId={id} />
                <CompleteFixingForm
                  jobs={jobs.jobs.filter((j) => j.status === "open")}
                />
              </>
            ) : (
              <p className="text-sm text-[var(--ew-muted)]">
                Requires <code>maintenance:write</code>.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Job history</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.jobs.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">No jobs.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {jobs.jobs.map((j) => (
                  <li
                    key={j.id}
                    className="flex justify-between gap-2 border-b border-[var(--ew-border)] py-2"
                  >
                    <span>
                      {j.job_kind} · {j.status}
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{meta.label}</CardTitle>
          <Badge tone="yellow">DEMO / not ready</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <EmptyState
          title={`${meta.label} — DEMO / not ready`}
          description="This machine section is reserved but not part of the customer-test core workflow yet. No invented transactional data."
        />
      </CardContent>
    </Card>
  );
}
