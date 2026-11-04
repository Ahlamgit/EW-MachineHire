import { CreateCustomerForm, CreateSiteForm } from "@/components/customers/customer-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth/session";
import { listAllSites, listCustomers } from "@/features/customers/queries";

export const metadata = { title: "Customers & contacts" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const auth = await getAuthContext();
  const customers = await listCustomers();
  const sites = await listAllSites();
  const canWrite = auth.permissions.includes("customers:write");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers &amp; sites</h1>
          <p className="text-sm text-[var(--ew-muted)]">
            Minimum customer and site records required for hiring.
          </p>
        </div>
        <Badge tone={customers.source === "supabase" ? "green" : "yellow"}>
          {customers.source === "supabase" ? "Live Supabase" : "Not live"}
        </Badge>
      </div>

      {customers.message ? (
        <p className="rounded-md border border-[var(--ew-yellow)] bg-[var(--ew-yellow-soft)] px-3 py-2 text-sm">
          {customers.message}
        </p>
      ) : null}

      {canWrite ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add customer</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateCustomerForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add site</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateSiteForm customers={customers.customers} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-[var(--ew-muted)]">
          Sign in with <code>customers:write</code> to add customers/sites.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.customers.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">None yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--ew-border)] text-sm">
                {customers.customers.map((c) => (
                  <li key={c.id} className="py-2">
                    <strong>{c.name}</strong>{" "}
                    <span className="font-mono text-xs text-[var(--ew-muted)]">
                      {c.code}
                    </span>
                    {c.phone ? (
                      <p className="text-xs text-[var(--ew-muted)]">{c.phone}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sites</CardTitle>
          </CardHeader>
          <CardContent>
            {sites.sites.length === 0 ? (
              <p className="text-sm text-[var(--ew-muted)]">None yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--ew-border)] text-sm">
                {sites.sites.map((s) => (
                  <li key={s.id} className="py-2">
                    <strong>{s.name}</strong>
                    {s.address ? (
                      <p className="text-xs text-[var(--ew-muted)]">
                        {s.address}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
