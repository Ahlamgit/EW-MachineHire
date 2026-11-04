import { AppShell } from "@/components/layout/app-shell";
import { getAuthContext } from "@/lib/auth/session";
import { isOfficialLogoPresent } from "@/lib/brand/logo";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasLogo = isOfficialLogoPresent();
  const auth = await getAuthContext();

  return (
    <AppShell
      hasLogo={hasLogo}
      email={auth.email}
      roles={auth.roles}
      configured={auth.configured}
    >
      {children}
    </AppShell>
  );
}
