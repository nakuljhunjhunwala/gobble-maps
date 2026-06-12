"use server";

// Gobble Maps consumer — analytics server action.
// analytics_events allows anon inserts under RLS; these events power the
// admin dashboard. Errors are swallowed — analytics must never break UX.

import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/consumer/session";
import type { AnalyticsEventType } from "@/lib/types";

/**
 * Records one analytics event. Pass `userId` (from the consumer session)
 * when available to attribute the event to a signed-in user.
 */
export async function logEvent(
  type: AnalyticsEventType,
  placeId?: string | null,
  metadata?: Record<string, string>,
  userId?: string | null
): Promise<void> {
  try {
    // Resolve the session user when no explicit override is passed, so events
    // attribute to signed-in users (powering DAU/WAU/MAU). Logged-out → null.
    let resolvedUserId = userId;
    if (resolvedUserId === undefined) {
      try {
        resolvedUserId = await getSessionUserId();
      } catch {
        resolvedUserId = null;
      }
    }
    const supabase = await createClient();
    await supabase.from("analytics_events").insert({
      event_type: type,
      place_id: placeId ?? null,
      user_id: resolvedUserId ?? null,
      metadata: metadata ?? {},
    });
  } catch {
    // Swallow — analytics failures must never surface to the user.
  }
}
