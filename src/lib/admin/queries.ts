// Gobble Admin — server-side data helpers shared by all section pages.
// Server Components / Server Actions only (uses @/lib/supabase/server).

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminDashboardData,
  FilterCategory,
  FilterOptionRow,
  IssueReportRow,
  NotificationRow,
  PlacePhotoRow,
  PlaceRow,
  PlaceWithRelations,
  ProfileRow,
  ReportStatus,
  TbtRow,
} from "@/lib/types";

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

/**
 * Non-redirecting admin check for API routes: returns true only when the
 * caller is signed in AND present in the admins allowlist. Unlike
 * requireAdmin this never calls redirect(), so it is safe in route handlers.
 */
export async function isAdminRequest(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return adminRow !== null;
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

// ── Pure display helpers (client-safe, re-exported for server callers) ──
export { formatDate, relativeLastActive, photoUrl, hoursToText } from "./format";
