"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { placeSchema, type PlaceInput } from "@/lib/admin/schemas";
import type { FilterCategory } from "@/lib/types";
import { parseCsv } from "@/lib/admin/csv";
import { csvRowToPlaceInput, splitList } from "@/lib/admin/place-csv";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type UpsertPlaceInput = PlaceInput & {
  id?: string;
  tbtId?: string;
  /** Storage paths for place_photos, in display order. */
  photoPaths?: string[];
};

const BUCKET = "place-photos";

const photoPathsSchema = z.array(z.string().min(1).max(300)).max(6);

/**
 * Create or update a place (id is client-generated for new places so photo
 * uploads and the row share the same id). Replaces place_tags and place_photos,
 * and on a draft/new → published transition queues the new_place notification.
 * Photos are persisted in this same action BEFORE the notification is queued,
 * so a published place can never go live with zero photos while the push fires.
 */
export async function upsertPlace(
  input: UpsertPlaceInput
): Promise<ActionResult> {
  const idParsed = z.uuid().optional().safeParse(input.id);
  if (!idParsed.success) {
    return { ok: false, error: "Invalid place id." };
  }
  const photoPathsParsed = photoPathsSchema.safeParse(input.photoPaths ?? []);
  if (!photoPathsParsed.success) {
    return { ok: false, error: "Invalid photo data." };
  }
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid place data.",
    };
  }
  const d = parsed.data;
  const photoPaths = photoPathsParsed.data;

  const { supabase } = await requireAdmin();
  const id = idParsed.data ?? crypto.randomUUID();

  // Prior status decides whether this publish queues a notification.
  const { data: existing } = await supabase
    .from("places")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error: upsertError } = await supabase.from("places").upsert({
    id,
    name: d.name,
    type: d.type,
    budget: d.budget,
    area_id: d.areaId ?? null,
    station: d.station || null,
    address: d.address || null,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    phone: d.phone || null,
    instagram: d.instagram || null,
    website: d.website || null,
    zomato: d.zomato || null,
    swiggy: d.swiggy || null,
    hours: d.hours,
    meals: d.meals,
    visited: d.visited,
    // Ratings only apply to personally-visited places.
    food_rating: d.visited ? (d.foodRating ?? null) : null,
    service_rating: d.visited ? (d.serviceRating ?? null) : null,
    ambience_rating: d.visited ? (d.ambienceRating ?? null) : null,
    // Curator text always saved — shown regardless of visited.
    must_try: d.mustTry,
    curator_note: d.curatorNote || null,
    best_time: d.bestTime || null,
    live_music: d.liveMusic,
    board_games: d.boardGames,
    pure_veg: d.pureVeg,
    reels: d.reels,
    status: d.intendedStatus,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  // Replace place_tags (cuisines + vibes) WITHOUT a window where existing tags
  // are lost: write the new set first (upsert on the PK), and only after that
  // succeeds delete the tags that are no longer in the new set.
  if (d.tagIds.length > 0) {
    const { error: insTagsError } = await supabase.from("place_tags").upsert(
      d.tagIds.map((tagId) => ({
        place_id: id,
        filter_option_id: tagId,
      })),
      { onConflict: "place_id,filter_option_id" }
    );
    if (insTagsError) {
      return { ok: false, error: insTagsError.message };
    }
  }
  {
    // Select-diff-delete: read existing tag ids, compute the ones not in the
    // new kept set in JS, delete by exact id list. Robust regardless of value
    // contents; an empty kept set still deletes every stale row.
    const { data: existingTags, error: selTagsError } = await supabase
      .from("place_tags")
      .select("filter_option_id")
      .eq("place_id", id);
    if (selTagsError) {
      return { ok: false, error: selTagsError.message };
    }
    const kept = new Set(d.tagIds);
    const staleTagIds = (existingTags ?? [])
      .map((t) => t.filter_option_id)
      .filter((tagId) => !kept.has(tagId));
    if (staleTagIds.length > 0) {
      const { error: delTagsError } = await supabase
        .from("place_tags")
        .delete()
        .eq("place_id", id)
        .in("filter_option_id", staleTagIds);
      if (delTagsError) {
        return { ok: false, error: delTagsError.message };
      }
    }
  }

  // Persist place_photos in this same action (upsert new set on the unique
  // storage_path, then select-diff-delete stale rows) BEFORE queuing any
  // notification — so a publish never goes live with zero photos.
  if (photoPaths.length > 0) {
    const { error: insPhotosError } = await supabase
      .from("place_photos")
      .upsert(
        photoPaths.map((storagePath, i) => ({
          place_id: id,
          storage_path: storagePath,
          sort_order: i,
        })),
        { onConflict: "storage_path" }
      );
    if (insPhotosError) {
      return { ok: false, error: insPhotosError.message };
    }
  }
  {
    const { data: existingPhotos, error: selPhotosError } = await supabase
      .from("place_photos")
      .select("id, storage_path")
      .eq("place_id", id);
    if (selPhotosError) {
      return { ok: false, error: selPhotosError.message };
    }
    const keptPaths = new Set(photoPaths);
    const stalePhotoIds = (existingPhotos ?? [])
      .filter((p) => !keptPaths.has(p.storage_path))
      .map((p) => p.id);
    if (stalePhotoIds.length > 0) {
      const { error: delPhotosError } = await supabase
        .from("place_photos")
        .delete()
        .in("id", stalePhotoIds);
      if (delPhotosError) {
        return { ok: false, error: delPhotosError.message };
      }
    }
  }

  // Draft/new → published: queue the new-place push notification.
  if (d.intendedStatus === "published" && existing?.status !== "published") {
    let areaLabel = "Mumbai";
    if (d.areaId) {
      const { data: area } = await supabase
        .from("filter_options")
        .select("label")
        .eq("id", d.areaId)
        .maybeSingle();
      if (area?.label) areaLabel = area.label;
    }
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { error: notifError } = await supabase.from("notifications").insert({
      type: "new_place",
      message: `🍴 New spot on Gobble Maps! ${d.name} in ${areaLabel} just dropped. Check it out!`,
      place_id: id,
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: count ?? 0,
    });
    if (notifError) {
      return { ok: false, error: notifError.message };
    }
    revalidatePath("/admin/notifications");
  }

  // The place now exists, so the originating To Be Tried row can be retired.
  // (markVisited only flips it to 'visited' so the pipeline entry survives an
  // abandoned editor.)
  const tbtParsed = z.uuid().safeParse(input.tbtId);
  if (tbtParsed.success) {
    await supabase.from("to_be_tried").delete().eq("id", tbtParsed.data);
    revalidatePath("/admin/to-be-tried");
  }

  revalidatePath("/admin/places");
  return { ok: true };
}

/** Remove a single photo: DB row + storage object. */
export async function deletePhoto(
  placeId: string,
  path: string
): Promise<ActionResult> {
  const parsed = z
    .object({ placeId: z.uuid(), path: z.string().min(1).max(300) })
    .safeParse({ placeId, path });
  if (!parsed.success) {
    return { ok: false, error: "Invalid photo data." };
  }

  const { supabase } = await requireAdmin();

  const { error: delError } = await supabase
    .from("place_photos")
    .delete()
    .eq("place_id", parsed.data.placeId)
    .eq("storage_path", parsed.data.path);
  if (delError) {
    return { ok: false, error: delError.message };
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([parsed.data.path]);
  if (storageError) {
    return { ok: false, error: storageError.message };
  }

  revalidatePath("/admin/places");
  return { ok: true };
}

/** Mark a place permanently closed (DB trigger cleans user lists). */
export async function markClosed(placeId: string): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(placeId);
  if (!parsed.success) {
    return { ok: false, error: "Invalid place id." };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("places")
    .update({ status: "permanently_closed" })
    .eq("id", parsed.data);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/places");
  return { ok: true };
}

/** Delete a place forever: row (cascades) + its storage folder. */
export async function deletePlace(placeId: string): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(placeId);
  if (!parsed.success) {
    return { ok: false, error: "Invalid place id." };
  }

  const { supabase } = await requireAdmin();

  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(parsed.data);
  if (files && files.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(files.map((f) => `${parsed.data}/${f.name}`));
  }

  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", parsed.data);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/places");
  return { ok: true };
}

// ── CSV import ───────────────────────────────────────────────

export interface ImportRowError {
  row: number;
  name: string;
  message: string;
}

export type ImportResult =
  | { ok: false; error: string }
  | {
      ok: true;
      created: number;
      updated: number;
      failed: number;
      createdTags: string[];
      errors: ImportRowError[];
    };

/**
 * Bulk create/update places from a CSV (see src/lib/admin/place-csv.ts for the
 * column contract). Rows with a blank `id` are created; a present `id` updates
 * that place. Unknown cuisine/vibe/area labels are auto-created and reported.
 * Photos are never touched (no image import) and NO push notifications fire —
 * this is a bulk operation. Invalid rows are skipped and reported; valid rows
 * still commit.
 */
export async function importPlaces(csvText: string): Promise<ImportResult> {
  const { supabase } = await requireAdmin();

  let matrix: string[][];
  try {
    matrix = parseCsv(csvText);
  } catch {
    return { ok: false, error: "Could not parse the CSV file." };
  }
  if (matrix.length < 2) {
    return { ok: false, error: "CSV has a header but no data rows." };
  }

  const headers = matrix[0].map((h) => h.trim().toLowerCase());
  if (!headers.includes("name") || !headers.includes("type")) {
    return {
      ok: false,
      error: "CSV must include at least 'name' and 'type' columns.",
    };
  }

  const records = matrix.slice(1).map((cols) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = cols[i] ?? "";
    });
    return rec;
  });

  // 1. Load all filter_options → case-insensitive label→id maps per category.
  const { data: opts, error: optErr } = await supabase
    .from("filter_options")
    .select("id, category, label, sort_order");
  if (optErr) {
    return { ok: false, error: optErr.message };
  }
  const maps: Record<FilterCategory, Map<string, string>> = {
    cuisine: new Map(),
    vibe: new Map(),
    area: new Map(),
  };
  let maxSort = 0;
  for (const o of (opts ?? []) as {
    id: string;
    category: FilterCategory;
    label: string;
    sort_order: number;
  }[]) {
    maps[o.category].set(o.label.toLowerCase(), o.id);
    if (o.sort_order > maxSort) maxSort = o.sort_order;
  }

  // 2. Collect referenced labels; create the ones that don't exist yet.
  const referenced: Record<FilterCategory, Map<string, string>> = {
    cuisine: new Map(),
    vibe: new Map(),
    area: new Map(),
  };
  for (const rec of records) {
    for (const l of splitList(rec["cuisines"] ?? "")) {
      referenced.cuisine.set(l.toLowerCase(), l);
    }
    for (const l of splitList(rec["vibes"] ?? "")) {
      referenced.vibe.set(l.toLowerCase(), l);
    }
    const area = (rec["area"] ?? "").trim();
    if (area) referenced.area.set(area.toLowerCase(), area);
  }
  const toCreate: { category: FilterCategory; label: string; sort_order: number }[] =
    [];
  for (const category of ["cuisine", "vibe", "area"] as FilterCategory[]) {
    for (const [lower, original] of referenced[category]) {
      if (!maps[category].has(lower)) {
        maxSort += 1;
        toCreate.push({ category, label: original, sort_order: maxSort });
      }
    }
  }
  const createdTags: string[] = [];
  if (toCreate.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from("filter_options")
      .upsert(toCreate, { onConflict: "category,label" })
      .select("id, category, label");
    if (insErr) {
      return {
        ok: false,
        error: `Could not create filter options: ${insErr.message}`,
      };
    }
    for (const o of (inserted ?? []) as {
      id: string;
      category: FilterCategory;
      label: string;
    }[]) {
      maps[o.category].set(o.label.toLowerCase(), o.id);
      createdTags.push(`${o.category}: ${o.label}`);
    }
  }

  const resolve = (category: FilterCategory, label: string) =>
    maps[category].get(label.trim().toLowerCase());

  // 3. Classify create vs update against existing ids.
  const { data: existingRows, error: exErr } = await supabase
    .from("places")
    .select("id");
  if (exErr) {
    return { ok: false, error: exErr.message };
  }
  const existingIds = new Set((existingRows ?? []).map((r) => r.id as string));

  let created = 0;
  let updated = 0;
  const errors: ImportRowError[] = [];

  for (let idx = 0; idx < records.length; idx++) {
    const rec = records[idx];
    const rowNum = idx + 2; // 1-based, accounting for the header row
    const nameForMsg = (rec["name"] ?? "").trim() || `(row ${rowNum})`;

    const raw = csvRowToPlaceInput(rec, resolve);

    const idParsed = z.uuid().optional().safeParse(raw.id);
    if (!idParsed.success) {
      errors.push({
        row: rowNum,
        name: nameForMsg,
        message: "Invalid id — must be a UUID or left blank.",
      });
      continue;
    }
    const parsed = placeSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        row: rowNum,
        name: nameForMsg,
        message: parsed.error.issues[0]?.message ?? "Invalid row.",
      });
      continue;
    }
    const d = parsed.data;
    const id = idParsed.data ?? crypto.randomUUID();
    const isUpdate = existingIds.has(id);

    const { error: upsertError } = await supabase.from("places").upsert({
      id,
      name: d.name,
      type: d.type,
      budget: d.budget,
      area_id: d.areaId ?? null,
      station: d.station || null,
      address: d.address || null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      phone: d.phone || null,
      instagram: d.instagram || null,
      website: d.website || null,
      zomato: d.zomato || null,
      swiggy: d.swiggy || null,
      hours: d.hours,
      meals: d.meals,
      visited: d.visited,
      food_rating: d.visited ? (d.foodRating ?? null) : null,
      service_rating: d.visited ? (d.serviceRating ?? null) : null,
      ambience_rating: d.visited ? (d.ambienceRating ?? null) : null,
      must_try: d.mustTry,
      curator_note: d.curatorNote || null,
      best_time: d.bestTime || null,
      live_music: d.liveMusic,
      board_games: d.boardGames,
      pure_veg: d.pureVeg,
      reels: d.reels,
      status: d.intendedStatus,
      updated_at: new Date().toISOString(),
    });
    if (upsertError) {
      errors.push({ row: rowNum, name: nameForMsg, message: upsertError.message });
      continue;
    }

    // Replace place_tags (upsert new set, then delete stale) — no photos.
    if (d.tagIds.length > 0) {
      const { error: insTagsError } = await supabase.from("place_tags").upsert(
        d.tagIds.map((tagId) => ({ place_id: id, filter_option_id: tagId })),
        { onConflict: "place_id,filter_option_id" }
      );
      if (insTagsError) {
        errors.push({ row: rowNum, name: nameForMsg, message: insTagsError.message });
        continue;
      }
    }
    const { data: existingTags } = await supabase
      .from("place_tags")
      .select("filter_option_id")
      .eq("place_id", id);
    const kept = new Set(d.tagIds);
    const staleTagIds = (existingTags ?? [])
      .map((t) => t.filter_option_id as string)
      .filter((tagId) => !kept.has(tagId));
    if (staleTagIds.length > 0) {
      await supabase
        .from("place_tags")
        .delete()
        .eq("place_id", id)
        .in("filter_option_id", staleTagIds);
    }

    existingIds.add(id);
    if (isUpdate) updated += 1;
    else created += 1;
  }

  revalidatePath("/admin/places");
  return {
    ok: true,
    created,
    updated,
    failed: errors.length,
    createdTags,
    errors,
  };
}
