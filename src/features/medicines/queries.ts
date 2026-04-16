"use server";

import { createClient } from "@/lib/supabase/server";
import type { Medicine, ActionResult } from "@/types";

/**
 * Fetches personal medicines for the currently authenticated user.
 * Strict filter: is_private = true AND owner_family_id IS NULL.
 * These are the medicines shown ONLY on the personal dashboard.
 */
export async function getMedicines(): Promise<Medicine[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("medicines")
    .select("*, schedules(*), category:categories(id, name, created_at)")
    .eq("is_private", true)
    .is("owner_family_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMedicines] error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches today's active personal schedules combining medicines and their time slots.
 * Strict filter: is_private = true (no family medicines).
 * Also filters by start_date / end_date so inactive ranges are excluded.
 */
export async function getDailySchedule() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("schedules")
    .select(`
      id,
      medicine_id,
      scheduled_time,
      frequency,
      is_active,
      start_date,
      end_date,
      medicine:medicines (
        id,
        name,
        dosage,
        notes,
        category_id,
        stock_qty,
        expiration_date,
        is_private,
        owner_family_id,
        created_at,
        category:categories(id, name, created_at)
      )
    `)
    .eq("is_active", true)
    .order("scheduled_time", { ascending: true });

  if (error) {
    console.error("[getDailySchedule] error:", error.message);
    return [];
  }

  return (data || []).filter((s) => {
    const med = (s.medicine as unknown) as Record<string, unknown> | null;
    if (!med) return false;
    // Personal only — is_private must be true and no family_id
    if (!med.is_private) return false;
    if (med.owner_family_id) return false;
    // Date range: skip if schedule hasn't started yet
    if (s.start_date > today) return false;
    // Date range: skip if schedule has ended
    if (s.end_date && s.end_date < today) return false;
    return true;
  });
}
