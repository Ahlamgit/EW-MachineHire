import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { oneRelation } from "@/lib/supabase/normalize";
import type { MachineRow } from "@/types";

function mapMachine(row: Record<string, unknown>): MachineRow {
  return {
    ...(row as unknown as MachineRow),
    machine_types: oneRelation(
      row.machine_types as MachineRow["machine_types"] | MachineRow["machine_types"][],
    ),
    machine_brands: oneRelation(
      row.machine_brands as MachineRow["machine_brands"] | MachineRow["machine_brands"][],
    ),
    branches: oneRelation(
      row.branches as MachineRow["branches"] | MachineRow["branches"][],
    ),
  };
}

export async function listMachines(): Promise<{
  source: "supabase" | "unavailable";
  machines: MachineRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      machines: [],
      message: "Supabase env not configured — machines table not reachable.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      source: "unavailable",
      machines: [],
      message: "Could not create Supabase client.",
    };
  }

  const { data, error } = await supabase
    .from("machines")
    .select(
      "id, code, name, notes, machine_type_id, machine_brand_id, branch_id, deleted_at, created_at, updated_at, machine_types(key, label), machine_brands(key, label), branches(code, name)",
    )
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) {
    return {
      source: "unavailable",
      machines: [],
      message: `Machines read failed (${error.message}). Apply core_workflow migration and sign in with machines:read.`,
    };
  }

  return {
    source: "supabase",
    machines: (data ?? []).map((row) => mapMachine(row as Record<string, unknown>)),
  };
}

export async function getMachine(id: string): Promise<{
  source: "supabase" | "unavailable" | "missing";
  machine: MachineRow | null;
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      machine: null,
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", machine: null, message: "No client." };
  }

  const { data, error } = await supabase
    .from("machines")
    .select(
      "id, code, name, notes, machine_type_id, machine_brand_id, branch_id, deleted_at, created_at, updated_at, machine_types(key, label), machine_brands(key, label), branches(code, name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return {
      source: "unavailable",
      machine: null,
      message: error.message,
    };
  }
  if (!data) return { source: "missing", machine: null };
  return {
    source: "supabase",
    machine: mapMachine(data as Record<string, unknown>),
  };
}

export async function listMachineReferenceData() {
  const empty = {
    types: [] as Array<{ id: string; key: string; label: string }>,
    brands: [] as Array<{ id: string; key: string; label: string }>,
    branches: [] as Array<{ id: string; code: string; name: string }>,
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const [types, brands, branches] = await Promise.all([
    supabase.from("machine_types").select("id, key, label").order("label"),
    supabase.from("machine_brands").select("id, key, label").order("label"),
    supabase
      .from("branches")
      .select("id, code, name")
      .is("deleted_at", null)
      .order("name"),
  ]);

  return {
    types: types.data ?? [],
    brands: brands.data ?? [],
    branches: branches.data ?? [],
  };
}
