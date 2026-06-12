"use server";

// Gobble Maps consumer — search server action.
// searchPlaces() lives in the server-only queries module (it reaches for the
// admin client to surface permanently-closed matches hidden by RLS), so the
// client search screen calls this thin wrapper, debounced, instead.

import { searchPlaces } from "@/lib/consumer/queries";
import type { ConsumerPlace } from "@/lib/consumer/types";

/** Debounced, client-callable search over published + permanently-closed places. */
export async function searchAction(q: string): Promise<ConsumerPlace[]> {
  return searchPlaces(q);
}
