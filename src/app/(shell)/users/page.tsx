import Link from "next/link";
import { ModuleStub } from "@/components/shared/module-stub";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { getRbacCatalogue } from "@/lib/auth/rbac-catalogue";
import { PERMISSIONS, PROPOSED_ROLES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users, roles & permissions" };

export default async function UsersPage() {
  const auth = await getAuthContext();
  const catalogue = await getRbacCatalogue();
  const canManage = auth.permissions.includes("users:manage");
  const live = catalogue.source === "supabase";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Users, roles & permissions
        </h1>
        <Badge tone={live ? "green" : "yellow"}>
          {live ? "Live RBAC read" : "Proposed / offline"}
        </Badge>
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
            Profiles (RLS count):{" "}
            <strong className="text-[var(--ew-black)]">
              {catalogue.profileCount ?? "—"}
            </strong>
          </p>
          <p className="text-xs">{catalogue.message}</p>
          <p>
            Full Proposed matrix:{" "}
            <Link
              href="#"
              className="pointer-events-none text-[var(--ew-muted)]"
              aria-disabled
            >
              see docs/PERMISSIONS.md in the repo
            </Link>
            . Role-assignment UI remains a scaffold — do not invent admin
            workflows beyond Phase 2 reads.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              {live ? "Roles from Supabase" : "Proposed roles (code fallback)"}
            </CardTitle>
            <Badge tone={live ? "green" : "neutral"}>
              {live ? "supabase.roles" : "in-app list"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {(live ? catalogue.roles.map((r) => r.key) : [...PROPOSED_ROLES]).map(
              (role) => (
                <li key={role}>
                  <Badge tone="blue">{role}</Badge>
                </li>
              ),
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              {live
                ? "Permissions from Supabase"
                : "Permission catalogue (code fallback)"}
            </CardTitle>
            <Badge tone={live ? "green" : "neutral"}>
              {live ? "supabase.permissions" : "in-app list"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 sm:grid-cols-2">
            {(live
              ? catalogue.permissions.map((p) => p.key)
              : [...PERMISSIONS]
            ).map((key) => (
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
        description="Assigning roles to users still needs a dedicated UI. Live catalogue reads work after Phase 2 migration + sign-in. Branch restrictions and finance grants remain Open — see docs/OPEN_QUESTIONS.md and docs/PERMISSIONS.md."
      />
    </div>
  );
}
