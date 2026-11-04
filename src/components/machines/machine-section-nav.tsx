"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MACHINE_DETAIL_SECTIONS } from "@/lib/constants/modules";
import { cn } from "@/lib/utils/cn";

type MachineSectionNavProps = {
  machineId: string;
};

export function MachineSectionNav({ machineId }: MachineSectionNavProps) {
  const pathname = usePathname();
  const base = `/machines/${machineId}`;

  return (
    <nav
      aria-label="Machine sections"
      className="-mx-1 flex gap-1 overflow-x-auto pb-1"
    >
      {MACHINE_DETAIL_SECTIONS.map((section) => {
        const href =
          section.id === "overview" ? base : `${base}/${section.id}`;
        const active =
          section.id === "overview"
            ? pathname === base
            : pathname.startsWith(href);

        return (
          <Link
            key={section.id}
            href={href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--ew-blue)] text-[var(--ew-white)]"
                : "bg-[var(--ew-white)] text-[var(--ew-black)] hover:bg-[var(--ew-blue-soft)]",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
