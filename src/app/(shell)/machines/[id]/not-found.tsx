import Link from "next/link";
import { ErrorState } from "@/components/shared/state-panels";

export default function MachineNotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ErrorState
        title="DEMO machine not found"
        description="Only DEMO machine ids from the Phase 1 sample list are routed. Real machines arrive in Phase 3."
      />
      <p className="text-center text-sm">
        <Link href="/machines" className="font-medium text-[var(--ew-blue)] hover:underline">
          Return to machines
        </Link>
      </p>
    </div>
  );
}
