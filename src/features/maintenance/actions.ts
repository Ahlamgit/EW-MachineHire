"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, mapSupabaseError, ok, type ActionResult } from "@/lib/workflow/errors";
import { uuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const openSchema = z.object({
  machine_id: uuidSchema,
  job_kind: z.enum(["service", "breakdown", "repair"]),
  notes: z.string().max(2000).optional(),
});

export async function openFixingJob(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("maintenance:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = openSchema.safeParse({
    machine_id: formData.get("machine_id"),
    job_kind: formData.get("job_kind"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("machine_fixing_jobs")
    .insert({
      machine_id: parsed.data.machine_id,
      job_kind: parsed.data.job_kind,
      status: "open",
      notes: parsed.data.notes?.trim() || null,
      created_by: auth.ctx.userId,
    })
    .select("id, machine_id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/maintenance");
  revalidatePath("/breakdowns");
  revalidatePath(`/machines/${data.machine_id}`);
  revalidatePath(`/machines/${data.machine_id}/maintenance`);
  revalidatePath("/");
  return ok({ id: data.id }, "Fixing job opened — machine blocked from new hires.");
}

export async function completeFixingJob(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("maintenance:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const id = String(formData.get("job_id") ?? "");
  if (!uuidSchema.safeParse(id).success) return fail("Invalid job id.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("machine_fixing_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open")
    .select("id, machine_id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/maintenance");
  revalidatePath("/breakdowns");
  revalidatePath(`/machines/${data.machine_id}`);
  revalidatePath(`/machines/${data.machine_id}/maintenance`);
  revalidatePath("/");
  return ok({ id: data.id }, "Fixing job completed.");
}
