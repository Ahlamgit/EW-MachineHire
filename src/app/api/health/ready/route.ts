import { NextResponse } from "next/server";
import { getSupabaseConfigPresence } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Presence-only readiness probe for post-deploy smoke checks.
 * Never returns secret values. Safe to hit from a checklist curl.
 */
export async function GET() {
  const presence = getSupabaseConfigPresence();

  return NextResponse.json({
    ok: true,
    app: "ew-machine-hire",
    supabase: {
      configured: presence.configured,
      urlSet: presence.urlSet,
      clientKeySet: presence.clientKeySet,
      clientKeySource: presence.clientKeySource,
      serviceRoleSet: presence.serviceRoleSet,
      allowUnconfiguredShell: presence.allowUnconfiguredShell,
    },
    warnings: [
      ...(presence.allowUnconfiguredShell
        ? [
            "DEV_ALLOW_UNCONFIGURED_SHELL is true — must be false/unset on staging.",
          ]
        : []),
      ...(!presence.configured
        ? ["Supabase public env incomplete — /login will not accept passwords."]
        : []),
    ],
    notes: [
      "Does not verify DB migrations, Auth Site URL, or email delivery.",
      "Fleet/compliance/hire modules remain DEMO stubs until later phases.",
      "Titan SMTP + backup restore remain explicitly UNTESTED until human checks.",
    ],
  });
}
