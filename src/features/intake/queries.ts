"use server";

import { createClient } from "@/lib/supabase/server";
import type { IntakeLog } from "@/types";

/**
 * Fetches all intake logs for the authenticated user on a given date.
 * Returns a map of schedule_id → IntakeLog for O(1) lookups in the UI.
 *
 * @param date ISO date string, e.g. "2025-04-14"
 */
export async function getIntakeLogsForDate(
  date: string
): Promise<IntakeLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("intake_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("scheduled_date", date);

  if (error) {
    console.error("[getIntakeLogsForDate] error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches intake logs for multiple family members on a given date.
 * Used by the family calendar's detail modal to display cross-member status.
 *
 * @param memberIds Array of user IDs (family members)
 * @param date      ISO date string, e.g. "2025-04-14"
 */
export async function getFamilyIntakeLogsForDate(
  memberIds: string[],
  date: string
): Promise<IntakeLog[]> {
  if (memberIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("intake_logs")
    .select("*")
    .in("user_id", memberIds)
    .eq("scheduled_date", date);

  if (error) {
    console.error("[getFamilyIntakeLogsForDate] error:", error.message);
    return [];
  }

  return data ?? [];
}
