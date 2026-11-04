import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardFleetStats } from "@/types";
import { cn } from "@/lib/utils/cn";

const cards = [
  { id: "fleet", title: "Fleet size", key: "fleetSize" as const, tone: "blue" as const },
  { id: "on-hire", title: "On hire", key: "onHire" as const, tone: "green" as const },
  {
    id: "available",
    title: "Available",
    key: "available" as const,
    tone: "yellow" as const,
  },
  {
    id: "compliance",
    title: "Compliance attention",
    key: "complianceAttention" as const,
    tone: "black" as const,
  },
];

const accent = {
  blue: "border-l-[var(--ew-blue)]",
  green: "border-l-[var(--ew-green)]",
  yellow: "border-l-[var(--ew-yellow)]",
  black: "border-l-[var(--ew-black)]",
};

export function FleetStatCards({ stats }: { stats: DashboardFleetStats }) {
  const live = stats.source === "supabase";
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.id} className={cn("border-l-4", accent[card.tone])}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{card.title}</CardTitle>
              <Badge tone={live ? "green" : "yellow"}>
                {live ? "Live data" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-[var(--ew-black)]">
              {live ? stats[card.key] : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--ew-muted)]">
              {live
                ? "From saved Supabase records"
                : (stats.message ?? "No live fleet data")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
