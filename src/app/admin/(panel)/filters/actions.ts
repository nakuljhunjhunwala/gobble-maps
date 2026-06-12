"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { filterOptionSchema } from "@/lib/admin/schemas";
import type { FilterCategory, FilterOptionRow } from "@/lib/types";

export type FilterActionResult = { ok: true } | { ok: false; error: string };

/**
 * addOption returns the created row alongside `ok` so callers (e.g. the place
 * editor's inline "+ Add new area…") can select it immediately. Backward
 * compatible: existing callers that only read `ok` are unaffected.
 */
export type AddOptionResult =
  | { ok: true; option: FilterOptionRow }
  | { ok: false; error: string };

const addSchema = filterOptionSchema.pick({ category: true, label: true });

const renameSchema = z.object({
  id: z.uuid(),
  label: filterOptionSchema.shape.label,
});

const removeSchema = z.object({ id: z.uuid() });

function revalidateFilters(): void {
  revalidatePath("/admin/filters");
  // Place editor selects (areas / cuisine & vibe tags) must refresh too.
  revalidatePath("/admin/places");
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export async function addOption(
  category: FilterCategory,
  label: string
): Promise<AddOptionResult> {
  const { supabase } = await requireAdmin();

  const parsed = addSchema.safeParse({ category, label });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // Next sort_order within the category.
  const { data: maxRow, error: maxError } = await supabase
    .from("filter_options")
    .select("sort_order")
    .eq("category", parsed.data.category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) {
    return { ok: false, error: maxError.message };
  }

  const { data: inserted, error } = await supabase
    .from("filter_options")
    .insert({
      category: parsed.data.category,
      label: parsed.data.label,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        error: `“${parsed.data.label}” already exists in ${parsed.data.category} filters.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateFilters();
  return { ok: true, option: inserted as FilterOptionRow };
}

export async function renameOption(
  id: string,
  label: string
): Promise<FilterActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = renameSchema.safeParse({ id, label });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("filter_options")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.id);

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        error: `“${parsed.data.label}” already exists in this category.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateFilters();
  return { ok: true };
}

export async function removeOption(id: string): Promise<FilterActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = removeSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // PRD: places keep the tag internally — we only deactivate, never delete.
  const { error } = await supabase
    .from("filter_options")
    .update({ is_active: false })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateFilters();
  return { ok: true };
}
