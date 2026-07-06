// Gobble Admin — mapping between place rows and CSV columns.
// Single source of truth for the CSV shape used by export (route) and
// import (server action). Server- and client-safe (pure).

import { DAY_KEYS } from "@/lib/types";
import type {
  FilterCategory,
  HoursJson,
  MealSlot,
  PlaceStatus,
  PlaceType,
  PlaceWithRelations,
} from "@/lib/types";
import { photoUrl } from "@/lib/admin/format";

// Column order for export; also the accepted import headers (order-independent
// on import — matched by name). Export-only columns are noted below.
export const PLACE_CSV_HEADERS = [
  "id",
  "name",
  "type",
  "status",
  "visited",
  "budget",
  "area",
  "cuisines",
  "vibes",
  "meals",
  "food_rating",
  "service_rating",
  "ambience_rating",
  "avg_rating", // export-only (generated)
  "must_try",
  "curator_note",
  "best_time",
  "phone",
  "instagram",
  "website",
  "zomato",
  "swiggy",
  "address",
  "station",
  "lat",
  "lng",
  "live_music",
  "board_games",
  "pure_veg",
  "reels",
  "hours",
  "photo_urls", // export-only
  "created_at", // export-only
  "updated_at", // export-only
] as const;

const DAY_LABEL: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const LIST_SEP = " | ";

export function joinList(values: string[]): string {
  return values.join(LIST_SEP);
}

export function splitList(value: string): string[] {
  return value
    .split("|")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function parseBool(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

/** Empty → null; unparseable → null; else the number. */
export function parseNumOrNull(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

// ── Hours encode / parse ─────────────────────────────────────

/** "Mon 12:30-23:30 | Tue closed | …" (all seven days, closed included). */
export function encodeHours(hours: HoursJson | null): string {
  return DAY_KEYS.map((d) => {
    const slot = hours?.[d];
    return slot ? `${DAY_LABEL[d]} ${slot.open}-${slot.close}` : `${DAY_LABEL[d]} closed`;
  }).join(LIST_SEP);
}

function padTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t.trim();
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** Parse the readable hours format; unknown/missing days become closed (null). */
export function parseHours(value: string): HoursJson {
  const out = {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  } as HoursJson;
  const text = value.trim();
  if (!text) return out;

  for (const token of text.split("|")) {
    const t = token.trim();
    if (!t) continue;
    const m = t.match(/^([A-Za-z]{3})[A-Za-z]*\s+(.+)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const day = DAY_KEYS.find((d) => d === key);
    if (!day) continue;
    const rest = m[2].trim();
    if (/closed/i.test(rest)) {
      out[day] = null;
      continue;
    }
    const hm = rest.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (hm) {
      out[day] = { open: padTime(hm[1]), close: padTime(hm[2]) };
    }
  }
  return out;
}

// ── Export: place → row ──────────────────────────────────────

export function placeToCsvRow(place: PlaceWithRelations): string[] {
  const cuisines = place.tags
    .filter((t) => t.category === "cuisine")
    .map((t) => t.label);
  const vibes = place.tags.filter((t) => t.category === "vibe").map((t) => t.label);

  const cell: Record<(typeof PLACE_CSV_HEADERS)[number], string> = {
    id: place.id,
    name: place.name,
    type: place.type,
    status: place.status,
    visited: String(place.visited),
    budget: String(place.budget),
    area: place.area?.label ?? "",
    cuisines: joinList(cuisines),
    vibes: joinList(vibes),
    meals: joinList(place.meals),
    food_rating: place.food_rating == null ? "" : String(place.food_rating),
    service_rating:
      place.service_rating == null ? "" : String(place.service_rating),
    ambience_rating:
      place.ambience_rating == null ? "" : String(place.ambience_rating),
    avg_rating: place.avg_rating == null ? "" : String(place.avg_rating),
    must_try: joinList(place.must_try ?? []),
    curator_note: place.curator_note ?? "",
    best_time: place.best_time ?? "",
    phone: place.phone ?? "",
    instagram: place.instagram ?? "",
    website: place.website ?? "",
    zomato: place.zomato ?? "",
    swiggy: place.swiggy ?? "",
    address: place.address ?? "",
    station: place.station ?? "",
    lat: place.lat == null ? "" : String(place.lat),
    lng: place.lng == null ? "" : String(place.lng),
    live_music: String(place.live_music),
    board_games: String(place.board_games),
    pure_veg: String(place.pure_veg),
    reels: joinList(place.reels ?? []),
    hours: encodeHours(place.hours),
    photo_urls: joinList(
      [...place.photos]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => photoUrl(p.storage_path))
    ),
    created_at: place.created_at ?? "",
    updated_at: (place as { updated_at?: string }).updated_at ?? "",
  };

  return PLACE_CSV_HEADERS.map((h) => cell[h]);
}

// ── Import: row → place input ────────────────────────────────

const VALID_MEALS: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "brunch",
  "party",
];

export interface CsvPlaceRaw {
  /** Present only when the row carries a valid-looking id. */
  id?: string;
  name: string;
  type: PlaceType;
  intendedStatus: PlaceStatus;
  visited: boolean;
  budget: number;
  areaId: string | null;
  station: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  instagram: string;
  website: string;
  zomato: string;
  swiggy: string;
  hours: HoursJson;
  meals: MealSlot[];
  tagIds: string[];
  foodRating: number | null;
  serviceRating: number | null;
  ambienceRating: number | null;
  mustTry: string[];
  curatorNote: string;
  bestTime: string;
  liveMusic: boolean;
  boardGames: boolean;
  pureVeg: boolean;
  reels: string[];
  photoCount: number;
}

/** Resolves a cuisine/vibe/area label to a filter_options id (case-insensitive). */
export type TagResolver = (
  category: FilterCategory,
  label: string
) => string | undefined;

/**
 * Build the raw place object (pre-Zod) from a header-keyed CSV record.
 * Values are coerced but NOT validated — the caller runs placeSchema so bad
 * rows surface real messages. Import never manages photos → photoCount 0.
 */
export function csvRowToPlaceInput(
  record: Record<string, string>,
  resolve: TagResolver
): CsvPlaceRaw {
  const get = (k: string) => (record[k] ?? "").trim();

  const areaLabel = get("area");
  const cuisineIds = splitList(get("cuisines"))
    .map((l) => resolve("cuisine", l))
    .filter((id): id is string => Boolean(id));
  const vibeIds = splitList(get("vibes"))
    .map((l) => resolve("vibe", l))
    .filter((id): id is string => Boolean(id));

  const meals = splitList(get("meals"))
    .map((m) => m.toLowerCase())
    .filter((m): m is MealSlot => (VALID_MEALS as string[]).includes(m));

  const idRaw = get("id");

  return {
    id: idRaw || undefined,
    name: get("name"),
    // Cast — placeSchema validates the enum and reports invalid values.
    type: get("type").toLowerCase() as PlaceType,
    intendedStatus: (get("status").toLowerCase() || "draft") as PlaceStatus,
    visited: parseBool(get("visited")),
    budget: Number(get("budget")),
    areaId: areaLabel ? resolve("area", areaLabel) ?? null : null,
    station: get("station"),
    address: get("address"),
    lat: parseNumOrNull(get("lat")),
    lng: parseNumOrNull(get("lng")),
    phone: get("phone"),
    instagram: get("instagram"),
    website: get("website"),
    zomato: get("zomato"),
    swiggy: get("swiggy"),
    hours: parseHours(get("hours")),
    meals,
    tagIds: [...cuisineIds, ...vibeIds],
    foodRating: parseNumOrNull(get("food_rating")),
    serviceRating: parseNumOrNull(get("service_rating")),
    ambienceRating: parseNumOrNull(get("ambience_rating")),
    mustTry: splitList(get("must_try")),
    curatorNote: get("curator_note"),
    bestTime: get("best_time"),
    liveMusic: parseBool(get("live_music")),
    boardGames: parseBool(get("board_games")),
    pureVeg: parseBool(get("pure_veg")),
    reels: splitList(get("reels")),
    photoCount: 0,
  };
}
