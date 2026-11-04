import { ModuleStub } from "@/components/shared/module-stub";

export const metadata = { title: "Branches, sites & locations" };

export default function Page() {
  return (
    <ModuleStub
      title="Branches admin"
      phase={5}
      description="DEMO / not ready: branch administration UI. Seeded branch reference rows exist in the core_workflow migration; customer sites are managed under Customers. Branch-scoped access remains Open (Q10)."
    />
  );
}
