import Link from "next/link";
import { notFound } from "next/navigation";
import { MachineSectionNav } from "@/components/machines/machine-section-nav";
import { Badge } from "@/components/ui/badge";
import { getMachine } from "@/features/machines/queries";
import { getHireBlockers } from "@/features/hires/queries";

export const dynamic = "force-dynamic";

export default async function MachineDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMachine(id);

  if (result.source === "missing") {
    notFound();
  }

  if (result.source === "unavailable" || !result.machine) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link
          href="/machines"
          className="text-sm font-medium text-[var(--ew-blue)] hover:underline"
        >
          ← Back to machines
        </Link>
        <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
          {result.message ??
            "Machine data unavailable. Apply core_workflow migration and sign in."}
        </p>
      </div>
    );
  }

  const machine = result.machine;
  const blockers = await getHireBlockers(machine.id);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/machines"
          className="text-sm font-medium text-[var(--ew-blue)] hover:underline"
        >
          ← Back to machines
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {machine.name}
              </h1>
              <Badge tone="green">Live Supabase</Badge>
            </div>
            <p className="text-sm text-[var(--ew-muted)]">
              {machine.code}
              {machine.machine_types?.label
                ? ` · ${machine.machine_types.label}`
                : ""}
              {machine.branches?.name ? ` · ${machine.branches.name}` : ""}
            </p>
            {blockers.source === "supabase" ? (
              <p className="mt-1 text-xs text-[var(--ew-muted)]">
                Hire blockers:{" "}
                {blockers.blockers.length
                  ? blockers.blockers.join(", ")
                  : "none (eligible if permissions allow)"}
              </p>
            ) : null}
          </div>
        </div>
        <MachineSectionNav machineId={machine.id} />
      </div>
      {children}
    </div>
  );
}
