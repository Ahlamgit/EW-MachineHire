"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, mapSupabaseError, ok, type ActionResult } from "@/lib/workflow/errors";
import { nonEmptyStringSchema, uuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const machineInputSchema = z.object({
  code: nonEmptyStringSchema.max(64),
  name: nonEmptyStringSchema.max(200),
  machine_type_id: z.union([uuidSchema, z.literal("")]).optional(),
  machine_brand_id: z.union([uuidSchema, z.literal("")]).optional(),
  branch_id: z.union([uuidSchema, z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
});

function emptyToNull(value: string | undefined) {
  if (!value || value === "") return null;
  return value;
}

export async function createMachine(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("machines:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = machineInputSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    machine_type_id: formData.get("machine_type_id") ?? "",
    machine_brand_id: formData.get("machine_brand_id") ?? "",
    branch_id: formData.get("branch_id") ?? "",
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("machines")
    .insert({
      code: parsed.data.code,
      name: parsed.data.name,
      machine_type_id: emptyToNull(parsed.data.machine_type_id),
      machine_brand_id: emptyToNull(parsed.data.machine_brand_id),
      branch_id: emptyToNull(parsed.data.branch_id),
      notes: parsed.data.notes?.trim() || null,
      created_by: auth.ctx.userId,
    })
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/machines");
  revalidatePath("/");
  return ok({ id: data.id }, "Machine created.");
}

export async function updateMachine(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("machines:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const id = String(formData.get("id") ?? "");
  if (!uuidSchema.safeParse(id).success) return fail("Invalid machine id.");

  const parsed = machineInputSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    machine_type_id: formData.get("machine_type_id") ?? "",
    machine_brand_id: formData.get("machine_brand_id") ?? "",
    branch_id: formData.get("branch_id") ?? "",
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("machines")
    .update({
      code: parsed.data.code,
      name: parsed.data.name,
      machine_type_id: emptyToNull(parsed.data.machine_type_id),
      machine_brand_id: emptyToNull(parsed.data.machine_brand_id),
      branch_id: emptyToNull(parsed.data.branch_id),
      notes: parsed.data.notes?.trim() || null,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/machines");
  revalidatePath(`/machines/${id}`);
  revalidatePath("/");
  return ok({ id: data.id }, "Machine updated.");
}
