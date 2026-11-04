/** Shared domain types aligned with Confirmed rules + core_workflow migration. */

export type MachineStatus =
  | "available"
  | "on_hire"
  | "in_repair"
  | "unavailable";

export type ComplianceBand = "green" | "yellow" | "red" | "missing";

export type ComplianceDocumentType = "insurance" | "fitness" | "road_tracks";

export type HireDurationType = "hours" | "days" | "months" | "open_ended";

export type HireStatus = "draft" | "active" | "closed";

export type FixingJobKind = "service" | "breakdown" | "repair";

export type FixingJobStatus = "open" | "completed";

export type UiTone = "blue" | "green" | "yellow" | "black";

export type MachineRow = {
  id: string;
  code: string;
  name: string;
  notes: string | null;
  machine_type_id: string | null;
  machine_brand_id: string | null;
  branch_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  machine_types?: { key: string; label: string } | null;
  machine_brands?: { key: string; label: string } | null;
  branches?: { code: string; name: string } | null;
};

export type ComplianceRecordRow = {
  id: string;
  machine_id: string;
  document_type: ComplianceDocumentType;
  document_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type SiteRow = {
  id: string;
  customer_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  deleted_at: string | null;
};

export type HireAgreementRow = {
  id: string;
  machine_id: string;
  customer_id: string;
  site_id: string | null;
  duration_type: HireDurationType;
  planned_duration_value: number | null;
  status: HireStatus;
  activated_at: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  machines?: { code: string; name: string } | null;
  customers?: { code: string; name: string } | null;
  sites?: { name: string } | null;
};

export type FixingJobRow = {
  id: string;
  machine_id: string;
  job_kind: FixingJobKind;
  status: FixingJobStatus;
  opened_at: string;
  completed_at: string | null;
  notes: string | null;
};

export type DashboardFleetStats = {
  source: "supabase" | "unavailable";
  fleetSize: number;
  onHire: number;
  available: number;
  complianceAttention: number;
  alerts: Array<{
    machineId: string;
    machineCode: string;
    machineName: string;
    message: string;
  }>;
  message?: string;
};
