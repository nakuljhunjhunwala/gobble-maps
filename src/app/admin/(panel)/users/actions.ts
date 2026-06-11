"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

const deleteUserSchema = z.object({ id: z.uuid() });

/**
 * Deletes a profiles row — saved_places, lists and list_places cascade
 * away with it (FKs are ON DELETE CASCADE).
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  const parsed = deleteUserSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: "Invalid user id." };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
