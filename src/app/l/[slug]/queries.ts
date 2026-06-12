// Gobble Maps consumer — public list (FR-9) server-only data helper.
// Lists/profiles are admin-only under RLS, so this reads through the
// service-role client. NEVER import from a client component, and only ever
// expose a list that is explicitly public (is_public=true) — the slug alone
// is never trusted.

import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRowToConsumerPlace, type ConsumerPlaceQueryRow } from "@/lib/consumer/queries";
import type { ConsumerPlace } from "@/lib/consumer/types";

const PLACE_SELECT =
  "*, photos:place_photos(*), place_tags(filter_options(*)), area:filter_options!places_area_id_fkey(*)";

export interface PublicList {
  id: string;
  name: string;
  /** owner username (without leading @) */
  username: string;
  places: ConsumerPlace[];
}

/**
 * Fetch a shareable list by its slug. Returns null when the slug does not
 * match a list, the list is private, or the owner profile is missing — the
 * caller maps null to notFound(). Only published places are included.
 * cache(): deduped across generateMetadata + page within one request.
 */
export const getPublicList = cache(async (
  slug: string
): Promise<PublicList | null> => {
  const admin = createAdminClient();

  const { data: list, error: listError } = await admin
    .from("lists")
    .select("id, name, user_id, is_public, share_slug")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (listError) throw new Error(listError.message);
  if (!list) return null;

  const [{ data: profile, error: profileError }, { data: links, error: linksError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("username")
        .eq("id", list.user_id)
        .maybeSingle(),
      admin
        .from("list_places")
        .select("place_id, created_at")
        .eq("list_id", list.id)
        .order("created_at", { ascending: true }),
    ]);
  if (profileError) throw new Error(profileError.message);
  if (linksError) throw new Error(linksError.message);
  if (!profile) return null;

  const placeIds = (links ?? []).map((l) => l.place_id);
  let places: ConsumerPlace[] = [];

  if (placeIds.length > 0) {
    const { data: placeRows, error: placesError } = await admin
      .from("places")
      .select(PLACE_SELECT)
      .in("id", placeIds)
      .eq("status", "published");
    if (placesError) throw new Error(placesError.message);

    const mapped = ((placeRows ?? []) as unknown as ConsumerPlaceQueryRow[]).map(
      mapRowToConsumerPlace
    );
    // Preserve the list's stored ordering.
    const byId = new Map(mapped.map((p) => [p.id, p]));
    places = placeIds
      .map((id) => byId.get(id))
      .filter((p): p is ConsumerPlace => p !== undefined);
  }

  return {
    id: list.id,
    name: list.name,
    username: profile.username,
    places,
  };
});
