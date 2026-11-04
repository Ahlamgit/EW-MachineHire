"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Phase 1 placeholder — notifications module in Phase 8. */
export function NotificationAreaPlaceholder() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Notifications (placeholder)"
      title="Notification area placeholder"
      className="relative"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--ew-yellow)]" />
    </Button>
  );
}
