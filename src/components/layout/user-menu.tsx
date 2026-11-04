"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/users/actions/sign-out";

type UserMenuProps = {
  email?: string | null;
  roles?: string[];
  configured?: boolean;
};

export function UserMenuPlaceholder({
  email,
  roles = [],
  configured = false,
}: UserMenuProps) {
  const label = email ?? (configured ? "Signed out" : "Demo User");
  const subtitle = email
    ? roles.length
      ? roles.join(", ")
      : "No roles assigned"
    : configured
      ? "Sign in required"
      : "Placeholder";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-[var(--ew-border)] bg-[var(--ew-white)] px-2 py-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ew-background)]">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-xs font-semibold leading-tight">
            {label}
          </span>
          <span className="block max-w-[10rem] truncate text-[10px] text-[var(--ew-muted)]">
            {subtitle}
          </span>
        </span>
      </div>
      {email ? (
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      ) : null}
    </div>
  );
}
