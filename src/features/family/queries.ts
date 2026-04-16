"use server";

import { createClient } from "@/lib/supabase/server";
import type { FamilyGroup, FamilyMember, Medicine } from "@/types";

// ─── Family Schedule With User ────────────────────────────────────────────────

export type FamilyScheduleWithUser = {
  medicine_id: string;
  medicine_name: string;
  target_user_id: string;
  user_name: string;
  scheduled_time: string; // HH:mm:ss
  frequency: string;
  schedule_id: string;
  /** ISO date YYYY-MM-DD: schedule starts on this day */
  start_date: string;
  /** ISO date YYYY-MM-DD: schedule ends on this day (null = open-ended) */
  end_date: string | null;
};

/**
 * Returns all family groups the current user belongs to,
 * along with the member list (with profiles) for each family.
 */
export async function getFamiliesForUser(): Promise<
  Array<FamilyGroup & { members: FamilyMember[] }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get all membership rows for this user
  const { data: memberships, error: memErr } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id);

  if (memErr || !memberships || memberships.length === 0) return [];

  const familyIds = memberships.map((m) => m.family_id);

  // Get family groups
  const { data: families, error: famErr } = await supabase
    .from("family_groups")
    .select("id, name, created_by, created_at")
    .in("id", familyIds);

  if (famErr || !families) return [];

  // Get all members for these families with profiles
  const { data: allMembers, error: allMembersErr } = await supabase
    .from("family_members")
    .select(
      `
      id,
      family_id,
      user_id,
      role,
      joined_at,
      profile:profiles(id, full_name, avatar_url, created_at)
    `
    )
    .in("family_id", familyIds);

  if (allMembersErr) {
    console.error("[getFamiliesForUser] members error:", allMembersErr.message);
  }

  return families.map((f) => ({
    ...f,
    members: ((allMembers ?? []) as unknown as FamilyMember[]).filter(
      (m) => m.family_id === f.id
    ),
  }));
}

/**
 * Returns a single family group with its members (including profiles).
 */
export async function getFamilyById(
  familyId: string
): Promise<(FamilyGroup & { members: FamilyMember[] }) | null> {
  const supabase = await createClient();

  const { data: family, error: famErr } = await supabase
    .from("family_groups")
    .select("id, name, created_by, created_at")
    .eq("id", familyId)
    .single();

  if (famErr || !family) return null;

  const { data: members, error: memErr } = await supabase
    .from("family_members")
    .select(
      `
      id,
      family_id,
      user_id,
      role,
      joined_at,
      profile:profiles(id, full_name, avatar_url, created_at)
    `
    )
    .eq("family_id", familyId);

  if (memErr) {
    console.error("[getFamilyById] members error:", memErr.message);
  }

  return { ...family, members: (members as unknown as FamilyMember[]) ?? [] };
}

/**
 * Extended Medicine type for family context — includes target user's profile.
 */
export type FamilyMedicine = {
  id: string;
  owner_user_id: string;
  owner_family_id?: string | null;
  target_user_id?: string | null;
  source_medicine_id?: string | null;
  name: string;
  dosage: string;
  notes?: string;
  category_id?: string;
  stock_qty?: number;
  expiration_date?: string;
  is_private?: boolean;
  created_at: string;
  schedules?: Array<{
    id: string;
    scheduled_time: string;
    frequency?: string | null;
    is_active: boolean;
    start_date: string;
    end_date?: string | null;
  }>;
  category?: { id: string; name: string; created_at: string } | null;
  /** Profile of the family member this medicine is assigned to */
  target_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

/**
 * Fetches medicines for a specific family.
 */
export async function getFamilyMedicines(
  familyId: string,
): Promise<FamilyMedicine[]> {
  const supabase = await createClient();

  // Fetch all family medicines — strictly filtered by owner_family_id
  const { data, error } = await supabase
    .from("medicines")
    .select(
      "*, schedules(*), category:categories(id, name, created_at), target_profile:profiles!target_user_id(id, full_name, avatar_url)"
    )
    .eq("owner_family_id", familyId)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getFamilyMedicines] error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as FamilyMedicine[];
}

/**
 * Fetches all active medicine schedules for a family, joined with the
 * target user's profile info. Used to populate the family calendar.
 *
 * Returns one FamilyScheduleWithUser entry per active schedule row.
 */
export async function getFamilySchedulesWithUsers(
  familyId: string
): Promise<FamilyScheduleWithUser[]> {
  const supabase = await createClient();

  type RawSched = {
    id: string;
    scheduled_time: string;
    frequency: string | null;
    is_active: boolean;
    start_date: string;
    end_date: string | null;
  };
  type RawProfile = { id: string; full_name: string | null };
  type RawMed = {
    id: string;
    name: string;
    target_user_id: string | null;
    schedules: RawSched[];
    target_profile: RawProfile | null;
  };

  const { data, error } = await supabase
    .from("medicines")
    .select(
      `
      id,
      name,
      target_user_id,
      schedules (
        id,
        scheduled_time,
        frequency,
        is_active,
        start_date,
        end_date
      ),
      target_profile:profiles!target_user_id (
        id,
        full_name
      )
    `
    )
    .eq("owner_family_id", familyId)
    .not("target_user_id", "is", null);

  if (error) {
    console.error("[getFamilySchedulesWithUsers] error:", error.message);
    return [];
  }

  const result: FamilyScheduleWithUser[] = [];

  for (const med of (data as unknown as RawMed[])) {
    if (!med.target_user_id) continue;
    const profile = Array.isArray(med.target_profile)
      ? med.target_profile[0]
      : med.target_profile;

    for (const sched of med.schedules) {
      if (!sched.is_active) continue;
      result.push({
        medicine_id: med.id,
        medicine_name: med.name,
        target_user_id: med.target_user_id,
        user_name: profile?.full_name ?? "Unknown",
        scheduled_time: sched.scheduled_time,
        frequency: sched.frequency ?? "daily",
        schedule_id: sched.id,
        start_date: sched.start_date,
        end_date: sched.end_date ?? null,
      });
    }
  }

  return result;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  family_id: string;
  sender_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Fetches the latest N messages for a family, ordered oldest→newest for display.
 */
export async function getFamilyMessages(
  familyId: string,
  limit = 30
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!sender_id(id, full_name, avatar_url)")
    .eq("family_id", familyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getFamilyMessages] error:", error.message);
    return [];
  }

  // Reverse to ascending order so newest is at bottom
  return ((data ?? []) as unknown as ChatMessage[]).reverse();
}
