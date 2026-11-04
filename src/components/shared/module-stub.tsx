import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";

export function ModuleStub({
  title,
  phase,
  description,
}: {
  title: string;
  phase: number;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge tone="neutral">Phase {phase}+</Badge>
        <Badge tone="yellow">DEMO / not ready</Badge>
      </div>
      <EmptyState
        title="Module scaffold only — not live"
        description={
          description ??
          "This route reserves navigation for a Confirmed product module. It does not read or write Supabase. Business logic arrives in the phase shown on the badge."
        }
      />
    </div>
  );
}
