"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificationSchema } from "@/lib/admin/schemas";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type NotificationActionResult =
  | { ok: true; recipients: number }
  | { ok: false; error: string };

export interface NotificationActionInput {
  message: string;
  segment: "all" | "area";
  areaId?: string;
}

/**
 * Recipient count for the toast + history row:
 * - 'all'  → count of profiles
 * - 'area' → count of DISTINCT saved_places.user_id whose place is in the area
 */
async function recipientCount(
  supabase: Supabase,
  segment: "all" | "area",
  areaId?: string
): Promise<number> {
  if (segment === "all") {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  const { data, error } = await supabase
    .from("saved_places")
    .select("user_id, places!inner(area_id)")
    .eq("places.area_id", areaId as string);
  if (error) throw new Error(error.message);

  const users = new Set(
    ((data ?? []) as { user_id: string }[]).map((row) => row.user_id)
  );
  return users.size;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function sendNotification(
  input: NotificationActionInput
): Promise<NotificationActionResult> {
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  try {
    const recipients = await recipientCount(
      supabase,
      parsed.data.segment,
      parsed.data.areaId
    );

    const { error } = await supabase.from("notifications").insert({
      type: parsed.data.segment === "all" ? "manual" : "area_based",
      message: parsed.data.message,
      segment_area_id:
        parsed.data.segment === "area" ? parsed.data.areaId : null,
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: recipients,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/notifications");
    return { ok: true, recipients };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function scheduleNotification(
  input: NotificationActionInput
): Promise<NotificationActionResult> {
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  try {
    const recipients = await recipientCount(
      supabase,
      parsed.data.segment,
      parsed.data.areaId
    );

    // Tomorrow, 11:00 AM local time.
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 1);
    scheduledFor.setHours(11, 0, 0, 0);

    const { error } = await supabase.from("notifications").insert({
      type: parsed.data.segment === "all" ? "manual" : "area_based",
      message: parsed.data.message,
      segment_area_id:
        parsed.data.segment === "area" ? parsed.data.areaId : null,
      status: "scheduled",
      scheduled_for: scheduledFor.toISOString(),
      recipient_count: recipients,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/notifications");
    return { ok: true, recipients };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error) };
  }
}
