import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--ew-border)] bg-[var(--ew-white)] p-8 text-[var(--ew-muted)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-[var(--ew-blue)]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Data for this view will appear in a later phase.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--ew-border)] bg-[var(--ew-white)] p-8 text-center",
        className,
      )}
    >
      <Inbox className="h-8 w-8 text-[var(--ew-blue)]" aria-hidden />
      <h3 className="text-base font-semibold text-[var(--ew-black)]">{title}</h3>
      <p className="max-w-md text-sm text-[var(--ew-muted)]">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "This is a shell error pattern. Retry is a placeholder until live data exists.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-[var(--ew-danger-border)] bg-[var(--ew-danger-soft)] p-8 text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="h-8 w-8 text-[var(--ew-danger)]" aria-hidden />
      <div>
        <h3 className="text-base font-semibold text-[var(--ew-black)]">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-[var(--ew-muted)]">{description}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
