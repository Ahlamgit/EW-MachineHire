import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { oneRelation } from "@/lib/supabase/normalize";
import type { HireAgreementRow } from "@/types";

function mapHire(row: Record<string, unknown>): HireAgreementRow {
  return {
    ...(row as unknown as HireAgreementRow),
    machines: oneRelation(
      row.machines as HireAgreementRow["machines"] | HireAgreementRow["machines"][],
    ),
    customers: oneRelation(
      row.customers as HireAgreementRow["customers"] | HireAgreementRow["customers"][],
    ),
    sites: oneRelation(
      row.sites as HireAgreementRow["sites"] | HireAgreementRow["sites"][],
    ),
  };
}

export async function listHires(options?: {
  machineId?: string;
  status?: string;
}): Promise<{
  source: "supabase" | "unavailable";
  hires: HireAgreementRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      hires: [],
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", hires: [], message: "No client." };
  }

  let query = supabase
    .from("hire_agreements")
    .select(
      "id, machine_id, customer_id, site_id, duration_type, planned_duration_value, status, activated_at, closed_at, notes, created_at, machines(code, name), customers(code, name), sites(name)",
    )
    .order("created_at", { ascending: false });

  if (options?.machineId) query = query.eq("machine_id", options.machineId);
  if (options?.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) {
    return { source: "unavailable", hires: [], message: error.message };
  }
  return {
    source: "supabase",
    hires: (data ?? []).map((row) => mapHire(row as Record<string, unknown>)),
  };
}

export async function getHireBlockers(machineId: string): Promise<{
  source: "supabase" | "unavailable";
  blockers: string[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { source: "unavailable", blockers: [], message: "Supabase env not configured." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", blockers: [], message: "No client." };
  }

  const { data, error } = await supabase.rpc("machine_hire_blockers", {
    p_machine_id: machineId,
  });

  if (error) {
    return { source: "unavailable", blockers: [], message: error.message };
  }
  return {
    source: "supabase",
    blockers: Array.isArray(data) ? (data as string[]) : [],
  };
}

export async function listHireEvents(machineId: string) {
  if (!isSupabaseConfigured()) {
    return { source: "unavailable" as const, events: [], message: "Supabase env not configured." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable" as const, events: [], message: "No client." };
  }

  const { data, error } = await supabase
    .from("hire_events")
    .select(
      "id, hire_agreement_id, machine_id, event_type, detail, actor_id, occurred_at",
    )
    .eq("machine_id", machineId)
    .order("occurred_at", { ascending: false });

  if (error) {
    return { source: "unavailable" as const, events: [], message: error.message };
  }
  return { source: "supabase" as const, events: data ?? [] };
}
