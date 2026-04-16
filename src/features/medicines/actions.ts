"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Medicine, ActionResult } from "@/types";

type MedicineInput = Pick<Medicine, "name" | "dosage" | "notes"> & {
  category_id?: string;
  stock_qty?: number;
  expiration_date?: string;
};

/**
 * Adds a new PERSONAL medicine (is_private: true) along with its time schedules.
 * @param medicine    Medicine metadata
 * @param times       Array of HH:mm strings
 * @param frequency   Frequency string (default: "daily")
 * @param startDate   ISO date for schedule start (default: today)
 * @param endDate     ISO date for schedule end (optional, open-ended if omitted)
 */
export async function addMedicineAndSchedules(
  medicine: MedicineInput,
  times: string[],
  frequency: string = "daily",
  startDate?: string,
  endDate?: string
): Promise<ActionResult<Medicine>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const today = new Date().toISOString().split("T")[0];

  // Build insert payload — personal medicine
  const insertPayload: Record<string, unknown> = {
    name: medicine.name,
    dosage: medicine.dosage,
    owner_user_id: user.id,
    target_user_id: user.id,
    is_private: true,         // ← personal medicine
    owner_family_id: null,    // ← not shared to any family
  };
  if (medicine.notes) insertPayload.notes = medicine.notes;
  if (medicine.category_id) insertPayload.category_id = medicine.category_id;
  if (medicine.stock_qty !== undefined) insertPayload.stock_qty = medicine.stock_qty;
  if (medicine.expiration_date) insertPayload.expiration_date = medicine.expiration_date;

  // 1. Insert Medicine
  const { data: newMed, error: medError } = await supabase
    .from("medicines")
    .insert(insertPayload)
    .select()
    .single();

  if (medError) {
    return { success: false, error: medError.message };
  }

  // 2. Insert Schedules with date range
  if (times.length > 0) {
    const schedulesToInsert = times.map((time) => ({
      medicine_id: newMed.id,
      scheduled_time: time.length === 5 ? `${time}:00` : time,
      frequency,
      is_active: true,
      start_date: startDate ?? today,
      ...(endDate ? { end_date: endDate } : {}),
    }));

    const { error: schedError } = await supabase
      .from("schedules")
      .insert(schedulesToInsert);

    if (schedError) {
      return {
        success: false,
        error: "Failed to save schedules: " + schedError.message,
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  return { success: true, data: newMed };
}

/**
 * Updates an existing medicine.
 * NOTE: Editing a personal medicine does NOT auto-update shared copies.
 */
export async function updateMedicine(
  id: string,
  updates: MedicineInput,
  times?: string[],
  frequency?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    name: updates.name,
    dosage: updates.dosage,
    notes: updates.notes ?? null,
    category_id: updates.category_id ?? null,
    stock_qty: updates.stock_qty ?? null,
    expiration_date: updates.expiration_date ?? null,
  };

  const { error } = await supabase
    .from("medicines")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Sync Schedules if times provided (delete + recreate preserving start_date = today)
  if (times) {
    await supabase.from("schedules").delete().eq("medicine_id", id);

    if (times.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const schedulesToInsert = times.map((time) => ({
        medicine_id: id,
        scheduled_time: time.length === 5 ? `${time}:00` : time,
        frequency: frequency || "daily",
        is_active: true,
        start_date: today,
      }));
      const { error: schedError } = await supabase
        .from("schedules")
        .insert(schedulesToInsert);

      if (schedError) console.error("Schedule sync error:", schedError.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  return { success: true, data: undefined };
}

/**
 * Deletes a medicine.
 * Cascading delete automatically removes related schedules.
 * NOTE: Does NOT delete shared family copies (those have different owner_family_id).
 */
export async function deleteMedicine(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("medicines")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  return { success: true, data: undefined };
}
