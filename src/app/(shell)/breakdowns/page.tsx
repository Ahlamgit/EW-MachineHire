import { ModuleStub } from "@/components/shared/module-stub";

export const metadata = { title: "Breakdowns & repairs" };

export default function Page() {
  return (
    <ModuleStub
      title="Breakdowns & repairs"
      phase={7}
      description="DEMO / not ready as a full module. Use Maintenance → open/complete fixing jobs (job_kind breakdown/repair/service) to exercise hire blocking."
    />
  );
}
