"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IntakeStatus, ActionResult } from "@/types";

/**
 * Upserts a single intake log.
 * Uses unique constraint on (schedule_id, user_id, scheduled_date).
 *
 * @param scheduleId    The schedule row id
 * @param scheduledDate ISO date string, e.g. "2025-04-14"
 * @param status        "taken" | "missed" | "skipped"
 */
export async function logIntake(
  scheduleId: string,
  scheduledDate: string,
  status: IntakeStatus
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("intake_logs").upsert(
    {
      schedule_id: scheduleId,
      user_id: user.id,
      scheduled_date: scheduledDate,
      status,
      taken_at: status === "taken" ? new Date().toISOString() : null,
    },
    {
      onConflict: "schedule_id,user_id,scheduled_date",
    }
  );

  if (error) {
    console.error("[logIntake] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  return { success: true, data: undefined };
}

/**
 * Batch-upserts all provided schedules as "taken" for a given date.
 * Skips schedules that already have a log for that date.
 *
 * @param scheduleIds   Array of schedule IDs to mark taken
 * @param scheduledDate ISO date string, e.g. "2025-04-14"
 */
export async function markAllTaken(
  scheduleIds: string[],
  scheduledDate: string
): Promise<ActionResult<void>> {
  if (scheduleIds.length === 0) return { success: true, data: undefined };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const takenAt = new Date().toISOString();
  const rows = scheduleIds.map((id) => ({
    schedule_id: id,
    user_id: user.id,
    scheduled_date: scheduledDate,
    status: "taken" as IntakeStatus,
    taken_at: takenAt,
  }));

  const { error } = await supabase.from("intake_logs").upsert(rows, {
    onConflict: "schedule_id,user_id,scheduled_date",
  });

  if (error) {
    console.error("[markAllTaken] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  return { success: true, data: undefined };
}

/**
 * Logs intake for a specific family member (targetUserId).
 * Unlike logIntake(), this records the log under the target member's user_id
 * rather than the currently authenticated user — needed for family scheduling.
 *
 * @param scheduleId    The schedule row id
 * @param targetUserId  The family member whose log we are creating/updating
 * @param scheduledDate ISO date string, e.g. "2025-04-14"
 * @param status        "taken" | "missed" | "skipped"
 */
export async function logFamilyMemberIntake(
  scheduleId: string,
  targetUserId: string,
  scheduledDate: string,
  status: IntakeStatus
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("intake_logs").upsert(
    {
      schedule_id: scheduleId,
      user_id: targetUserId,
      scheduled_date: scheduledDate,
      status,
      taken_at: status === "taken" ? new Date().toISOString() : null,
    },
    {
      onConflict: "schedule_id,user_id,scheduled_date",
    }
  );

  if (error) {
    console.error("[logFamilyMemberIntake] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/family", "layout");
  return { success: true, data: undefined };
}
