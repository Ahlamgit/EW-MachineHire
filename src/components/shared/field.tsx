import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  name,
  children,
  className,
}: {
  label: string;
  name?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="font-medium text-[var(--ew-black)]">{label}</span>
      {children}
      {name ? <span className="sr-only">Field {name}</span> : null}
    </label>
  );
}

export const inputClassName =
  "h-10 rounded-md border border-[var(--ew-border)] bg-[var(--ew-white)] px-3 text-sm text-[var(--ew-black)] outline-none focus:ring-2 focus:ring-[var(--ew-blue)]";

export const selectClassName = inputClassName;
export const textareaClassName =
  "min-h-[4.5rem] rounded-md border border-[var(--ew-border)] bg-[var(--ew-white)] px-3 py-2 text-sm text-[var(--ew-black)] outline-none focus:ring-2 focus:ring-[var(--ew-blue)]";
