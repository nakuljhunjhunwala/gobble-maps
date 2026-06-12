"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearSession, getSession, requireValidUser } from "./session";
import type { ConsumerUser } from "./auth-actions";

// ── Types ────────────────────────────────────────────────────

export type SavedKind = "been_there" | "wishlist";

export interface ConsumerList {
  id: string;
  name: string;
  isPublic: boolean;
  shareSlug: string | null;
  placeIds: string[];
}

export interface MyData {
  user: ConsumerUser;
  been: string[];
  wish: string[];
  lists: ConsumerList[];
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const LOGIN_REQUIRED = { ok: false, error: "login_required" } as const;
const GENERIC_ERROR = {
  ok: false,
  error: "Something went wrong — please try again.",
} as const;

// ── Helpers ──────────────────────────────────────────────────

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "list";
}

function randomSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[bytes[i] % chars.length];
  return out;
}

/** Returns the list row when it exists AND belongs to the session user. */
async function ownedList(
  admin: ReturnType<typeof createAdminClient>,
  listId: string,
  userId: string
): Promise<{
  id: string;
  name: string;
  is_public: boolean;
  share_slug: string | null;
} | null> {
  const { data } = await admin
    .from("lists")
    .select("id, name, is_public, share_slug")
    .eq("id", listId)
    .eq("user_id", userId)
    .maybeSingle<{
      id: string;
      name: string;
      is_public: boolean;
      share_slug: string | null;
    }>();
  return data ?? null;
}

// ── Actions ──────────────────────────────────────────────────

export async function getMyData(): Promise<MyData | null> {
  // Read path must agree with the write path: a version-stale cookie (after a
  // PIN change / legacy format) reads as logged-out so the UI shows guest
  // state and re-prompts, rather than appearing logged in while every
  // mutation silently fails.
  const session = await getSession();
  if (!session) return null;
  const userId = session.userId;

  const admin = createAdminClient();
  const [profileRes, savedRes, listsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, mobile, notif_opt_in, token_version")
      .eq("id", userId)
      .maybeSingle<{
        id: string;
        username: string;
        mobile: string | null;
        notif_opt_in: boolean;
        token_version: number;
      }>(),
    admin
      .from("saved_places")
      .select("place_id, kind, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("lists")
      .select("id, name, is_public, share_slug, created_at, list_places(place_id, created_at)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data;
  // Stale token version (PIN changed elsewhere / legacy cookie) → treat as
  // logged out; clear the dead cookie so the next render is clean guest state.
  if (!profile || profile.token_version !== session.ver) {
    await clearSession();
    return null;
  }

  const saved = (savedRes.data ?? []) as {
    place_id: string;
    kind: SavedKind;
  }[];

  const lists = ((listsRes.data ?? []) as {
    id: string;
    name: string;
    is_public: boolean;
    share_slug: string | null;
    list_places: { place_id: string; created_at: string }[] | null;
  }[]).map((l) => ({
    id: l.id,
    name: l.name,
    isPublic: l.is_public,
    shareSlug: l.share_slug,
    placeIds: (l.list_places ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((lp) => lp.place_id),
  }));

  return {
    user: {
      id: profile.id,
      username: profile.username,
      mobile: profile.mobile,
      notifOptIn: profile.notif_opt_in,
    },
    been: saved.filter((s) => s.kind === "been_there").map((s) => s.place_id),
    wish: saved.filter((s) => s.kind === "wishlist").map((s) => s.place_id),
    lists,
  };
}

export async function toggleSaved(
  placeId: string,
  kind: SavedKind
): Promise<ActionResult & { saved?: boolean }> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("saved_places")
    .select("place_id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .eq("kind", kind)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("saved_places")
      .delete()
      .eq("user_id", userId)
      .eq("place_id", placeId)
      .eq("kind", kind);
    if (error) return GENERIC_ERROR;
    return { ok: true, saved: false };
  }

  const { error } = await admin
    .from("saved_places")
    .insert({ user_id: userId, place_id: placeId, kind });
  if (error) return GENERIC_ERROR;

  await admin.from("analytics_events").insert({
    event_type: "place_save",
    user_id: userId,
    place_id: placeId,
    metadata: { kind },
  });

  return { ok: true, saved: true };
}

export async function createList(
  name: string
): Promise<ActionResult & { list?: ConsumerList }> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return GENERIC_ERROR;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lists")
    .insert({ user_id: userId, name: trimmed })
    .select("id, name, is_public, share_slug")
    .single<{
      id: string;
      name: string;
      is_public: boolean;
      share_slug: string | null;
    }>();
  if (error || !data) return GENERIC_ERROR;

  return {
    ok: true,
    list: {
      id: data.id,
      name: data.name,
      isPublic: data.is_public,
      shareSlug: data.share_slug,
      placeIds: [],
    },
  };
}

export async function deleteList(id: string): Promise<ActionResult> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const list = await ownedList(admin, id, userId);
  if (!list) return GENERIC_ERROR;

  const { error } = await admin
    .from("lists")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return GENERIC_ERROR;
  return { ok: true };
}

export async function toggleListPublic(
  id: string
): Promise<ActionResult & { isPublic?: boolean; shareSlug?: string | null }> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const list = await ownedList(admin, id, userId);
  if (!list) return GENERIC_ERROR;

  const isPublic = !list.is_public;
  let shareSlug = list.share_slug;
  if (isPublic && !shareSlug) {
    shareSlug = `${slugify(list.name)}-${randomSuffix()}`;
  }

  const { error } = await admin
    .from("lists")
    .update({ is_public: isPublic, share_slug: shareSlug })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return GENERIC_ERROR;

  return { ok: true, isPublic, shareSlug };
}

export async function addToList(
  listId: string,
  placeId: string
): Promise<ActionResult> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const list = await ownedList(admin, listId, userId);
  if (!list) return GENERIC_ERROR;

  const { error } = await admin
    .from("list_places")
    .upsert(
      { list_id: listId, place_id: placeId },
      { onConflict: "list_id,place_id", ignoreDuplicates: true }
    );
  if (error) return GENERIC_ERROR;
  return { ok: true };
}

export async function removeFromList(
  listId: string,
  placeId: string
): Promise<ActionResult> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const list = await ownedList(admin, listId, userId);
  if (!list) return GENERIC_ERROR;

  const { error } = await admin
    .from("list_places")
    .delete()
    .eq("list_id", listId)
    .eq("place_id", placeId);
  if (error) return GENERIC_ERROR;
  return { ok: true };
}

export async function setNotifOptIn(optIn: boolean): Promise<ActionResult> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ notif_opt_in: optIn })
    .eq("id", userId);
  if (error) return GENERIC_ERROR;
  return { ok: true };
}

export async function submitReport(
  placeId: string,
  placeName: string,
  text: string
): Promise<ActionResult & { username?: string }> {
  const userId = await requireValidUser();
  if (!userId) return LOGIN_REQUIRED;

  const trimmed = text.trim();
  if (!trimmed) return GENERIC_ERROR;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle<{ username: string }>();
  if (!profile) return LOGIN_REQUIRED;

  const { error } = await admin.from("issue_reports").insert({
    place_id: placeId,
    place_name: placeName,
    reporter_username: profile.username,
    text: trimmed,
  });
  if (error) return GENERIC_ERROR;

  revalidatePath("/admin/reports");
  revalidatePath("/admin", "layout");

  return { ok: true, username: profile.username };
}
