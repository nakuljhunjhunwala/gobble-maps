"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function resolveReport(id: string): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid report id." };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("issue_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/reports");
  // Sidebar open-report badge lives in the (panel) layout.
  revalidatePath("/admin", "layout");
  return { ok: true };
}
