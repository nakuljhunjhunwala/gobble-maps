"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { placeSchema, type PlaceInput } from "@/lib/admin/schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type UpsertPlaceInput = PlaceInput & { id?: string };

const BUCKET = "place-photos";

/**
 * Create or update a place (id is client-generated for new places so photo
 * uploads and the row share the same id). Replaces place_tags, and on a
 * draft/new → published transition queues the new_place notification.
 */
export async function upsertPlace(
  input: UpsertPlaceInput
): Promise<ActionResult> {
  const idParsed = z.uuid().optional().safeParse(input.id);
  if (!idParsed.success) {
    return { ok: false, error: "Invalid place id." };
  }
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid place data.",
    };
  }
  const d = parsed.data;

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
    hours: d.hours,
    meals: d.meals,
    visited: d.visited,
    food_rating: d.visited ? (d.foodRating ?? null) : null,
    service_rating: d.visited ? (d.serviceRating ?? null) : null,
    ambience_rating: d.visited ? (d.ambienceRating ?? null) : null,
    must_try: d.visited ? d.mustTry : [],
    curator_note: d.visited ? d.curatorNote || null : null,
    best_time: d.visited ? d.bestTime || null : null,
    live_music: d.liveMusic,
    board_games: d.boardGames,
    pure_veg: d.pureVeg,
    status: d.intendedStatus,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  // Replace place_tags (cuisines + vibes).
  const { error: delTagsError } = await supabase
    .from("place_tags")
    .delete()
    .eq("place_id", id);
  if (delTagsError) {
    return { ok: false, error: delTagsError.message };
  }
  if (d.tagIds.length > 0) {
    const { error: insTagsError } = await supabase.from("place_tags").insert(
      d.tagIds.map((tagId) => ({
        place_id: id,
        filter_option_id: tagId,
      }))
    );
    if (insTagsError) {
      return { ok: false, error: insTagsError.message };
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

  revalidatePath("/admin/places");
  return { ok: true };
}

const photoOrderSchema = z.object({
  placeId: z.uuid(),
  paths: z.array(z.string().min(1).max(300)).max(6),
});

/** Replace place_photos rows for a place with the given paths, in order. */
export async function savePhotoOrder(
  placeId: string,
  paths: string[]
): Promise<ActionResult> {
  const parsed = photoOrderSchema.safeParse({ placeId, paths });
  if (!parsed.success) {
    return { ok: false, error: "Invalid photo data." };
  }

  const { supabase } = await requireAdmin();

  const { error: delError } = await supabase
    .from("place_photos")
    .delete()
    .eq("place_id", parsed.data.placeId);
  if (delError) {
    return { ok: false, error: delError.message };
  }

  if (parsed.data.paths.length > 0) {
    const { error: insError } = await supabase.from("place_photos").insert(
      parsed.data.paths.map((storagePath, i) => ({
        place_id: parsed.data.placeId,
        storage_path: storagePath,
        sort_order: i,
      }))
    );
    if (insError) {
      return { ok: false, error: insError.message };
    }
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
