"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { CompanyMark } from "@/components/layout/company-mark";
import { SHELL_NAV } from "@/lib/constants/modules";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  machines: Truck,
  customers: Users,
  "hire-agreements": ClipboardList,
  compliance: ShieldCheck,
  maintenance: Wrench,
  reports: FileBarChart2,
  settings: Settings,
};

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-[var(--ew-border)] bg-[var(--ew-white)]",
        className,
      )}
    >
      <div className="border-b border-[var(--ew-border)] px-4 py-4">
        <CompanyMark />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
        {SHELL_NAV.map((item) => {
          const Icon = ICONS[item.id] ?? LayoutDashboard;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--ew-blue-soft)] text-[var(--ew-blue)]"
                  : "text-[var(--ew-black)] hover:bg-[var(--ew-background)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--ew-border)] p-4 text-xs text-[var(--ew-muted)]">
        Phase 1 shell · modules stubbed
      </div>
    </aside>
  );
}
