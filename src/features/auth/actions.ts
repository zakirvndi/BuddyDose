"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Sign Up With Full Name ───────────────────────────────────────────────────

/**
 * Registers a new user and upserts a profiles row with their full name.
 * The full name is also stored in auth metadata as a fallback.
 */
export async function signUpWithProfile(
  email: string,
  password: string,
  fullName: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: { full_name: fullName },
    },
  });

  if (error) return { success: false, error: error.message };

  // Insert profile row immediately if user was created (email confirm disabled)
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
    });
    if (profileError) {
      // Non-fatal — auth metadata holds full_name as fallback
      console.warn("[signUpWithProfile] profile insert failed:", profileError.message);
    }
  }

  return { success: true, data: undefined };
}

// ─── Update Profile ───────────────────────────────────────────────────────────

/**
 * Upserts the current user's profile row (full_name and/or avatar_url).
 */
export async function updateProfile(data: {
  fullName: string;
  avatarUrl?: string;
}): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const updates: Record<string, string> = { id: user.id };
  updates.full_name = data.fullName;
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl }),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/family", "layout");
  return { success: true, data: undefined };
}

// ─── Upload Avatar ────────────────────────────────────────────────────────────

/**
 * Uploads an avatar image to Supabase Storage (avatars bucket).
 * Uses upsert so the same path is overwritten on re-upload.
 * Returns the public URL of the uploaded image.
 *
 * Requires: Supabase Storage bucket "avatars" with public read access.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult<string>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0)
    return { success: false, error: "No file provided" };

  // Path must start with userId/ to satisfy Supabase Storage RLS policies
  const ext = file.name.split(".").pop() ?? "png";
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[uploadAvatar] upload error:", uploadError.message);
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return { success: true, data: publicUrl };
}

// ─── Update Password ──────────────────────────────────────────────────────────

/**
 * Updates the password for the currently authenticated user.
 * Does NOT require the old password.
 */
export async function updatePassword(
  newPassword: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("[updatePassword] error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
