import {
  COMPLIANCE_DOCUMENT_TYPES,
  complianceBandFromDocumentDate,
} from "@/lib/compliance/bands";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  ComplianceBand,
  ComplianceDocumentType,
  ComplianceRecordRow,
} from "@/types";

export type MachineComplianceSummary = {
  bands: Record<ComplianceDocumentType, ComplianceBand>;
  latest: Partial<Record<ComplianceDocumentType, ComplianceRecordRow>>;
  history: ComplianceRecordRow[];
};

export async function getMachineCompliance(
  machineId: string,
): Promise<{
  source: "supabase" | "unavailable";
  summary: MachineComplianceSummary;
  message?: string;
}> {
  const empty: MachineComplianceSummary = {
    bands: {
      insurance: "missing",
      fitness: "missing",
      road_tracks: "missing",
    },
    latest: {},
    history: [],
  };

  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      summary: empty,
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", summary: empty, message: "No client." };
  }

  const { data, error } = await supabase
    .from("compliance_records")
    .select(
      "id, machine_id, document_type, document_date, notes, recorded_by, created_at",
    )
    .eq("machine_id", machineId)
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return {
      source: "unavailable",
      summary: empty,
      message: error.message,
    };
  }

  const history = (data ?? []) as ComplianceRecordRow[];
  const latest: MachineComplianceSummary["latest"] = {};
  const bands: MachineComplianceSummary["bands"] = {
    insurance: "missing",
    fitness: "missing",
    road_tracks: "missing",
  };

  for (const type of COMPLIANCE_DOCUMENT_TYPES) {
    const row = history.find((r) => r.document_type === type);
    if (row) {
      latest[type] = row;
      bands[type] = complianceBandFromDocumentDate(row.document_date);
    }
  }

  return { source: "supabase", summary: { bands, latest, history } };
}

export async function listComplianceOverview(): Promise<{
  source: "supabase" | "unavailable";
  rows: Array<{
    machineId: string;
    machineCode: string;
    machineName: string;
    bands: Record<ComplianceDocumentType, ComplianceBand>;
  }>;
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      rows: [],
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", rows: [], message: "No client." };
  }

  const { data: machines, error } = await supabase
    .from("machines")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("code");

  if (error) {
    return { source: "unavailable", rows: [], message: error.message };
  }

  const rows = [];
  for (const m of machines ?? []) {
    const c = await getMachineCompliance(m.id);
    rows.push({
      machineId: m.id,
      machineCode: m.code,
      machineName: m.name,
      bands: c.summary.bands,
    });
  }
  return { source: "supabase", rows };
}
