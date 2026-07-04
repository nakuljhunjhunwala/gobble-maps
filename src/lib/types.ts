// Gobble Maps — database row types & enums.
// These mirror supabase/migrations/0001_init.sql exactly (snake_case columns).

// ── Enums ────────────────────────────────────────────────────

export type PlaceType =
  | "restaurant"
  | "cafe"
  | "club"
  | "bakery"
  | "street"
  | "brewery";

export type PlaceStatus = "draft" | "published" | "permanently_closed";

export type FilterCategory = "cuisine" | "vibe" | "area";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "brunch" | "party";

export type SavedKind = "been_there" | "wishlist";

export type ReportStatus = "open" | "resolved";

export type NotificationType = "new_place" | "area_based" | "manual";

export type NotificationStatus = "sent" | "scheduled";

export type TbtStatus = "pending_visit" | "visited";

export type AnalyticsEventType =
  | "app_open"
  | "map_open"
  | "place_view"
  | "place_share"
  | "place_save"
  | "filter_apply"
  | "search"
  | "signup";

// ── Opening hours jsonb shape ────────────────────────────────
// {"mon":{"open":"12:30","close":"23:30"},"tue":null,...}
// null = closed that day; close may run past midnight (e.g. "01:30").

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type HoursJson = Record<DayKey, { open: string; close: string } | null>;

export const DAY_KEYS: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

// ── Row types ────────────────────────────────────────────────

export interface AdminRow {
  user_id: string;
  email: string;
  created_at: string;
}

export interface FilterOptionRow {
  id: string;
  category: FilterCategory;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface PlaceRow {
  id: string;
  name: string;
  type: PlaceType;
  budget: number;
  area_id: string | null;
  station: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  zomato: string | null;
  swiggy: string | null;
  hours: HoursJson;
  meals: MealSlot[];
  visited: boolean;
  food_rating: number | null;
  service_rating: number | null;
  ambience_rating: number | null;
  /** Generated column: round((food + service + ambience) / 3, 1) when all present. */
  avg_rating: number | null;
  must_try: string[];
  curator_note: string | null;
  best_time: string | null;
  live_music: boolean;
  board_games: boolean;
  pure_veg: boolean;
  reels: string[];
  status: PlaceStatus;
  created_at: string;
  updated_at: string;
}

export interface PlaceTagRow {
  place_id: string;
  filter_option_id: string;
}

export interface PlacePhotoRow {
  id: string;
  place_id: string;
  storage_path: string;
  sort_order: number;
}

export interface PlaceWithRelations extends PlaceRow {
  photos: PlacePhotoRow[];
  tags: FilterOptionRow[];
  area: FilterOptionRow | null;
}

export interface ProfileRow {
  id: string;
  username: string;
  pin_hash: string;
  mobile: string | null;
  token_version: number;
  created_at: string;
  last_active_at: string | null;
}

export interface SavedPlaceRow {
  user_id: string;
  place_id: string;
  kind: SavedKind;
  created_at: string;
}

export interface ListRow {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  share_slug: string | null;
  created_at: string;
}

export interface ListPlaceRow {
  list_id: string;
  place_id: string;
  created_at: string;
}

export interface IssueReportRow {
  id: string;
  place_id: string | null;
  place_name: string;
  reporter_username: string;
  text: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface NotificationRow {
  id: string;
  type: NotificationType;
  message: string;
  place_id: string | null;
  segment_area_id: string | null;
  status: NotificationStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
}

export interface TbtRow {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
  status: TbtStatus;
  created_at: string;
}

export interface AnalyticsEventRow {
  id: number;
  event_type: AnalyticsEventType;
  user_id: string | null;
  place_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── admin_dashboard(p_from) RPC payload ──────────────────────

export interface DashboardDayPoint {
  /** YYYY-MM-DD */
  day: string;
  /** e.g. 'Fri' */
  label: string;
  count: number;
}

export interface DashboardTopPlace {
  id: string;
  name: string;
  count: number;
}

export interface DashboardPctEntry {
  label: string;
  /** Integer percent of total (0–100). */
  pct: number;
}

export interface DashboardCountEntry {
  label: string;
  count: number;
}

export interface AdminDashboardData {
  total_users: number;
  new_signups: number;
  dau: number;
  wau: number;
  mau: number;
  map_opens: number;
  shares: number;
  open_reports: number;
  map_opens_7d: DashboardDayPoint[];
  top_saved: DashboardTopPlace[];
  top_visited: DashboardTopPlace[];
  top_shared: DashboardTopPlace[];
  top_areas: DashboardPctEntry[];
  top_cuisines: DashboardPctEntry[];
  top_filters: DashboardCountEntry[];
}
