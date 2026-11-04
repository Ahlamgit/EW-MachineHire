"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fail, mapSupabaseError, ok, type ActionResult } from "@/lib/workflow/errors";
import { nonEmptyStringSchema, uuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const customerSchema = z.object({
  code: nonEmptyStringSchema.max(64),
  name: nonEmptyStringSchema.max(200),
  phone: z.string().max(64).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
});

const siteSchema = z.object({
  customer_id: uuidSchema,
  name: nonEmptyStringSchema.max(200),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export async function createCustomer(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("customers:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = customerSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("customers")
    .insert({
      code: parsed.data.code,
      name: parsed.data.name,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      created_by: auth.ctx.userId,
    })
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/customers");
  revalidatePath("/hire-agreements");
  return ok({ id: data.id }, "Customer created.");
}

export async function createSite(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requirePermission("customers:write");
  if (!auth.ok) return fail(`Not allowed (${auth.reason}).`);

  const parsed = siteSchema.safeParse({
    customer_id: formData.get("customer_id"),
    name: formData.get("name"),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("Supabase not configured.");

  const { data, error } = await supabase
    .from("sites")
    .insert({
      customer_id: parsed.data.customer_id,
      name: parsed.data.name,
      address: parsed.data.address?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  revalidatePath("/customers");
  revalidatePath("/hire-agreements");
  revalidatePath("/branches");
  return ok({ id: data.id }, "Site created.");
}
