import { AppShell } from "@/components/layout/app-shell";
import { isOfficialLogoPresent } from "@/lib/brand/logo";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasLogo = isOfficialLogoPresent();
  return <AppShell hasLogo={hasLogo}>{children}</AppShell>;
}
