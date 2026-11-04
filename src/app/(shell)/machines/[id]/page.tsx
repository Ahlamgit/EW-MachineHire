import { MachineForm } from "@/components/machines/machine-form";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import {
  getMachine,
  listMachineReferenceData,
} from "@/features/machines/queries";
import { getMachineCompliance } from "@/features/compliance/queries";
import { listFixingJobs } from "@/features/maintenance/queries";
import { listHires } from "@/features/hires/queries";
import {
  COMPLIANCE_DOCUMENT_LABELS,
  bandTone,
} from "@/lib/compliance/bands";

export const dynamic = "force-dynamic";

export default async function MachineOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await getAuthContext();
  const result = await getMachine(id);
  if (!result.machine) {
    return (
      <EmptyState
        title="Machine unavailable"
        description={result.message ?? "Could not load machine."}
      />
    );
  }

  const machine = result.machine;
  const refs = await listMachineReferenceData();
  const compliance = await getMachineCompliance(id);
  const fixing = await listFixingJobs({ machineId: id, openOnly: true });
  const hires = await listHires({ machineId: id, status: "active" });
  const canWrite = auth.permissions.includes("machines:write");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overview</CardTitle>
            <Badge tone="green">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--ew-muted)]">
          <p>
            Active hire:{" "}
            <strong className="text-[var(--ew-black)]">
              {hires.hires.length ? "Yes" : "No"}
            </strong>
          </p>
          <p>
            Open fixing jobs:{" "}
            <strong className="text-[var(--ew-black)]">
              {fixing.jobs.length}
            </strong>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              Object.keys(COMPLIANCE_DOCUMENT_LABELS) as Array<
                keyof typeof COMPLIANCE_DOCUMENT_LABELS
              >
            ).map((type) => {
              const band = compliance.summary.bands[type];
              return (
                <Badge key={type} tone={bandTone(band)}>
                  {COMPLIANCE_DOCUMENT_LABELS[type]}: {band}
                </Badge>
              );
            })}
          </div>
          {machine.notes ? (
            <p className="pt-2">Notes: {machine.notes}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit machine</CardTitle>
        </CardHeader>
        <CardContent>
          {canWrite ? (
            <MachineForm
              mode="edit"
              machine={machine}
              types={refs.types}
              brands={refs.brands}
              branches={refs.branches}
            />
          ) : (
            <p className="text-sm text-[var(--ew-muted)]">
              Requires <code>machines:write</code>. Auth implemented,
              unverified.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
