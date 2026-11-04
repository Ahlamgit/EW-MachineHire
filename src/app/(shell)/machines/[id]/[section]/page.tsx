import { notFound } from "next/navigation";
import { EmptyState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_MACHINES } from "@/lib/constants/demo-data";
import { MACHINE_DETAIL_SECTIONS } from "@/lib/constants/modules";

const SECTION_IDS = MACHINE_DETAIL_SECTIONS.map((s) => s.id).filter(
  (id) => id !== "overview",
);

export function generateStaticParams() {
  return DEMO_MACHINES.flatMap((machine) =>
    SECTION_IDS.map((section) => ({ id: machine.id, section })),
  );
}

export default async function MachineSectionStubPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { section } = await params;
  const meta = MACHINE_DETAIL_SECTIONS.find((item) => item.id === section);

  if (!meta || section === "overview") {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{meta.label}</CardTitle>
          <Badge tone="yellow">Section stub</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <EmptyState
          title={`${meta.label} — not implemented yet`}
          description="Navigation stub only. No invented business rules or sample transactional data beyond the DEMO machine identity."
        />
      </CardContent>
    </Card>
  );
}
