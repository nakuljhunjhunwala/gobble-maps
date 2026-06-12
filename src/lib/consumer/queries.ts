// Gobble Maps consumer — server-side data helpers.
// Server Components / Server Actions ONLY (uses @/lib/supabase/server and,
// for permanently-closed lookups hidden by RLS, @/lib/supabase/admin).
// NEVER import from client components.

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  FilterCategory,
  FilterOptionRow,
  PlacePhotoRow,
  PlaceRow,
} from "@/lib/types";
import type { ConsumerPlace, ConsumerRatings } from "./types";
import { GOBBLE_TYPES } from "./place-types";

// Joined row shape returned by PLACE_SELECT below.
export interface ConsumerPlaceQueryRow extends PlaceRow {
  photos: PlacePhotoRow[];
  place_tags: { filter_options: FilterOptionRow | null }[];
  area: FilterOptionRow | null;
}

const PLACE_SELECT =
  "*, photos:place_photos(*), place_tags(filter_options(*)), area:filter_options!places_area_id_fkey(*)";

/** Deterministic 0–360 hue from the place id (photo-placeholder art). */
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function mapRatings(row: PlaceRow): ConsumerRatings | null {
  if (
    row.food_rating === null ||
    row.service_rating === null ||
    row.ambience_rating === null
  ) {
    return null;
  }
  const avg =
    row.avg_rating ??
    Math.round(
      ((row.food_rating + row.service_rating + row.ambience_rating) / 3) * 10
    ) / 10;
  return {
    food: row.food_rating,
    service: row.service_rating,
    ambience: row.ambience_rating,
    avg,
  };
}

/** Flattens a joined places row into the consumer view shape. */
export function mapRowToConsumerPlace(
  row: ConsumerPlaceQueryRow
): ConsumerPlace {
  const tags = (row.place_tags ?? [])
    .map((t) => t.filter_options)
    .filter((t): t is FilterOptionRow => t !== null);

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    cuisines: tags.filter((t) => t.category === "cuisine").map((t) => t.label),
    vibes: tags.filter((t) => t.category === "vibe").map((t) => t.label),
    area: row.area?.label ?? null,
    budget: row.budget,
    station: row.station,
    address: row.address,
    phone: row.phone,
    instagram: row.instagram,
    website: row.website,
    hours: row.hours ?? null,
    lat: row.lat,
    lng: row.lng,
    visited: row.visited,
    ratings: mapRatings(row),
    mustTry: row.must_try ?? [],
    note: row.curator_note,
    bestTime: row.best_time,
    liveMusic: row.live_music,
    boardGames: row.board_games,
    pureVeg: row.pure_veg,
    meals: row.meals ?? [],
    photoPaths: [...(row.photos ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.storage_path),
    hue: hueFromId(row.id),
    permanentlyClosed: row.status === "permanently_closed",
  };
}

/** All published places with tags, photos and area label (anon-safe). */
export const getPublishedPlaces = cache(
  async (): Promise<ConsumerPlace[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("places")
      .select(PLACE_SELECT)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as ConsumerPlaceQueryRow[]).map(
      mapRowToConsumerPlace
    );
  }
);

/**
 * One place by id. Published places come via the anon client; if not
 * visible there, the admin client is checked — permanently closed places
 * are returned flagged `permanentlyClosed: true` (UI shows the closed
 * message), drafts stay hidden (null).
 */
export async function getPlace(id: string): Promise<ConsumerPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    return mapRowToConsumerPlace(data as unknown as ConsumerPlaceQueryRow);
  }

  // Not published — check for a permanently closed place (RLS hides it).
  const admin = createAdminClient();
  const { data: hidden, error: hiddenError } = await admin
    .from("places")
    .select(PLACE_SELECT)
    .eq("id", id)
    .eq("status", "permanently_closed")
    .maybeSingle();
  if (hiddenError) throw new Error(hiddenError.message);
  if (!hidden) return null;

  return mapRowToConsumerPlace(hidden as unknown as ConsumerPlaceQueryRow);
}

/** Escapes %, _ and \ for use inside an ilike pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => "\\" + ch);
}

/**
 * Search ported from the prototype's haystack match: published places
 * matching name/area/station/cuisine/vibe/type label, PLUS permanently
 * closed places matching by name (fetched with the admin client and
 * flagged `permanentlyClosed: true` so the UI shows
 * 'This place is permanently closed.').
 */
export async function searchPlaces(q: string): Promise<ConsumerPlace[]> {
  const query = q.trim().toLowerCase();
  if (!query) return [];

  const [published, closed] = await Promise.all([
    getPublishedPlaces(),
    (async () => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("places")
        .select(PLACE_SELECT)
        .eq("status", "permanently_closed")
        .ilike("name", `%${escapeLike(query)}%`)
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as ConsumerPlaceQueryRow[]).map(
        mapRowToConsumerPlace
      );
    })(),
  ]);

  const matches = published.filter((p) =>
    [
      p.name,
      p.area ?? "",
      p.station ?? "",
      ...p.cuisines,
      ...p.vibes,
      GOBBLE_TYPES[p.type].label,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );

  return [...matches, ...closed];
}

/** Active filter options grouped by category (admin edits show on reload). */
export async function getActiveFilterOptions(): Promise<{
  cuisine: string[];
  vibe: string[];
  area: string[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("filter_options")
    .select("category, label, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const grouped: Record<FilterCategory, string[]> = {
    cuisine: [],
    vibe: [],
    area: [],
  };
  for (const row of (data ?? []) as Pick<
    FilterOptionRow,
    "category" | "label" | "sort_order"
  >[]) {
    grouped[row.category].push(row.label);
  }
  return grouped;
}
