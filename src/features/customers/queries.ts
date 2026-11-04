import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CustomerRow, SiteRow } from "@/types";

export async function listCustomers(): Promise<{
  source: "supabase" | "unavailable";
  customers: CustomerRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      source: "unavailable",
      customers: [],
      message: "Supabase env not configured.",
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", customers: [], message: "No client." };
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, code, name, phone, email, notes, deleted_at, created_at")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return { source: "unavailable", customers: [], message: error.message };
  }
  return { source: "supabase", customers: (data ?? []) as CustomerRow[] };
}

export async function listSitesForCustomer(customerId: string): Promise<{
  source: "supabase" | "unavailable";
  sites: SiteRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { source: "unavailable", sites: [], message: "Supabase env not configured." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", sites: [], message: "No client." };
  }

  const { data, error } = await supabase
    .from("sites")
    .select("id, customer_id, name, address, notes, deleted_at")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return { source: "unavailable", sites: [], message: error.message };
  }
  return { source: "supabase", sites: (data ?? []) as SiteRow[] };
}

export async function listAllSites(): Promise<{
  source: "supabase" | "unavailable";
  sites: SiteRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { source: "unavailable", sites: [], message: "Supabase env not configured." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { source: "unavailable", sites: [], message: "No client." };
  }

  const { data, error } = await supabase
    .from("sites")
    .select("id, customer_id, name, address, notes, deleted_at")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return { source: "unavailable", sites: [], message: error.message };
  }
  return { source: "supabase", sites: (data ?? []) as SiteRow[] };
}
