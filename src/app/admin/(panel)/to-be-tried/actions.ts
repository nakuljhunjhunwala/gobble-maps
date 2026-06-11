"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tbtSchema } from "@/lib/admin/schemas";

export type TbtActionResult = { ok: true } | { ok: false; error: string };

const addTbtSchema = tbtSchema.pick({ name: true, address: true, notes: true });

export interface AddTbtInput {
  name: string;
  address?: string;
  notes?: string;
}

export async function addTbt(input: AddTbtInput): Promise<TbtActionResult> {
  const parsed = addTbtSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("to_be_tried").insert({
    name: parsed.data.name,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
    status: "pending_visit",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/to-be-tried");
  return { ok: true };
}

export async function deleteTbt(id: string): Promise<TbtActionResult> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("to_be_tried")
    .delete()
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/to-be-tried");
  return { ok: true };
}

/**
 * "Visited — create listing": the row leaves the pipeline (deleted, matching
 * the prototype which removes it); the client then deep-links to
 * /admin/places?new=1 with the name/address/note prefill.
 */
export async function markVisited(id: string): Promise<TbtActionResult> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("to_be_tried")
    .delete()
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/to-be-tried");
  return { ok: true };
}
