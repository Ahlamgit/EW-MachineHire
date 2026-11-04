import { EmptyState } from "@/components/shared/state-panels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MachineOverviewPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overview</CardTitle>
            <Badge tone="yellow">DEMO stub</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--ew-muted)]">
          <p>
            Overview content is intentionally empty of invented business logic.
            Phase 3+ will bind real machine fields and status derived from
            Confirmed hiring and compliance rules.
          </p>
          <p>
            Use the section navigation above to inspect stub panels for
            Specifications, Compliance, Hiring History, Readings, Fuel, Tyres,
            Spare Parts, Maintenance, Documents, and Audit History.
          </p>
        </CardContent>
      </Card>
      <EmptyState
        title="No live overview metrics"
        description="Operational KPIs for this machine will appear after data modules are implemented."
      />
    </div>
  );
}
