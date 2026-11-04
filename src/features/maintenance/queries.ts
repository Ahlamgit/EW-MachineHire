import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FixingJobRow } from "@/types";

export async function listFixingJobs(options?: {
  machineId?: string;
  openOnly?: boolean;
}): Promise<{
  source: "supabase" | "unavailable";
  jobs: FixingJobRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      jobs: [],
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", jobs: [], message: "No client." };
  }

  let query = supabase
    .from("machine_fixing_jobs")
    .select(
      "id, machine_id, job_kind, status, opened_at, completed_at, notes",
    )
    .order("opened_at", { ascending: false });

  if (options?.machineId) query = query.eq("machine_id", options.machineId);
  if (options?.openOnly) query = query.eq("status", "open");

  const { data, error } = await query;
  if (error) {
    return { source: "unavailable", jobs: [], message: error.message };
  }
  return { source: "supabase", jobs: (data ?? []) as FixingJobRow[] };
}
