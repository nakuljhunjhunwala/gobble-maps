/**
 * Gobble Maps — idempotent database seed.
 *
 * Run with:  npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local.
 * Safe to re-run: every step upserts on stable ids / skips existing rows.
 * Never prints the secret key.
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomInt } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type {
  DayKey,
  HoursJson,
  MealSlot,
  PlaceStatus,
  PlaceType,
} from "../src/lib/types";

// ── Env loading (.env.local, parsed manually — dotenv not installed) ──

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = resolve(ROOT, ".env.local");

function loadEnvLocal(): void {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local"
  );
  process.exit(1);
}

const db: SupabaseClient = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ──────────────────────────────────────────────────

function fail(step: string, error: { message: string } | null): void {
  if (error) throw new Error(`[seed:${step}] ${error.message}`);
}

/** Deterministic seed UUIDs so re-runs upsert instead of duplicating. */
function uid(prefix: string, n: number): string {
  return `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
// JS Date#getDay numbering (0 = Sunday), matching design/gobble/data.js closedDays
const JS_DAY: Record<DayKey, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};

function decToTime(v: number): string {
  const total = Math.round((v % 24) * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Translate prototype open/close decimals + closedDays into the hours jsonb shape. */
function toHours(open: number, close: number, closedDays: number[]): HoursJson {
  const hours = {} as HoursJson;
  const allClosed = open === 0 && close === 0;
  for (const day of DAY_KEYS) {
    hours[day] =
      allClosed || closedDays.includes(JS_DAY[day])
        ? null
        : { open: decToTime(open), close: decToTime(close) };
  }
  return hours;
}

function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// ── Seed data ────────────────────────────────────────────────

const CUISINES = [
  "North Indian",
  "South Indian",
  "Japanese",
  "Chinese",
  "Asian",
  "Italian",
  "Desserts",
  "Multi-Cuisine",
];
const VIBES = [
  "Romantic",
  "Family Dining",
  "Party",
  "Work Friendly",
  "Board Games",
  "Instagrammable",
];
const AREAS = [
  "Andheri West",
  "Juhu",
  "Khar West",
  "Bandra West",
  "BKC",
  "Powai",
  "Matunga",
  "Dadar",
  "Lower Parel",
  "Worli",
  "Fort",
  "Churchgate",
  "Colaba",
];

interface SeedPlace {
  n: number;
  slug: string;
  name: string;
  type: PlaceType;
  cuisines: string[];
  vibes: string[];
  budget: number;
  area: string;
  station: string;
  address: string;
  phone: string;
  insta: string;
  open: number;
  close: number;
  closedDays: number[];
  visited: boolean;
  ratings: { food: number; service: number; ambience: number } | null;
  mustTry: string[];
  note: string | null;
  bestTime: string | null;
  liveMusic: boolean;
  boardGames: boolean;
  pureVeg: boolean;
  meals: MealSlot[];
  lat: number;
  lng: number;
  photos: number;
  status: PlaceStatus;
}

const PLACES: SeedPlace[] = [
  {
    n: 1, slug: "koyo", name: "Koyo", type: "restaurant",
    cuisines: ["Japanese", "Asian"], vibes: ["Romantic", "Instagrammable"],
    budget: 4, area: "Bandra West", station: "Bandra",
    address: "14 Chapel Road, Ranwar Village, Bandra West",
    phone: "+91 98200 11223", insta: "koyo.bombay",
    open: 12.5, close: 23.5, closedDays: [], visited: true,
    ratings: { food: 4.5, service: 4, ambience: 5 },
    mustTry: ["Miso black cod", "Truffle edamame gyoza", "Yuzu cheesecake"],
    note: "Ask for the counter seats facing the open kitchen — the chefs hand you bites between courses. Portions are small, order generously.",
    bestTime: "Weeknights after 8 PM, when the lights dim",
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ["dinner"], lat: 19.0547, lng: 72.827, photos: 5, status: "published",
  },
  {
    n: 2, slug: "tatva", name: "Tatva Tiffin Room", type: "cafe",
    cuisines: ["South Indian"], vibes: ["Family Dining", "Work Friendly"],
    budget: 1, area: "Matunga", station: "Matunga Road",
    address: "Shop 3, Bhandarkar Road, Matunga East",
    phone: "+91 98331 40404", insta: "tatvatiffinroom",
    open: 7, close: 21.5, closedDays: [], visited: true,
    ratings: { food: 5, service: 4.5, ambience: 3.5 },
    mustTry: ["Ghee podi idli", "Benne dosa", "Filter coffee (ask for strong)"],
    note: "Go before 9 AM on weekends or expect a 30-minute wait. Cash and UPI only.",
    bestTime: "Weekday breakfasts, 7–9 AM",
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ["breakfast", "lunch"], lat: 19.027, lng: 72.8553, photos: 4, status: "published",
  },
  {
    n: 3, slug: "saltwater", name: "Salt Water Deck", type: "restaurant",
    cuisines: ["Multi-Cuisine"], vibes: ["Romantic", "Instagrammable"],
    budget: 5, area: "Worli", station: "Mahalaxmi",
    address: "Sea Face Road, Worli Sea Face",
    phone: "+91 99300 77881", insta: "saltwaterdeck",
    open: 12, close: 25, closedDays: [1], visited: true,
    ratings: { food: 4, service: 4.5, ambience: 5 },
    mustTry: ["Lobster thermidor", "Burrata & slow tomatoes", "Smoked old fashioned"],
    note: "Reserve a deck-edge table for sunset — the sea-link view is the whole point. Skip dessert, walk the sea face instead.",
    bestTime: "Golden hour, 6:30–7:30 PM",
    liveMusic: true, boardGames: false, pureVeg: false,
    meals: ["dinner", "brunch"], lat: 19.0176, lng: 72.8151, photos: 6, status: "published",
  },
  {
    n: 4, slug: "brewdock", name: "Brewdock BKC", type: "brewery",
    cuisines: ["Multi-Cuisine"], vibes: ["Party", "Board Games"],
    budget: 3, area: "BKC", station: "Bandra",
    address: "Unit 4, G Block, Bandra Kurla Complex",
    phone: "+91 98700 55512", insta: "brewdockbkc",
    open: 12, close: 25.5, closedDays: [], visited: true,
    ratings: { food: 3.5, service: 4, ambience: 4.5 },
    mustTry: ["Mango wheat ale (seasonal)", "Beer-battered bhavnagri chillies", "Smash burger"],
    note: "Tuesdays are board-game nights — shelves by the bar, free to borrow. The wheat ale runs out by 10 PM on weekends.",
    bestTime: "Friday & Saturday after 9 PM",
    liveMusic: true, boardGames: true, pureVeg: false,
    meals: ["dinner", "party"], lat: 19.0653, lng: 72.8693, photos: 5, status: "published",
  },
  {
    n: 5, slug: "cinnamon", name: "Cinnamon & Co.", type: "bakery",
    cuisines: ["Desserts"], vibes: ["Instagrammable", "Work Friendly"],
    budget: 2, area: "Bandra West", station: "Bandra",
    address: "21 Waroda Road, Bandra West",
    phone: "+91 98209 33445", insta: "cinnamonandco.in",
    open: 8, close: 22, closedDays: [], visited: true,
    ratings: { food: 4.5, service: 3.5, ambience: 4.5 },
    mustTry: ["Sticky cinnamon knot", "Basque cheesecake slice", "Iced Vietnamese coffee"],
    note: "Cinnamon knots sell out by noon. The two window seats are the best work spots in Bandra.",
    bestTime: "Weekday mornings, 8–10 AM",
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ["breakfast", "brunch"], lat: 19.052, lng: 72.833, photos: 4, status: "published",
  },
  {
    n: 6, slug: "annas", name: "Anna's Dosa Cart", type: "street",
    cuisines: ["South Indian"], vibes: ["Family Dining"],
    budget: 1, area: "Churchgate", station: "Churchgate",
    address: "Opp. Eros Building, Churchgate",
    phone: "+91 99204 88776", insta: "annasdosacart",
    open: 7, close: 16, closedDays: [0], visited: true,
    ratings: { food: 5, service: 4, ambience: 3 },
    mustTry: ["Ghee roast dosa", "Sabudana vada (limited, before 11 AM)"],
    note: "Anna remembers regulars' orders. Stand on the left side of the cart — it's the fast lane.",
    bestTime: "Office lunch rush, 12:30–2 PM, for the theatre of it",
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ["breakfast", "lunch"], lat: 18.9322, lng: 72.8264, photos: 4, status: "published",
  },
  {
    n: 7, slug: "velvet", name: "The Velvet Room", type: "club",
    cuisines: ["Asian", "Multi-Cuisine"], vibes: ["Party", "Instagrammable"],
    budget: 4, area: "Lower Parel", station: "Lower Parel",
    address: "Level 3, Mathuradas Mills Compound, Lower Parel",
    phone: "+91 98198 22001", insta: "thevelvetroom.mum",
    open: 20, close: 27, closedDays: [1, 2], visited: true,
    ratings: { food: 3.5, service: 4, ambience: 5 },
    mustTry: ["Lychee & chilli martini", "Korean fried cauliflower"],
    note: "Thursdays = live jazz, weekends = house. Get on the list via their Instagram DMs to skip the queue.",
    bestTime: "Thursday nights for jazz, after 10 PM",
    liveMusic: true, boardGames: false, pureVeg: false,
    meals: ["party"], lat: 18.9936, lng: 72.8262, photos: 5, status: "published",
  },
  {
    n: 8, slug: "mamawong", name: "Mama Wong", type: "restaurant",
    cuisines: ["Chinese", "Asian"], vibes: ["Family Dining"],
    budget: 2, area: "Powai", station: "Kanjurmarg",
    address: "Central Avenue, Hiranandani Gardens, Powai",
    phone: "+91 98675 11890", insta: "mamawongpowai",
    open: 11.5, close: 23, closedDays: [], visited: true,
    ratings: { food: 4.5, service: 4, ambience: 3.5 },
    mustTry: ["Hand-pulled dan dan noodles", "Crystal prawn dumplings", "Burnt garlic fried rice"],
    note: 'Order the noodles "Mama spicy" only if you mean it. Big portions — two mains feed three.',
    bestTime: "Sunday family lunches",
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ["lunch", "dinner"], lat: 19.1187, lng: 72.9073, photos: 4, status: "published",
  },
  {
    n: 9, slug: "sodade", name: "Caffè Sodade", type: "cafe",
    cuisines: ["Italian", "Desserts"], vibes: ["Work Friendly", "Romantic"],
    budget: 2, area: "Fort", station: "CSMT",
    address: "Ground Floor, Kala Ghoda, Fort",
    phone: "+91 99877 60504", insta: "caffesodade",
    open: 8.5, close: 23, closedDays: [], visited: true,
    ratings: { food: 4, service: 4.5, ambience: 4.5 },
    mustTry: ["Tiramisu in a jar", "Mushroom truffle toast", "Affogato"],
    note: "Quiet until 5 PM, then gallery crowd rolls in. Plug points at every table along the brick wall.",
    bestTime: "Weekday afternoons with a laptop",
    liveMusic: false, boardGames: true, pureVeg: false,
    meals: ["breakfast", "lunch", "brunch"], lat: 18.9282, lng: 72.8323, photos: 5, status: "published",
  },
  {
    n: 10, slug: "gully", name: "Gully Tandoor", type: "restaurant",
    cuisines: ["North Indian"], vibes: ["Family Dining"],
    budget: 2, area: "Andheri West", station: "Andheri",
    address: "Lokhandwala Back Road, Andheri West",
    phone: "+91 98926 73310", insta: "gullytandoor",
    open: 12, close: 24.5, closedDays: [], visited: false,
    ratings: null, mustTry: [], note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ["dinner"], lat: 19.1409, lng: 72.8243, photos: 4, status: "published",
  },
  {
    n: 11, slug: "heitea", name: "Hēi Tea House", type: "cafe",
    cuisines: ["Asian", "Desserts"], vibes: ["Instagrammable", "Work Friendly"],
    budget: 3, area: "Juhu", station: "Vile Parle",
    address: "Juhu Tara Road, Juhu",
    phone: "+91 99302 18874", insta: "hei.teahouse",
    open: 10, close: 22, closedDays: [], visited: false,
    ratings: null, mustTry: [], note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ["brunch", "lunch"], lat: 19.0883, lng: 72.8264, photos: 4, status: "published",
  },
  {
    n: 12, slug: "pasta", name: "Pasta Per Favore", type: "restaurant",
    cuisines: ["Italian"], vibes: ["Romantic", "Family Dining"],
    budget: 3, area: "Khar West", station: "Khar Road",
    address: "5th Road, Khar West",
    phone: "+91 98203 45670", insta: "pastaperfavore",
    open: 12, close: 23.5, closedDays: [1], visited: true,
    ratings: { food: 4.5, service: 5, ambience: 4 },
    mustTry: ["Cacio e pepe (table-side)", "Wood-oven burrata pizza", "Panna cotta"],
    note: "The cacio e pepe is finished in a cheese wheel at your table — sit near the kitchen to watch. BYOB on weeknights.",
    bestTime: "Date nights, Tuesday–Thursday",
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: ["dinner", "brunch"], lat: 19.0686, lng: 72.8367, photos: 5, status: "published",
  },
  {
    n: 13, slug: "socialhouse", name: "Bombay Social House", type: "club",
    cuisines: ["Multi-Cuisine"], vibes: ["Party"],
    budget: 3, area: "Bandra West", station: "Bandra",
    address: "Hill Road, Bandra West", phone: "", insta: "",
    open: 0, close: 0, closedDays: [], visited: true,
    ratings: null, mustTry: [], note: null, bestTime: null,
    liveMusic: false, boardGames: false, pureVeg: false,
    meals: [], lat: 19.0568, lng: 72.8295, photos: 0, status: "permanently_closed",
  },
  {
    n: 14, slug: "draft-sip", name: "Sip & Saga", type: "cafe",
    cuisines: ["Desserts"], vibes: ["Work Friendly"],
    budget: 2, area: "Dadar", station: "Dadar",
    address: "Gokhale Road North, Dadar West",
    phone: "+91 98220 11447", insta: "sipandsaga",
    open: 9, close: 21, closedDays: [], visited: true,
    ratings: { food: 4, service: 4.5, ambience: 4 },
    mustTry: ["Bun maska crème brûlée", "Single-origin pour over"],
    note: "Photos pending — visited last Sunday.",
    bestTime: "Weekday mornings",
    liveMusic: false, boardGames: false, pureVeg: true,
    meals: ["breakfast"], lat: 19.0178, lng: 72.8478, photos: 2, status: "draft",
  },
];

const placeId = (slug: string): string => {
  const p = PLACES.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown place slug: ${slug}`);
  return uid("a", p.n);
};

const PROFILES = [
  { n: 1, username: "vada_pav_vigilante", joined: "2026-01-12", lastActiveDays: 0 },
  { n: 2, username: "bandra_bites", joined: "2026-02-03", lastActiveDays: 0 },
  { n: 3, username: "chai_pe_charcha", joined: "2026-02-18", lastActiveDays: 1 },
  { n: 4, username: "powai_paula", joined: "2026-03-02", lastActiveDays: 3 },
  { n: 5, username: "misal_missile", joined: "2026-03-21", lastActiveDays: 0 },
  { n: 6, username: "south.bombay.sue", joined: "2026-04-09", lastActiveDays: 7 },
  { n: 7, username: "dosa_daddy", joined: "2026-04-27", lastActiveDays: 1 },
  { n: 8, username: "late_night_lassi", joined: "2026-05-15", lastActiveDays: 0 },
];

const profileId = (username: string): string => {
  const p = PROFILES.find((x) => x.username === username);
  if (!p) throw new Error(`Unknown username: ${username}`);
  return uid("b", p.n);
};

// Rankings from the prototype dashboard (admin-data.js) — with 8 seed users
// we reproduce the ORDER, scaling counts 8 → 1.
const TOP_SAVED_ORDER = ["saltwater", "koyo", "velvet", "cinnamon", "pasta", "brewdock", "heitea", "mamawong", "sodade", "tatva"];
const TOP_VISITED_ORDER = ["tatva", "annas", "cinnamon", "sodade", "mamawong", "brewdock", "koyo", "pasta", "saltwater", "velvet"];

const SHARE_WEIGHTS: [string, number][] = [
  ["koyo", 96], ["saltwater", 91], ["velvet", 74], ["annas", 58], ["cinnamon", 51],
  ["brewdock", 44], ["pasta", 38], ["heitea", 27], ["sodade", 22], ["mamawong", 18],
];

const VIEW_WEIGHTS: [string, number][] = [
  ["koyo", 14], ["velvet", 12], ["saltwater", 10], ["cinnamon", 9], ["brewdock", 9],
  ["pasta", 8], ["sodade", 8], ["mamawong", 7], ["tatva", 7], ["annas", 6],
  ["gully", 5], ["heitea", 5],
];

const FILTER_WEIGHTS: [string, number][] = [
  ["Open now", 28], ["Vibe: Romantic", 20], ["Budget ★★", 17], ["Cuisine: Japanese", 14],
  ["Pure veg: Yes", 13], ["Area: Bandra West", 12], ["Live music: Yes", 8],
  ["Vibe: Party", 6], ["Cuisine: Italian", 5], ["Area: Powai", 4], ["Board games: Yes", 3],
];

// ── Steps ────────────────────────────────────────────────────

async function seedFilterOptions(): Promise<Map<string, string>> {
  console.log("→ filter_options");
  const rows = [
    ...CUISINES.map((label, i) => ({ category: "cuisine", label, sort_order: i, is_active: true })),
    ...VIBES.map((label, i) => ({ category: "vibe", label, sort_order: i, is_active: true })),
    ...AREAS.map((label, i) => ({ category: "area", label, sort_order: i, is_active: true })),
  ];
  const { error } = await db
    .from("filter_options")
    .upsert(rows, { onConflict: "category,label" });
  fail("filter_options", error);

  const { data, error: selError } = await db
    .from("filter_options")
    .select("id, category, label");
  fail("filter_options:select", selError);

  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(`${row.category}:${row.label}`, row.id);
  return map;
}

async function seedPlaces(options: Map<string, string>): Promise<void> {
  console.log("→ places + place_tags");
  const rows = PLACES.map((p) => ({
    id: uid("a", p.n),
    name: p.name,
    type: p.type,
    budget: p.budget,
    area_id: options.get(`area:${p.area}`) ?? null,
    station: p.station || null,
    address: p.address || null,
    lat: p.lat,
    lng: p.lng,
    phone: p.phone || null,
    instagram: p.insta || null,
    website: null,
    hours: toHours(p.open, p.close, p.closedDays),
    meals: p.meals,
    visited: p.visited,
    food_rating: p.ratings?.food ?? null,
    service_rating: p.ratings?.service ?? null,
    ambience_rating: p.ratings?.ambience ?? null,
    must_try: p.mustTry,
    curator_note: p.note,
    best_time: p.bestTime,
    live_music: p.liveMusic,
    board_games: p.boardGames,
    pure_veg: p.pureVeg,
    status: p.status,
  }));
  const { error } = await db.from("places").upsert(rows, { onConflict: "id" });
  fail("places", error);

  const tagRows: { place_id: string; filter_option_id: string }[] = [];
  for (const p of PLACES) {
    for (const c of p.cuisines) {
      const id = options.get(`cuisine:${c}`);
      if (id) tagRows.push({ place_id: uid("a", p.n), filter_option_id: id });
    }
    for (const v of p.vibes) {
      const id = options.get(`vibe:${v}`);
      if (id) tagRows.push({ place_id: uid("a", p.n), filter_option_id: id });
    }
  }
  const { error: tagError } = await db
    .from("place_tags")
    .upsert(tagRows, { onConflict: "place_id,filter_option_id", ignoreDuplicates: true });
  fail("place_tags", tagError);
}

async function seedPhotos(): Promise<number> {
  console.log("→ storage bucket + photos");
  const BUCKET = "place-photos";
  const { error: getError } = await db.storage.getBucket(BUCKET);
  if (getError) {
    const { error: createError } = await db.storage.createBucket(BUCKET, { public: true });
    if (createError && !/already exists/i.test(createError.message)) {
      fail("storage:createBucket", createError);
    }
  }

  let uploaded = 0;
  const photoRows: { place_id: string; storage_path: string; sort_order: number }[] = [];

  for (const p of PLACES) {
    if (p.photos === 0) continue;
    const pid = uid("a", p.n);
    const { data: existing } = await db.storage.from(BUCKET).list(pid);
    const existingNames = new Set((existing ?? []).map((f) => f.name));

    for (let i = 1; i <= p.photos; i++) {
      const path = `${pid}/${i}.jpg`;
      photoRows.push({ place_id: pid, storage_path: path, sort_order: i });
      if (existingNames.has(`${i}.jpg`)) continue;

      const url = `https://picsum.photos/seed/${p.slug}-${i}/800/600`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  ! could not fetch ${url} (${res.status}) — skipped`);
        continue;
      }
      const body = await res.arrayBuffer();
      const { error: upError } = await db.storage
        .from(BUCKET)
        .upload(path, body, { contentType: "image/jpeg", upsert: false });
      if (upError && !/already exists|duplicate/i.test(upError.message)) {
        fail(`storage:upload:${path}`, upError);
      }
      uploaded++;
      process.stdout.write(`  uploaded ${p.slug} ${i}/${p.photos}\r`);
    }
  }

  const { error } = await db
    .from("place_photos")
    .upsert(photoRows, { onConflict: "storage_path" });
  fail("place_photos", error);
  console.log(`  ${uploaded} new photo(s) uploaded, ${photoRows.length} rows ensured`);
  return photoRows.length;
}

async function seedProfiles(): Promise<void> {
  console.log("→ profiles");
  const rows = PROFILES.map((p) => ({
    id: uid("b", p.n),
    username: p.username,
    pin_hash: bcrypt.hashSync(String(randomInt(100000, 1000000)), 10),
    mobile: `+91 98${String(10000000 + p.n * 1234567).slice(0, 8)}`,
    created_at: new Date(`${p.joined}T10:30:00+05:30`).toISOString(),
    last_active_at: daysAgo(p.lastActiveDays).toISOString(),
  }));
  const { error } = await db.from("profiles").upsert(rows, { onConflict: "id" });
  fail("profiles", error);
}

async function seedSavedPlaces(): Promise<void> {
  console.log("→ saved_places + lists");
  const saved: { user_id: string; place_id: string; kind: string }[] = [];

  TOP_SAVED_ORDER.forEach((slug, i) => {
    const count = Math.max(1, PROFILES.length - i); // 8,7,6,…,1
    for (let u = 0; u < count; u++) {
      saved.push({ user_id: uid("b", PROFILES[u].n), place_id: placeId(slug), kind: "wishlist" });
    }
  });
  TOP_VISITED_ORDER.forEach((slug, i) => {
    const count = Math.max(1, PROFILES.length - i);
    for (let u = 0; u < count; u++) {
      // offset users so been_there and wishlist overlap differs
      const user = PROFILES[(u + i) % PROFILES.length];
      saved.push({ user_id: uid("b", user.n), place_id: placeId(slug), kind: "been_there" });
    }
  });

  const { error } = await db
    .from("saved_places")
    .upsert(saved, { onConflict: "user_id,place_id,kind", ignoreDuplicates: true });
  fail("saved_places", error);

  const lists = [
    { id: uid("c", 1), user_id: profileId("vada_pav_vigilante"), name: "Date night spots", is_public: true, share_slug: "date-night-spots" },
    { id: uid("c", 2), user_id: profileId("powai_paula"), name: "Powai office lunches", is_public: false, share_slug: null },
    { id: uid("c", 3), user_id: profileId("south.bombay.sue"), name: "SoBo cafés", is_public: true, share_slug: "sobo-cafes" },
    { id: uid("c", 4), user_id: profileId("misal_missile"), name: "Big group dinners", is_public: false, share_slug: null },
  ];
  const { error: listError } = await db.from("lists").upsert(lists, { onConflict: "id" });
  fail("lists", listError);

  const listPlaces = [
    { list_id: uid("c", 1), place_id: placeId("koyo") },
    { list_id: uid("c", 1), place_id: placeId("saltwater") },
    { list_id: uid("c", 1), place_id: placeId("pasta") },
    { list_id: uid("c", 2), place_id: placeId("mamawong") },
    { list_id: uid("c", 3), place_id: placeId("sodade") },
    { list_id: uid("c", 3), place_id: placeId("annas") },
    { list_id: uid("c", 4), place_id: placeId("brewdock") },
    { list_id: uid("c", 4), place_id: placeId("gully") },
  ];
  const { error: lpError } = await db
    .from("list_places")
    .upsert(listPlaces, { onConflict: "list_id,place_id", ignoreDuplicates: true });
  fail("list_places", lpError);
}

async function seedReports(): Promise<void> {
  console.log("→ issue_reports");
  const rows = [
    {
      id: uid("d", 1041), place_id: placeId("gully"), place_name: "Gully Tandoor",
      reporter_username: "bandra_bites",
      text: "Phone number goes to a different restaurant now.",
      status: "open", created_at: "2026-06-10T11:20:00+05:30", resolved_at: null,
    },
    {
      id: uid("d", 1040), place_id: placeId("annas"), place_name: "Anna's Dosa Cart",
      reporter_username: "dosa_daddy",
      text: "Cart has moved ~200m, now opposite the station exit.",
      status: "open", created_at: "2026-06-09T09:05:00+05:30", resolved_at: null,
    },
    {
      id: uid("d", 1037), place_id: placeId("velvet"), place_name: "The Velvet Room",
      reporter_username: "misal_missile",
      text: "Closed for renovation till July, maybe mark temporarily closed?",
      status: "open", created_at: "2026-06-06T19:42:00+05:30", resolved_at: null,
    },
    {
      id: uid("d", 1029), place_id: placeId("heitea"), place_name: "Hēi Tea House",
      reporter_username: "south.bombay.sue",
      text: "Opening hours are wrong — they open at 11 AM, not 10.",
      status: "resolved", created_at: "2026-05-28T14:11:00+05:30", resolved_at: "2026-05-30T10:00:00+05:30",
    },
    {
      id: uid("d", 1022), place_id: placeId("socialhouse"), place_name: "Bombay Social House",
      reporter_username: "vada_pav_vigilante",
      text: "This place has shut down permanently.",
      status: "resolved", created_at: "2026-05-19T16:48:00+05:30", resolved_at: "2026-05-21T12:30:00+05:30",
    },
  ];
  const { error } = await db.from("issue_reports").upsert(rows, { onConflict: "id" });
  fail("issue_reports", error);
}

async function seedNotifications(options: Map<string, string>): Promise<void> {
  console.log("→ notifications");
  const rows = [
    {
      id: uid("e", 218), type: "new_place",
      message: "🍴 New spot on Gobble Maps! Pasta Per Favore in Khar West just dropped. Check it out!",
      place_id: placeId("pasta"), segment_area_id: null,
      status: "sent", scheduled_for: null, sent_at: "2026-06-02T18:00:00+05:30", recipient_count: 1284,
    },
    {
      id: uid("e", 217), type: "area_based",
      message: "📍 New place near your saved spots! Brewdock BKC just added in BKC.",
      place_id: placeId("brewdock"), segment_area_id: options.get("area:BKC") ?? null,
      status: "sent", scheduled_for: null, sent_at: "2026-05-24T18:00:00+05:30", recipient_count: 312,
    },
    {
      id: uid("e", 214), type: "manual",
      message: "Monsoon picks are live — 6 places worth getting wet for ☔",
      place_id: null, segment_area_id: null,
      status: "sent", scheduled_for: null, sent_at: "2026-05-11T18:00:00+05:30", recipient_count: 1151,
    },
  ];
  const { error } = await db.from("notifications").upsert(rows, { onConflict: "id" });
  fail("notifications", error);
}

async function seedTbt(): Promise<void> {
  console.log("→ to_be_tried");
  const rows = [
    {
      id: uid("f", 1), name: "Khichdi Experiment", address: "Versova, Andheri West",
      notes: "Three reels in one week — modern khichdi tasting menu. Suspicious but curious.",
      status: "pending_visit", created_at: "2026-06-08T12:00:00+05:30",
    },
    {
      id: uid("f", 2), name: "Bombil & Co.", address: "Ranade Road, Dadar West",
      notes: "Old-school Malvani place, recommended by Anna himself.",
      status: "pending_visit", created_at: "2026-06-04T12:00:00+05:30",
    },
    {
      id: uid("f", 3), name: "Cold Brew Koliwada", address: "Worli Koliwada",
      notes: "Café inside a fishing-village heritage home. Check weekend crowd.",
      status: "pending_visit", created_at: "2026-05-29T12:00:00+05:30",
    },
    {
      id: uid("f", 4), name: "The Idli Project", address: "Hiranandani, Powai",
      notes: "12 kinds of idli. Office-lunch potential for Powai crowd.",
      status: "pending_visit", created_at: "2026-05-21T12:00:00+05:30",
    },
  ];
  const { error } = await db.from("to_be_tried").upsert(rows, { onConflict: "id" });
  fail("to_be_tried", error);
}

async function seedAnalytics(): Promise<number> {
  console.log("→ analytics_events");
  const { count, error: countError } = await db
    .from("analytics_events")
    .select("*", { count: "exact", head: true });
  fail("analytics_events:count", countError);
  if ((count ?? 0) >= 3000) {
    console.log(`  ${count} events already present — skipping generation`);
    return 0;
  }

  const TOTAL = 3500;
  const DAYS = 30;

  // Day weights: recent days heavier, Fri–Sun heavier.
  const dayWeights: [number, number][] = [];
  for (let d = 0; d < DAYS; d++) {
    const dow = daysAgo(d).getDay();
    let w = 1 + (DAYS - d) / DAYS; // 1..2, weighted to recent
    if (dow === 5 || dow === 6 || dow === 0) w *= 1.6; // Fri-Sun
    dayWeights.push([d, w]);
  }

  const typeWeights: [string, number][] = [
    ["app_open", 40], ["map_open", 24], ["place_view", 21], ["filter_apply", 10], ["place_share", 5],
  ];

  const randomCreatedAt = (): string => {
    const d = pickWeighted(dayWeights);
    const dayStart = new Date(Date.now() - d * 86_400_000);
    dayStart.setHours(0, 0, 0, 0);
    let ts = dayStart.getTime() + Math.floor(Math.random() * 86_400_000);
    if (ts > Date.now()) ts = Date.now() - Math.floor(Math.random() * 3_600_000);
    return new Date(ts).toISOString();
  };

  const profileIds = PROFILES.map((p) => uid("b", p.n));
  const events: {
    event_type: string;
    user_id: string | null;
    place_id: string | null;
    metadata: Record<string, string>;
    created_at: string;
  }[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const eventType = pickWeighted(typeWeights);
    const userId =
      Math.random() < 0.85
        ? profileIds[Math.floor(Math.random() * profileIds.length)]
        : null;
    let pid: string | null = null;
    let metadata: Record<string, string> = {};
    if (eventType === "place_view") pid = placeId(pickWeighted(VIEW_WEIGHTS));
    if (eventType === "place_share") pid = placeId(pickWeighted(SHARE_WEIGHTS));
    if (eventType === "filter_apply") metadata = { filter: pickWeighted(FILTER_WEIGHTS) };
    events.push({
      event_type: eventType,
      user_id: userId,
      place_id: pid,
      metadata,
      created_at: randomCreatedAt(),
    });
  }

  for (let i = 0; i < events.length; i += 500) {
    const { error } = await db.from("analytics_events").insert(events.slice(i, i + 500));
    fail("analytics_events:insert", error);
    process.stdout.write(`  inserted ${Math.min(i + 500, events.length)}/${events.length}\r`);
  }
  console.log(`  inserted ${events.length} events                  `);
  return events.length;
}

async function bootstrapAdmin(): Promise<string> {
  console.log("→ admin bootstrap");
  const email = process.env.ADMIN_EMAIL ?? "dev@unicoconnect.com";
  let password = process.env.ADMIN_PASSWORD;
  const generated = !password;
  if (!password) password = randomBytes(18).toString("base64url");

  let userId: string | undefined;
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    // Likely already exists — find by email.
    const { data: list, error: listError } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    fail("auth:listUsers", listError);
    const existing = list.users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
    );
    if (!existing) {
      throw new Error(`[seed:admin] could not create or find auth user ${email}: ${createError.message}`);
    }
    userId = existing.id;
    if (generated) {
      // Keep the password we are about to write to .env.local valid.
      const { error: updError } = await db.auth.admin.updateUserById(userId, { password });
      fail("auth:updatePassword", updError);
    }
  } else {
    userId = created.user.id;
  }

  if (generated) {
    appendFileSync(ENV_PATH, `\nADMIN_EMAIL=${email}\nADMIN_PASSWORD=${password}\n`);
    console.log("  generated admin password and appended ADMIN_EMAIL/ADMIN_PASSWORD to .env.local");
  }

  const { error: adminError } = await db
    .from("admins")
    .upsert({ user_id: userId, email }, { onConflict: "user_id" });
  fail("admins", adminError);
  return email;
}

async function tableCount(table: string): Promise<number> {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  fail(`count:${table}`, error);
  return count ?? 0;
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Gobble Maps seed starting…\n");

  const options = await seedFilterOptions();
  await seedPlaces(options);
  await seedPhotos();
  await seedProfiles();
  await seedSavedPlaces();
  await seedReports();
  await seedNotifications(options);
  await seedTbt();
  await seedAnalytics();
  const adminEmail = await bootstrapAdmin();

  const tables = [
    "filter_options", "places", "place_tags", "place_photos", "profiles",
    "saved_places", "lists", "list_places", "issue_reports", "notifications",
    "to_be_tried", "analytics_events", "admins",
  ];
  const summary: Record<string, number> = {};
  for (const t of tables) summary[t] = await tableCount(t);

  console.log("\nSeed complete. Row counts:");
  console.table(
    Object.entries(summary).map(([table, rows]) => ({ table, rows }))
  );
  console.log(`Admin login: ${adminEmail} / password in .env.local`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
