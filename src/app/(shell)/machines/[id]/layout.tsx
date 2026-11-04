import Link from "next/link";
import { notFound } from "next/navigation";
import { MachineSectionNav } from "@/components/machines/machine-section-nav";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Badge } from "@/components/ui/badge";
import { DEMO_MACHINES } from "@/lib/constants/demo-data";

export default async function MachineDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const machine = DEMO_MACHINES.find((item) => item.id === id);

  if (!machine) {
    notFound();
  }

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
              <Badge tone="yellow">DEMO</Badge>
            </div>
            <p className="text-sm text-[var(--ew-muted)]">
              {machine.code} · {machine.type} · {machine.status} ·{" "}
              {machine.branch}
            </p>
          </div>
        </div>
        <DemoBanner />
        <MachineSectionNav machineId={machine.id} />
      </div>
      {children}
    </div>
  );
}
