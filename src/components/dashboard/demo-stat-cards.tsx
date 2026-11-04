import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_DASHBOARD_CARDS } from "@/lib/constants/demo-data";
import { cn } from "@/lib/utils/cn";

const accent: Record<(typeof DEMO_DASHBOARD_CARDS)[number]["tone"], string> = {
  blue: "border-l-[var(--ew-blue)]",
  green: "border-l-[var(--ew-green)]",
  yellow: "border-l-[var(--ew-yellow)]",
  black: "border-l-[var(--ew-black)]",
};

export function DemoStatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DEMO_DASHBOARD_CARDS.map((card) => (
        <Card
          key={card.id}
          className={cn("border-l-4", accent[card.tone])}
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{card.title}</CardTitle>
              <Badge tone="yellow">DEMO</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-[var(--ew-black)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[var(--ew-muted)]">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
