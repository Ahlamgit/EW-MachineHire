import Link from "next/link";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_MACHINES } from "@/lib/constants/demo-data";

export const metadata = {
  title: "Machines",
};

export default function MachinesPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Machines</h1>
        <p className="text-sm text-[var(--ew-muted)]">
          Machinery list shell — DEMO rows only until Phase 3.
        </p>
      </div>
      <DemoBanner />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fleet register</CardTitle>
            <Badge tone="yellow">DEMO</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-[var(--ew-border)] text-[var(--ew-muted)]">
              <tr>
                <th className="py-2 pr-4 font-medium">Code</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Branch</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_MACHINES.map((machine) => (
                <tr
                  key={machine.id}
                  className="border-b border-[var(--ew-border)] last:border-0"
                >
                  <td className="py-3 pr-4 font-mono text-xs">{machine.code}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/machines/${machine.id}`}
                      className="font-semibold text-[var(--ew-blue)] hover:underline"
                    >
                      {machine.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{machine.type}</td>
                  <td className="py-3 pr-4">{machine.status}</td>
                  <td className="py-3">{machine.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
