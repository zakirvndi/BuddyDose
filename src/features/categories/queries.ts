"use server";

import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

/**
 * Fetches all available categories.
 * Intended for Server Components only.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("[getCategories] error:", error.message);
    return [];
  }

  return data ?? [];
}
