import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  COMPLIANCE_DOCUMENT_TYPES,
  complianceBandFromDocumentDate,
} from "@/lib/compliance/bands";
import type { ComplianceBand, DashboardFleetStats } from "@/types";

export async function getDashboardFleetStats(): Promise<DashboardFleetStats> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      fleetSize: 0,
      onHire: 0,
      available: 0,
      complianceAttention: 0,
      alerts: [],
      message: "Supabase env not configured — fleet stats unavailable.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      source: "unavailable",
      fleetSize: 0,
      onHire: 0,
      available: 0,
      complianceAttention: 0,
      alerts: [],
      message: "Could not create Supabase client.",
    };
  }

  const { data: machines, error: machinesError } = await supabase
    .from("machines")
    .select("id, code, name")
    .is("deleted_at", null);

  if (machinesError) {
    return {
      source: "unavailable",
      fleetSize: 0,
      onHire: 0,
      available: 0,
      complianceAttention: 0,
      alerts: [],
      message: `Fleet read failed: ${machinesError.message}. Apply core_workflow migration.`,
    };
  }

  const machineList = machines ?? [];
  const fleetSize = machineList.length;

  const { data: activeHires } = await supabase
    .from("hire_agreements")
    .select("machine_id")
    .eq("status", "active");

  const onHireIds = new Set((activeHires ?? []).map((h) => h.machine_id));

  const { data: openJobs } = await supabase
    .from("machine_fixing_jobs")
    .select("machine_id")
    .eq("status", "open");

  const fixingIds = new Set((openJobs ?? []).map((j) => j.machine_id));

  const { data: complianceRows } = await supabase
    .from("compliance_records")
    .select("machine_id, document_type, document_date, created_at")
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false });

  const latestBand = new Map<string, ComplianceBand>();
  for (const row of complianceRows ?? []) {
    const key = `${row.machine_id}:${row.document_type}`;
    if (latestBand.has(key)) continue;
    latestBand.set(
      key,
      complianceBandFromDocumentDate(row.document_date as string),
    );
  }

  let complianceAttention = 0;
  let available = 0;
  const alerts: DashboardFleetStats["alerts"] = [];

  for (const m of machineList) {
    const bands = COMPLIANCE_DOCUMENT_TYPES.map(
      (t) => latestBand.get(`${m.id}:${t}`) ?? "missing",
    );
    const needsAttention = bands.some((b) => b !== "green");
    if (needsAttention) {
      complianceAttention += 1;
      const bad = COMPLIANCE_DOCUMENT_TYPES.filter(
        (t) => (latestBand.get(`${m.id}:${t}`) ?? "missing") !== "green",
      )
        .map((t) => `${t}=${latestBand.get(`${m.id}:${t}`) ?? "missing"}`)
        .join(", ");
      alerts.push({
        machineId: m.id,
        machineCode: m.code,
        machineName: m.name,
        message: `Compliance attention: ${bad}`,
      });
    }

    if (fixingIds.has(m.id)) {
      alerts.push({
        machineId: m.id,
        machineCode: m.code,
        machineName: m.name,
        message: "Open fixing/service/breakdown job",
      });
    }

    if (!onHireIds.has(m.id) && !fixingIds.has(m.id) && !needsAttention) {
      available += 1;
    }
  }

  return {
    source: "supabase",
    fleetSize,
    onHire: onHireIds.size,
    available,
    complianceAttention,
    alerts: alerts.slice(0, 20),
  };
}
