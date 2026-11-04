import Link from "next/link";
import { MachineForm } from "@/components/machines/machine-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import {
  listMachineReferenceData,
  listMachines,
} from "@/features/machines/queries";

export const metadata = {
  title: "Machines",
};

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const auth = await getAuthContext();
  const { source, machines, message } = await listMachines();
  const refs = await listMachineReferenceData();
  const canWrite = auth.permissions.includes("machines:write");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Machines</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Create, list, view, and edit fleet assets in Supabase.
          </p>
        </div>
        <Badge tone={source === "supabase" ? "green" : "yellow"}>
          {source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      {message ? (
        <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Add machine</CardTitle>
          </CardHeader>
          <CardContent>
            <MachineForm
              mode="create"
              types={refs.types}
              brands={refs.brands}
              branches={refs.branches}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-[var(--ew-muted)]">
          Sign in with <code>machines:write</code> to create machines. Auth is
          implemented, unverified until migration + live checks.
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fleet register</CardTitle>
            <Badge tone={source === "supabase" ? "green" : "neutral"}>
              {machines.length} saved
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {machines.length === 0 ? (
            <p className="text-sm text-[var(--ew-muted)]">
              No machines saved yet.
            </p>
          ) : (
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-[var(--ew-border)] text-[var(--ew-muted)]">
                <tr>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Brand</th>
                  <th className="py-2 font-medium">Branch</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr
                    key={machine.id}
                    className="border-b border-[var(--ew-border)] last:border-0"
                  >
                    <td className="py-3 pr-4 font-mono text-xs">
                      {machine.code}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/machines/${machine.id}`}
                        className="font-semibold text-[var(--ew-blue)] hover:underline"
                      >
                        {machine.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      {machine.machine_types?.label ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {machine.machine_brands?.label ?? "—"}
                    </td>
                    <td className="py-3">
                      {machine.branches?.name ?? "—"}
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
