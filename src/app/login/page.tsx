import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { isSupabaseConfigured, allowUnconfiguredShell } from "@/lib/supabase/env";
import { LoginForm } from "@/features/users/components/login-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const bypass = allowUnconfiguredShell();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ew-background)] px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-[var(--ew-border)] bg-[var(--ew-white)] p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ew-blue)]">
            {BRAND.name}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ew-black)]">Sign in</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Phase 2 authentication. Privileged keys stay server-only.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone={configured ? "green" : "yellow"}>
            {configured ? "Supabase env detected" : "Supabase not configured"}
          </Badge>
          {!configured && bypass ? (
            <Badge tone="neutral">DEV shell bypass on</Badge>
          ) : null}
        </div>

        {params.reason === "unconfigured" ? (
          <p className="rounded-md bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm text-[var(--ew-black)]">
            Supabase credentials are not configured. Follow{" "}
            <code className="text-xs">docs/AUTH_SETUP.md</code> or set{" "}
            <code className="text-xs">DEV_ALLOW_UNCONFIGURED_SHELL=true</code>{" "}
            for local shell preview only.
          </p>
        ) : null}

        {params.error ? (
          <p className="rounded-md bg-[var(--ew-danger-soft)] px-3 py-2 text-sm text-[var(--ew-danger)]">
            {params.error}
          </p>
        ) : null}

        {configured ? (
          <LoginForm nextPath={params.next || "/"} />
        ) : (
          <div className="space-y-3 text-sm text-[var(--ew-muted)]">
            <p>
              Live sign-in is unavailable until{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and a
              client key (
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> or{" "}
              <code className="text-xs">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>
              ) are set (see <code className="text-xs">.env.example</code>).
            </p>
            {bypass ? (
              <p>
                Dev bypass is enabled — open{" "}
                <Link className="font-medium text-[var(--ew-blue)] hover:underline" href="/">
                  the shell
                </Link>{" "}
                without a session. Never use this flag in production.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
