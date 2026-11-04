"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function AppShell({
  children,
  hasLogo = false,
  email = null,
  roles = [],
  configured = false,
}: {
  children: React.ReactNode;
  hasLogo?: boolean;
  email?: string | null;
  roles?: string[];
  configured?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[var(--ew-background)] text-[var(--ew-black)]">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">
        <AppSidebar hasLogo={hasLogo} />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-[var(--ew-black)]/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(100%,18rem)] transform transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <AppSidebar
            hasLogo={hasLogo}
            className="shadow-xl"
            onNavigate={() => setMobileOpen(false)}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <AppHeader
          hasLogo={hasLogo}
          email={email}
          roles={roles}
          configured={configured}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
