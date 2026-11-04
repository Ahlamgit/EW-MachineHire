"use client";

import { Menu } from "lucide-react";
import { CompanyMark } from "@/components/layout/company-mark";
import { NotificationAreaPlaceholder } from "@/components/layout/notification-area";
import { UserMenuPlaceholder } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  onOpenMobileNav: () => void;
};

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--ew-border)] bg-[var(--ew-white)]/95 px-4 backdrop-blur md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="md:hidden">
        <CompanyMark compact />
      </div>

      <div className="hidden min-w-0 flex-1 md:block">
        <p className="truncate text-sm font-semibold text-[var(--ew-black)]">
          Operations workspace
        </p>
        <p className="truncate text-xs text-[var(--ew-muted)]">
          Foundation shell — business modules arrive in later phases
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationAreaPlaceholder />
        <UserMenuPlaceholder />
      </div>
    </header>
  );
}
