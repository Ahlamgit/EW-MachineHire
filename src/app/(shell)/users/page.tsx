import Link from "next/link";
import { ModuleStub } from "@/components/shared/module-stub";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { PERMISSIONS, PROPOSED_ROLES } from "@/lib/auth/permissions";

export const metadata = { title: "Users, roles & permissions" };

export default async function UsersPage() {
  const auth = await getAuthContext();
  const canManage = auth.permissions.includes("users:manage");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Users, roles & permissions
        </h1>
        <Badge tone="yellow">Proposed matrix</Badge>
        {canManage ? <Badge tone="green">users:manage</Badge> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--ew-muted)]">
          <p>
            Configured:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.configured ? "yes" : "no"}
            </strong>
          </p>
          <p>
            User:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.email ?? "—"}
            </strong>
          </p>
          <p>
            Roles:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.roles.length ? auth.roles.join(", ") : "none"}
            </strong>
          </p>
          <p>
            Permissions loaded:{" "}
            <strong className="text-[var(--ew-black)]">
              {auth.permissions.length}
            </strong>
          </p>
          <p>
            Full Proposed matrix:{" "}
            <Link
              href="#"
              className="pointer-events-none text-[var(--ew-muted)]"
              aria-disabled
            >
              see docs/PERMISSIONS.md in the repo
            </Link>
            . Admin user assignment UI arrives after live Supabase setup.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposed roles (Phase 2 seed)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {PROPOSED_ROLES.map((role) => (
              <li key={role}>
                <Badge tone="blue">{role}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 sm:grid-cols-2">
            {PERMISSIONS.map((key) => (
              <li
                key={key}
                className="rounded-md bg-[var(--ew-background)] px-2 py-1 font-mono text-xs"
              >
                {key}
                {key.startsWith("finance:") ? (
                  <span className="ml-2 text-[var(--ew-muted)]">
                    reserved / unassigned
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ModuleStub
        title="User administration UI"
        phase={2}
        description="Assigning roles to users requires a live Supabase project with the Phase 2 migration applied. Branch restrictions and finance grants remain Open — see docs/OPEN_QUESTIONS.md and docs/PERMISSIONS.md."
      />
    </div>
  );
}
