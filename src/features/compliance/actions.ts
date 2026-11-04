"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COMPLIANCE_DOCUMENT_TYPES } from "@/lib/compliance/bands";
import { fail, mapSupabaseError, ok, type ActionResult } from "@/lib/workflow/errors";
import { uuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const renewSchema = z.object({
  machine_id: uuidSchema,
  document_type: z.enum(["insurance", "fitness", "road_tracks"]),
  document_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Document Date must be YYYY-MM-DD"),
  notes: z.string().max(2000).optional(),
});

export async function renewComplianceDocument(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("compliance:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = renewSchema.safeParse({
    machine_id: formData.get("machine_id"),
    document_type: formData.get("document_type"),
    document_date: formData.get("document_date"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  if (!COMPLIANCE_DOCUMENT_TYPES.includes(parsed.data.document_type)) {
    return fail("Unknown document type.");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.document_date > today) {
    return fail("Document Date cannot be in the future.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("compliance_records")
    .insert({
      machine_id: parsed.data.machine_id,
      document_type: parsed.data.document_type,
      document_date: parsed.data.document_date,
      notes: parsed.data.notes?.trim() || null,
      recorded_by: auth.ctx.userId,
    })
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));

  revalidatePath("/compliance");
  revalidatePath(`/machines/${parsed.data.machine_id}`);
  revalidatePath(`/machines/${parsed.data.machine_id}/compliance`);
  revalidatePath("/");
  return ok(
    { id: data.id },
    "Compliance record added (prior history preserved).",
  );
}
