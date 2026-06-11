// Gobble Admin — server-side data helpers shared by all section pages.
// Server Components / Server Actions only (uses @/lib/supabase/server).

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminDashboardData,
  FilterCategory,
  FilterOptionRow,
  HoursJson,
  IssueReportRow,
  NotificationRow,
  PlacePhotoRow,
  PlaceRow,
  PlaceWithRelations,
  ProfileRow,
  ReportStatus,
  TbtRow,
} from "@/lib/types";
import { DAY_KEYS } from "@/lib/types";

// ── Auth guard ───────────────────────────────────────────────

export interface AdminSession {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}

/**
 * Re-checks session + admins allowlist. Redirects to /admin/login
 * when either is missing. Use in the (panel) layout and server actions.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/admin/login");
  }

  return { supabase, user };
}

// ── Sidebar / reports ────────────────────────────────────────

export async function getOpenReportCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("issue_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  return count ?? 0;
}

export async function getReports(
  status?: ReportStatus
): Promise<IssueReportRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("issue_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as IssueReportRow[];
}

// ── Places ───────────────────────────────────────────────────

interface PlaceQueryRow extends PlaceRow {
  photos: PlacePhotoRow[];
  place_tags: { filter_options: FilterOptionRow | null }[];
  area: FilterOptionRow | null;
}

export async function getPlacesWithRelations(): Promise<PlaceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(
      "*, photos:place_photos(*), place_tags(filter_options(*)), area:filter_options!places_area_id_fkey(*)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as PlaceQueryRow[]).map(
    ({ photos, place_tags, area, ...place }) => ({
      ...place,
      photos: [...(photos ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      tags: (place_tags ?? [])
        .map((t) => t.filter_options)
        .filter((t): t is FilterOptionRow => t !== null),
      area: area ?? null,
    })
  );
}

// ── Filters & categories ─────────────────────────────────────

export interface FilterOptionWithUsage extends FilterOptionRow {
  /** Places using this option (place_tags for cuisine/vibe, places.area_id for area). */
  usage: number;
}

export type FilterOptionsByCategory = Record<
  FilterCategory,
  FilterOptionWithUsage[]
>;

export async function getFilterOptionsWithUsage(): Promise<FilterOptionsByCategory> {
  const supabase = await createClient();
  const [optionsRes, tagsRes, placesRes] = await Promise.all([
    supabase
      .from("filter_options")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("place_tags").select("filter_option_id"),
    supabase.from("places").select("area_id"),
  ]);
  if (optionsRes.error) throw new Error(optionsRes.error.message);

  const usage = new Map<string, number>();
  for (const tag of (tagsRes.data ?? []) as { filter_option_id: string }[]) {
    usage.set(tag.filter_option_id, (usage.get(tag.filter_option_id) ?? 0) + 1);
  }
  for (const place of (placesRes.data ?? []) as { area_id: string | null }[]) {
    if (place.area_id) {
      usage.set(place.area_id, (usage.get(place.area_id) ?? 0) + 1);
    }
  }

  const grouped: FilterOptionsByCategory = { cuisine: [], vibe: [], area: [] };
  for (const option of (optionsRes.data ?? []) as FilterOptionRow[]) {
    grouped[option.category].push({
      ...option,
      usage: usage.get(option.id) ?? 0,
    });
  }
  return grouped;
}

// ── Users ────────────────────────────────────────────────────

export interface UserWithCounts extends ProfileRow {
  been: number;
  wish: number;
  lists: number;
}

export async function getUsers(): Promise<UserWithCounts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, saved_places(kind), lists(id)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  type ProfileQueryRow = ProfileRow & {
    saved_places: { kind: "been_there" | "wishlist" }[];
    lists: { id: string }[];
  };

  return ((data ?? []) as unknown as ProfileQueryRow[]).map(
    ({ saved_places, lists, ...profile }) => ({
      ...profile,
      been: (saved_places ?? []).filter((s) => s.kind === "been_there").length,
      wish: (saved_places ?? []).filter((s) => s.kind === "wishlist").length,
      lists: (lists ?? []).length,
    })
  );
}

// ── Notifications / To Be Tried ──────────────────────────────

export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}

export async function getTbt(): Promise<TbtRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("to_be_tried")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TbtRow[];
}

// ── Dashboard ────────────────────────────────────────────────

export type DashboardRange = "today" | "week" | "month" | "all";

function rangeToFrom(range: DashboardRange): string {
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    }
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
      return new Date(0).toISOString();
  }
}

export async function getDashboard(
  range: DashboardRange
): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard", {
    p_from: rangeToFrom(range),
  });
  if (error) throw new Error(error.message);
  return data as AdminDashboardData;
}

// ── Pure display helpers ─────────────────────────────────────

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** '2026-01-12T...' → '12 Jan 2026' (prototype date style). */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** 'Today' / 'Yesterday' / 'N days ago' / '1 week ago' / 'N weeks ago'. */
export function relativeLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso);
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.max(
    0,
    Math.round((startOf(now) - startOf(then)) / (24 * 60 * 60 * 1000))
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

/** Public URL for a place-photos storage path. */
export function photoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/${storagePath}`;
}

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** '23:30' → '11:30 PM' (handles past-midnight closes like '01:30'). */
function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${suffix}`;
}

/**
 * Hours jsonb → compact display lines, grouping consecutive days with
 * identical ranges: ['Mon – Sun · 12:00 PM – 11:30 PM']. Closed days
 * are omitted (matching the prototype's hoursText).
 */
export function hoursToText(hours: HoursJson | null): string[] {
  if (!hours) return [];
  const groups: { start: number; end: number; range: string }[] = [];

  DAY_KEYS.forEach((day, i) => {
    const slot = hours[day];
    if (!slot) return;
    const range = `${to12h(slot.open)} – ${to12h(slot.close)}`;
    const last = groups[groups.length - 1];
    if (last && last.end === i - 1 && last.range === range) {
      last.end = i;
    } else {
      groups.push({ start: i, end: i, range });
    }
  });

  return groups.map((g) => {
    const label =
      g.start === g.end
        ? DAY_LABELS[DAY_KEYS[g.start]]
        : `${DAY_LABELS[DAY_KEYS[g.start]]} – ${DAY_LABELS[DAY_KEYS[g.end]]}`;
    return `${label} · ${g.range}`;
  });
}
