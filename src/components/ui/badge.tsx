import { cn } from "@/lib/utils/cn";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "blue" | "green" | "yellow" | "black" | "neutral";
};

const toneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  blue: "bg-[var(--ew-blue-soft)] text-[var(--ew-blue)]",
  green: "bg-[var(--ew-green-soft)] text-[var(--ew-green)]",
  yellow: "bg-[var(--ew-yellow-soft)] text-[var(--ew-black)]",
  black: "bg-[var(--ew-black)] text-[var(--ew-white)]",
  neutral: "bg-[var(--ew-background)] text-[var(--ew-muted)]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
