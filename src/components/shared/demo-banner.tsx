import { AlertTriangle } from "lucide-react";
import { DEMO_BANNER } from "@/lib/constants/demo-data";

export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm text-[var(--ew-black)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{DEMO_BANNER}</p>
    </div>
  );
}
