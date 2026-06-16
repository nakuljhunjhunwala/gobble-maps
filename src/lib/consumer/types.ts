// Gobble Maps consumer — view types shared by consumer screens.
// DB row types live in @/lib/types (read-only import allowed).

import type { HoursJson, MealSlot, PlaceType } from "@/lib/types";

export type { HoursJson, MealSlot, PlaceType };

export interface ConsumerRatings {
  food: number;
  service: number;
  ambience: number;
  avg: number;
}

/**
 * Flattened, consumer-facing place shape (mirrors the prototype's
 * GOBBLE_PLACES entries, backed by real Supabase rows).
 */
export interface ConsumerPlace {
  id: string;
  name: string;
  type: PlaceType;
  cuisines: string[];
  vibes: string[];
  area: string | null;
  budget: number;
  station: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  hours: HoursJson | null;
  lat: number | null;
  lng: number | null;
  visited: boolean;
  ratings: ConsumerRatings | null;
  mustTry: string[];
  note: string | null;
  bestTime: string | null;
  liveMusic: boolean;
  boardGames: boolean;
  pureVeg: boolean;
  meals: MealSlot[];
  /** Instagram / YouTube / other reel URLs attached to the place. */
  reels: string[];
  /** Storage paths in the `place-photos` bucket, sorted by sort_order. */
  photoPaths: string[];
  /** Deterministic 0–360 hue derived from the place id (placeholder art). */
  hue: number;
  permanentlyClosed: boolean;
}
