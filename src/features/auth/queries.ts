"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/**
 * Fetches the profile row for the currently authenticated user.
 * Returns null if not authenticated or no profile row exists yet.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as Profile;
}
