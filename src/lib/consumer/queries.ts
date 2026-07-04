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
    zomato: row.zomato,
    swiggy: row.swiggy,
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
    reels: row.reels ?? [],
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
 * cache(): deduped across generateMetadata + page within one request.
 */
export const getPlace = cache(
  async (id: string): Promise<ConsumerPlace | null> => {
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
);

/** Escapes %, _ and \ for use inside an ilike pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => "\\" + ch);
}

// Words to ignore when tokenising a free-text query.
const STOPWORDS = new Set([
  "a", "an", "the", "in", "at", "on", "for", "to", "of", "and", "or", "with",
  "near", "me", "some", "good", "best", "place", "places", "spot", "spots",
  "food", "restaurant", "restaurants", "eat", "out", "go", "going",
]);

/**
 * Intent / synonym expansion: a query token also matches these extra terms,
 * so "date night" finds Romantic spots, "drinks" finds breweries/bars,
 * "veg" finds pure-veg places, "cheap" finds low budget, etc. Keys are
 * matched as substrings of a token (so "romantic" also covers "romance").
 */
const SYNONYMS: Record<string, string[]> = {
  date: ["romantic"], night: ["romantic", "party", "club"], romance: ["romantic"],
  couple: ["romantic"], anniversary: ["romantic"], candle: ["romantic"],
  work: ["work friendly"], laptop: ["work friendly"], wifi: ["work friendly"],
  cowork: ["work friendly"], meeting: ["work friendly"], study: ["work friendly"],
  drink: ["brewery", "club", "beer", "cocktail"], drinks: ["brewery", "club"],
  beer: ["brewery"], pub: ["brewery", "club"], bar: ["club"], pint: ["brewery"],
  cocktail: ["club"], party: ["party", "club"], dance: ["club", "party"],
  coffee: ["café", "cafe"], cafe: ["café"], chai: ["café"], espresso: ["café"],
  veg: ["pure veg"], vegetarian: ["pure veg"], jain: ["pure veg"],
  cheap: ["budget1", "budget2"], budget: ["budget1", "budget2"],
  affordable: ["budget1", "budget2"], pocket: ["budget1", "budget2"],
  fancy: ["budget4", "budget5"], expensive: ["budget4", "budget5"],
  upscale: ["budget4", "budget5"], luxury: ["budget5"], premium: ["budget4", "budget5"],
  fine: ["budget4", "budget5"], splurge: ["budget5"],
  game: ["board games"], games: ["board games"], boardgame: ["board games"],
  music: ["live music"], live: ["live music"], gig: ["live music"], band: ["live music"],
  sweet: ["desserts", "bakery"], dessert: ["desserts", "bakery"], cake: ["bakery"],
  bakery: ["bakery"], pastry: ["bakery"], ice: ["desserts"],
  family: ["family dining"], kids: ["family dining"],
  insta: ["instagrammable"], aesthetic: ["instagrammable"], photo: ["instagrammable"],
  breakfast: ["breakfast"], brunch: ["brunch"], lunch: ["lunch"],
  dinner: ["dinner", "romantic"], street: ["street food"],
  japanese: ["japanese", "sushi", "ramen"], sushi: ["japanese"], ramen: ["japanese"],
  italian: ["italian", "pasta", "pizza"], pasta: ["italian"], pizza: ["italian"],
  dosa: ["south indian"], idli: ["south indian"], chinese: ["chinese"],
};

/** A labelled searchable field, used both for scoring and for explaining why
 *  a place matched (the "why" line in search results). */
interface SearchField {
  kind:
    | "name"
    | "cuisine"
    | "vibe"
    | "area"
    | "type"
    | "meal"
    | "dish"
    | "note"
    | "feature"
    | "budget";
  text: string;
  /** Human-readable reason shown to the user (null = don't surface). */
  reason: string | null;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner",
  brunch: "Brunch", party: "Party / nightlife",
};

/** Build the labelled field list for a place (scoring + match explanations). */
function buildSearchFields(p: ConsumerPlace): SearchField[] {
  const fields: SearchField[] = [
    { kind: "name", text: p.name, reason: null },
    { kind: "type", text: GOBBLE_TYPES[p.type].label, reason: GOBBLE_TYPES[p.type].label },
    ...p.cuisines.map((c): SearchField => ({ kind: "cuisine", text: c, reason: c })),
    ...p.vibes.map((v): SearchField => ({ kind: "vibe", text: v, reason: v })),
    ...p.mustTry.map((d): SearchField => ({ kind: "dish", text: d, reason: `Must-try: ${d}` })),
    ...p.meals.map((m): SearchField => ({ kind: "meal", text: m, reason: MEAL_LABEL[m] ?? null })),
  ];
  if (p.area) fields.push({ kind: "area", text: p.area, reason: `In ${p.area}` });
  if (p.station) fields.push({ kind: "area", text: p.station, reason: `Near ${p.station}` });
  if (p.note) fields.push({ kind: "note", text: p.note, reason: null }); // reason built as a snippet
  fields.push({
    kind: "budget",
    text: `budget${p.budget}`,
    reason: p.budget <= 2 ? "Budget-friendly" : p.budget >= 4 ? "Premium" : null,
  });
  if (p.pureVeg) fields.push({ kind: "feature", text: "pure veg vegetarian", reason: "Pure veg" });
  if (p.liveMusic) fields.push({ kind: "feature", text: "live music", reason: "Live music" });
  if (p.boardGames) fields.push({ kind: "feature", text: "board games", reason: "Board games" });
  return fields;
}

/** Extract a short "…matched phrase…" snippet from a note around `variant`. */
function noteSnippet(note: string, variant: string): string {
  const lower = note.toLowerCase();
  const idx = lower.indexOf(variant);
  if (idx === -1) return `“${note.slice(0, 60).trim()}…”`;
  const start = Math.max(0, idx - 28);
  const end = Math.min(note.length, idx + variant.length + 28);
  let snip = note.slice(start, end).trim();
  if (start > 0) snip = "…" + snip;
  if (end < note.length) snip = snip + "…";
  return `“${snip}”`;
}

// Reason priority — note snippets and vibes are the most useful to surface.
const REASON_PRIORITY: Record<SearchField["kind"], number> = {
  note: 0, vibe: 1, cuisine: 2, dish: 3, feature: 4,
  type: 5, meal: 6, area: 7, budget: 8, name: 9,
};

/** Split a query into meaningful tokens, dropping stopwords. */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9çé]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** A search result with the reasons it matched the query (the "why" line). */
export interface SearchResult extends ConsumerPlace {
  matchReasons: string[];
}

/**
 * Flexible, context-aware search. Tokenises the query, expands each token
 * with intent synonyms, and scores published places by how many tokens hit
 * their labelled fields (partial/substring match across name, cuisine, vibe,
 * area, type, meals, must-try dishes, the curator's note, budget and
 * features). Each result carries `matchReasons` explaining the match
 * (e.g. a snippet of the note that mentioned "date night"). Ranks by score,
 * then visited, then rating. Permanently-closed name matches are appended so
 * the UI can show "This place is permanently closed."
 */
export async function searchPlaces(q: string): Promise<SearchResult[]> {
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

  const tokens = tokenize(query);
  // Fall back to the raw query as one token (e.g. a single short word).
  const baseTokens = tokens.length ? tokens : [query];

  // Expand each token with its synonyms; keep the token's own variants too.
  const tokenGroups = baseTokens.map((t) => {
    const group = new Set<string>([t]);
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (t.includes(key) || key.includes(t)) syns.forEach((s) => group.add(s));
    }
    return [...group];
  });

  const scored = published
    .map((p) => {
      const fields = buildSearchFields(p);
      let score = 0;
      // Collect the best (highest-priority) reason field per matched group.
      const picked: SearchField[] = [];
      const pickedVariant: string[] = [];

      for (const group of tokenGroups) {
        let best: SearchField | null = null;
        let bestVariant = "";
        for (const field of fields) {
          const ftext = field.text.toLowerCase();
          const variant = group.find((v) => ftext.includes(v));
          if (!variant) continue;
          if (!best || REASON_PRIORITY[field.kind] < REASON_PRIORITY[best.kind]) {
            best = field;
            bestVariant = variant;
          }
        }
        if (best) {
          score += 1;
          if (best.kind === "name") score += 1; // name match is a strong signal
          picked.push(best);
          pickedVariant.push(bestVariant);
        }
      }

      // Build deduped, priority-ordered human reasons. Single-instance kinds
      // (note/area/type/budget/feature) collapse to one reason each so e.g.
      // "board game night" doesn't print three near-identical note snippets.
      const reasons: string[] = [];
      const seen = new Set<string>();
      const singleInstance = new Set(["note", "area", "type", "budget", "feature"]);
      const usedKinds = new Set<string>();
      const order = picked
        .map((f, i) => ({ f, v: pickedVariant[i] }))
        .sort((a, b) => REASON_PRIORITY[a.f.kind] - REASON_PRIORITY[b.f.kind]);
      for (const { f, v } of order) {
        if (singleInstance.has(f.kind) && usedKinds.has(f.kind)) continue;
        const reason =
          f.kind === "note" && p.note ? noteSnippet(p.note, v) : f.reason;
        if (reason && !seen.has(reason)) {
          seen.add(reason);
          usedKinds.add(f.kind);
          reasons.push(reason);
        }
        if (reasons.length >= 3) break;
      }

      return { p, score, reasons };
    })
    // Require at least one token group to match.
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.p.visited) - Number(a.p.visited) ||
        (b.p.ratings?.avg ?? 0) - (a.p.ratings?.avg ?? 0) ||
        a.p.name.localeCompare(b.p.name)
    )
    .map((s): SearchResult => ({ ...s.p, matchReasons: s.reasons }));

  return [...scored, ...closed.map((p): SearchResult => ({ ...p, matchReasons: [] }))];
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
