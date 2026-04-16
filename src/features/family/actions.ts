"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, FamilyGroup } from "@/types";

/**
 * Creates a new family group and adds the current user as admin.
 */
export async function createFamily(
  name: string
): Promise<ActionResult<FamilyGroup>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Insert family group
  const { data: group, error: groupErr } = await supabase
    .from("family_groups")
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single();

  if (groupErr || !group) {
    return { success: false, error: groupErr?.message ?? "Failed to create family" };
  }

  // 2. Add creator as admin member
  const { error: memberErr } = await supabase.from("family_members").insert({
    family_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberErr) {
    return { success: false, error: memberErr.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data: group };
}

/**
 * Joins an existing family by family ID.
 * The family ID can be shared as an invite link.
 */
export async function joinFamily(
  familyId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Check the family exists
  const { data: family, error: famErr } = await supabase
    .from("family_groups")
    .select("id")
    .eq("id", familyId)
    .single();

  if (famErr || !family) {
    return { success: false, error: "Family not found. Check the ID and try again." };
  }

  // Check already a member
  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "You are already a member of this family." };
  }

  const { error: insertErr } = await supabase.from("family_members").insert({
    family_id: familyId,
    user_id: user.id,
    role: "member",
  });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

/**
 * Adds a medicine for a family member.
 * Sets owner_family_id and target_user_id appropriately.
 * Schedules include start_date / end_date for date-range filtering.
 */
export async function addFamilyMedicineAndSchedules(
  familyId: string,
  targetUserId: string,
  medicine: {
    name: string;
    dosage: string;
    notes?: string;
    category_id?: string;
    stock_qty?: number;
    expiration_date?: string;
  },
  times: string[],
  frequency: string = "daily",
  startDate?: string,
  endDate?: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  const insertPayload: Record<string, unknown> = {
    name: medicine.name,
    dosage: medicine.dosage,
    owner_user_id: user.id,
    owner_family_id: familyId,
    target_user_id: targetUserId,
    is_private: false,
  };

  if (medicine.notes) insertPayload.notes = medicine.notes;
  if (medicine.category_id) insertPayload.category_id = medicine.category_id;
  if (medicine.stock_qty !== undefined) insertPayload.stock_qty = medicine.stock_qty;
  if (medicine.expiration_date) insertPayload.expiration_date = medicine.expiration_date;

  const { data: newMed, error: medError } = await supabase
    .from("medicines")
    .insert(insertPayload)
    .select("id")
    .single();

  if (medError || !newMed) {
    return { success: false, error: medError?.message ?? "Failed to add medicine" };
  }

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
      return { success: false, error: "Failed to save schedules: " + schedError.message };
    }
  }

  revalidatePath(`/family/${familyId}`);
  return { success: true, data: newMed };
}

// ─── Share to Family ──────────────────────────────────────────────────────────

/**
 * Shares a personal medicine to a family group.
 *
 * Creates a NEW medicine record for the family (copy).
 * The original personal medicine is NOT modified.
 * Uses source_medicine_id to track the origin and prevent duplicate sharing
 * to the same family (enforced by unique constraint on medicines table).
 */
export async function shareMedicineToFamily(
  medicineId: string,
  familyId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Fetch original personal medicine + its schedules
  const { data: original, error: fetchErr } = await supabase
    .from("medicines")
    .select("*, schedules(*)")
    .eq("id", medicineId)
    .eq("owner_user_id", user.id)
    .eq("is_private", true)
    .single();

  if (fetchErr || !original) {
    return { success: false, error: "Medicine not found or you don't have access." };
  }

  // 2. Verify current user is a member of the target family
  const { data: membership } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "You are not a member of this family." };
  }

  // 3. Create new medicine record for the family (copy)
  const { data: newMed, error: insertErr } = await supabase
    .from("medicines")
    .insert({
      name: original.name,
      dosage: original.dosage,
      notes: original.notes ?? null,
      category_id: original.category_id ?? null,
      stock_qty: original.stock_qty ?? null,
      expiration_date: original.expiration_date ?? null,
      owner_user_id: user.id,
      owner_family_id: familyId,
      target_user_id: user.id,
      is_private: false,
      source_medicine_id: medicineId, // ← links back to original
    })
    .select("id")
    .single();

  if (insertErr) {
    // Unique constraint violation — already shared to this family
    if (insertErr.code === "23505") {
      return {
        success: false,
        error: "This medicine has already been shared to this family.",
      };
    }
    return { success: false, error: insertErr.message };
  }

  // 4. Copy active schedules to the new family medicine
  const activeSchedules = (original.schedules ?? []).filter(
    (s: { is_active: boolean }) => s.is_active
  );

  if (activeSchedules.length > 0 && newMed) {
    const today = new Date().toISOString().split("T")[0];
    const schedulesToInsert = activeSchedules.map(
      (s: {
        scheduled_time: string;
        frequency: string | null;
        start_date: string;
        end_date: string | null;
      }) => ({
        medicine_id: newMed.id,
        scheduled_time: s.scheduled_time,
        frequency: s.frequency ?? "daily",
        is_active: true,
        // Shared copy starts today — preserves end_date from original
        start_date: today,
        ...(s.end_date ? { end_date: s.end_date } : {}),
      })
    );

    const { error: schedErr } = await supabase
      .from("schedules")
      .insert(schedulesToInsert);

    if (schedErr) {
      console.warn("[shareMedicineToFamily] schedule copy failed:", schedErr.message);
      // Non-fatal — medicine was created, schedules can be added manually
    }
  }

  revalidatePath(`/family/${familyId}`);
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Member Management ────────────────────────────────────────────────────────

/**
 * Promotes or demotes a family member's role.
 * Only admins can call this. Prevents self-modification.
 */
export async function updateMemberRole(
  familyId: string,
  userId: string,
  newRole: "admin" | "member"
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify current user is admin
  const { data: myMembership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!myMembership || myMembership.role !== "admin") {
    return { success: false, error: "Only admins can change member roles." };
  }

  // Prevent self-role-change
  if (userId === user.id) {
    return { success: false, error: "You cannot change your own role." };
  }

  const { error } = await supabase
    .from("family_members")
    .update({ role: newRole })
    .eq("family_id", familyId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/family/${familyId}`);
  return { success: true, data: undefined };
}

/**
 * Removes a member from a family group.
 * Only admins can call this. Prevents self-removal.
 */
export async function removeMember(
  familyId: string,
  userId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify current user is admin
  const { data: myMembership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!myMembership || myMembership.role !== "admin") {
    return { success: false, error: "Only admins can remove members." };
  }

  // Prevent self-removal
  if (userId === user.id) {
    return { success: false, error: "You cannot remove yourself from the family." };
  }

  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/family/${familyId}`);
  return { success: true, data: undefined };
}

// ─── Chat Actions ─────────────────────────────────────────────────────────────

import type { ChatMessage } from "@/features/family/queries";

/**
 * Sends a new message to a family chat.
 * Returns the full inserted message (with sender profile) on success.
 */
export async function sendMessage(
  familyId: string,
  content: string
): Promise<ActionResult<ChatMessage>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      family_id: familyId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("*, sender:profiles!sender_id(id, full_name, avatar_url)")
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as unknown as ChatMessage };
}

/**
 * Soft-deletes a message (sets is_deleted = true).
 * Only the original sender can delete their own message.
 */
export async function deleteMessage(messageId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("messages")
    .update({ is_deleted: true })
    .eq("id", messageId)
    .eq("sender_id", user.id); // Enforce ownership

  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}
