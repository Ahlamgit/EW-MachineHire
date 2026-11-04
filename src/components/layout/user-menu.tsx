"use client";

import { ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Phase 1 placeholder — auth arrives in Phase 2. */
export function UserMenuPlaceholder() {
  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        aria-haspopup="menu"
        aria-expanded={false}
        title="User menu placeholder (Phase 2 auth)"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ew-background)]">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold leading-tight">
            Demo User
          </span>
          <span className="block text-[10px] text-[var(--ew-muted)]">
            Placeholder
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-[var(--ew-muted)]" aria-hidden />
      </Button>
      <p className="sr-only">
        Profile menu placeholder. Sign-in and account actions arrive in Phase 2.
        <LogOut className="hidden" />
      </p>
    </div>
  );
}
