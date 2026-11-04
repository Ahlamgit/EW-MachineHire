"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, mapSupabaseError, ok, type ActionResult } from "@/lib/workflow/errors";
import { uuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const createHireSchema = z
  .object({
    machine_id: uuidSchema,
    customer_id: uuidSchema,
    site_id: z.union([uuidSchema, z.literal("")]).optional(),
    duration_type: z.enum(["hours", "days", "months", "open_ended"]),
    planned_duration_value: z.string().optional(),
    notes: z.string().max(2000).optional(),
    activate_now: z.enum(["true", "false"]).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.duration_type === "open_ended") return;
    const n = Number(val.planned_duration_value);
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Duration value must be a positive number for fixed durations.",
        path: ["planned_duration_value"],
      });
    }
  });

function revalidateHirePaths(machineId?: string) {
  revalidatePath("/hire-agreements");
  revalidatePath("/hiring-history");
  revalidatePath("/");
  if (machineId) {
    revalidatePath(`/machines/${machineId}`);
    revalidatePath(`/machines/${machineId}/hiring-history`);
  }
}

export async function createHireAgreement(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("hires:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = createHireSchema.safeParse({
    machine_id: formData.get("machine_id"),
    customer_id: formData.get("customer_id"),
    site_id: formData.get("site_id") ?? "",
    duration_type: formData.get("duration_type"),
    planned_duration_value: String(formData.get("planned_duration_value") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    activate_now: formData.get("activate_now") === "true" ? "true" : "false",
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid hire input");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const planned =
    parsed.data.duration_type === "open_ended"
      ? null
      : Number(parsed.data.planned_duration_value);

  const { data, error } = await supabase
    .from("hire_agreements")
    .insert({
      machine_id: parsed.data.machine_id,
      customer_id: parsed.data.customer_id,
      site_id:
        parsed.data.site_id && parsed.data.site_id !== ""
          ? parsed.data.site_id
          : null,
      duration_type: parsed.data.duration_type,
      planned_duration_value: planned,
      status: "draft",
      notes: parsed.data.notes?.trim() || null,
      created_by: auth.ctx.userId,
    })
    .select("id, machine_id")
    .single();

  if (error) return fail(mapSupabaseError(error));

  await supabase.from("hire_events").insert({
    hire_agreement_id: data.id,
    machine_id: data.machine_id,
    event_type: "created",
    detail: "Hire draft created",
    actor_id: auth.ctx.userId,
  });

  if (parsed.data.activate_now === "true") {
    const { error: activateError } = await supabase.rpc(
      "activate_hire_agreement",
      { p_hire_id: data.id },
    );
    if (activateError) {
      revalidateHirePaths(data.machine_id);
      return fail(
        `Draft saved, but activation failed: ${mapSupabaseError(activateError)}`,
      );
    }
  }

  revalidateHirePaths(data.machine_id);
  return ok(
    { id: data.id },
    parsed.data.activate_now === "true"
      ? "Hire activated."
      : "Hire draft created (not active until activated).",
  );
}

export async function activateHire(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("hires:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const id = String(formData.get("hire_id") ?? "");
  if (!uuidSchema.safeParse(id).success) return fail("Invalid hire id.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase.rpc("activate_hire_agreement", {
    p_hire_id: id,
  });

  if (error) return fail(mapSupabaseError(error));
  const row = data as { id: string; machine_id: string };
  revalidateHirePaths(row.machine_id);
  return ok({ id: row.id }, "Hire activated.");
}

export async function closeHire(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const closeAuth = await requirePermission("hires:close");
  const writeAuth = closeAuth.ok
    ? closeAuth
    : await requirePermission("hires:write");
  if (!writeAuth.ok) return fail(`Not allowed (${writeAuth.reason}).`);

  const id = String(formData.get("hire_id") ?? "");
  if (!uuidSchema.safeParse(id).success) return fail("Invalid hire id.");
  const detail = String(formData.get("detail") ?? "");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase.rpc("close_hire_agreement", {
    p_hire_id: id,
    p_detail: detail || null,
  });

  if (error) return fail(mapSupabaseError(error));
  const row = data as { id: string; machine_id: string };
  revalidateHirePaths(row.machine_id);
  return ok({ id: row.id }, "Hire closed explicitly.");
}
