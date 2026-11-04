import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listHires } from "@/features/hires/queries";

export const metadata = { title: "Hiring history" };
export const dynamic = "force-dynamic";

export default async function HiringHistoryPage() {
  const hires = await listHires();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hiring history</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Preserved hire agreements including closed ones. Per-machine event
            timelines live on each machine&apos;s Hiring History section.
          </p>
        </div>
        <Badge tone={hires.source === "supabase" ? "green" : "yellow"}>
          {hires.source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All agreements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {hires.hires.length === 0 ? (
            <p className="text-sm text-[var(--ew-muted)]">
              {hires.message ?? "No history yet."}
            </p>
          ) : (
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-[var(--ew-muted)]">
                <tr>
                  <th className="py-2 pr-3">Machine</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Activated</th>
                  <th className="py-2">Closed</th>
                </tr>
              </thead>
              <tbody>
                {hires.hires.map((h) => (
                  <tr key={h.id} className="border-t border-[var(--ew-border)]">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/machines/${h.machine_id}/hiring-history`}
                        className="font-semibold text-[var(--ew-blue)] hover:underline"
                      >
                        {h.machines?.code ?? h.machine_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      {h.customers?.name ?? h.customer_id.slice(0, 8)}
                    </td>
                    <td className="py-2 pr-3">{h.status}</td>
                    <td className="py-2 pr-3 text-xs">
                      {h.activated_at
                        ? new Date(h.activated_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2 text-xs">
                      {h.closed_at
                        ? new Date(h.closed_at).toLocaleString()
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
