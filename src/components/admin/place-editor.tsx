"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { placeSchema, type PlaceInput } from "@/lib/admin/schemas";
import {
  DAY_KEYS,
  type DayKey,
  type PlaceType,
  type PlaceWithRelations,
} from "@/lib/types";
import type { FilterOptionsByCategory } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { PLACE_TYPES } from "@/components/admin/place-preview";
import {
  savePhotoOrder,
  upsertPlace,
} from "@/app/admin/(panel)/places/actions";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => <div style={{ height: 220 }} />,
});

type PlaceFormValues = z.input<typeof placeSchema>;

export interface PlacePrefill {
  name: string;
  address: string;
  note: string;
}

export interface PlaceEditorProps {
  /** Existing place to edit, or null when adding a new one. */
  place: PlaceWithRelations | null;
  /** Deep-link prefill from To Be Tried (?new=1) — implies visited=true. */
  prefill: PlacePrefill | null;
  filters: FilterOptionsByCategory;
  onClose: () => void;
}

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DEFAULT_SLOT = { open: "12:00", close: "23:00" };

function defaultHours(): PlaceFormValues["hours"] {
  return {
    mon: { ...DEFAULT_SLOT },
    tue: { ...DEFAULT_SLOT },
    wed: { ...DEFAULT_SLOT },
    thu: { ...DEFAULT_SLOT },
    fri: { ...DEFAULT_SLOT },
    sat: { ...DEFAULT_SLOT },
    sun: { ...DEFAULT_SLOT },
  };
}

const CLOSED_WEEK: PlaceFormValues["hours"] = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
};

const RATING_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** First human-readable message in an RHF errors tree. */
function firstErrorMessage(node: unknown, depth = 0): string | null {
  if (!node || typeof node !== "object" || depth > 3) return null;
  const rec = node as Record<string, unknown>;
  if (typeof rec.message === "string" && rec.message.length > 0) {
    return rec.message;
  }
  for (const [key, value] of Object.entries(rec)) {
    if (key === "ref") continue;
    const found = firstErrorMessage(value, depth + 1);
    if (found) return found;
  }
  return null;
}

// Port of prototype APlaceEditor (wide modal, 2-col ad-form grid).
export function PlaceEditor({ place, prefill, filters, onClose }: PlaceEditorProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  // For NEW places the id is generated client-side BEFORE the first photo
  // upload so storage paths and the eventual row share the same id.
  const placeId = useMemo(() => place?.id ?? crypto.randomUUID(), [place]);
  const [photoPaths, setPhotoPaths] = useState<string[]>(
    () => place?.photos.map((p) => p.storage_path) ?? []
  );
  const [mustTryText, setMustTryText] = useState(
    () => (place?.must_try ?? []).join("\n")
  );

  const defaultValues: PlaceFormValues = useMemo(() => {
    if (place) {
      return {
        name: place.name,
        type: place.type,
        budget: place.budget,
        areaId: place.area_id,
        station: place.station ?? "",
        address: place.address ?? "",
        lat: place.lat,
        lng: place.lng,
        phone: place.phone ?? "",
        instagram: place.instagram ?? "",
        website: place.website ?? "",
        hours: { ...CLOSED_WEEK, ...place.hours },
        meals: place.meals,
        tagIds: place.tags.map((t) => t.id),
        visited: place.visited,
        foodRating: place.food_rating ?? 4,
        serviceRating: place.service_rating ?? 4,
        ambienceRating: place.ambience_rating ?? 4,
        mustTry: place.must_try ?? [],
        curatorNote: place.curator_note ?? "",
        bestTime: place.best_time ?? "",
        liveMusic: place.live_music,
        boardGames: place.board_games,
        pureVeg: place.pure_veg,
        intendedStatus: "draft",
        photoCount: place.photos.length,
      };
    }
    return {
      name: prefill?.name ?? "",
      type: "restaurant",
      budget: 2,
      areaId: filters.area[0]?.id ?? null,
      station: "",
      address: prefill?.address ?? "",
      lat: null,
      lng: null,
      phone: "",
      instagram: "",
      website: "",
      hours: defaultHours(),
      meals: ["dinner"],
      tagIds: [],
      visited: prefill ? true : false,
      foodRating: 4,
      serviceRating: 4,
      ambienceRating: 4,
      mustTry: [],
      curatorNote: prefill?.note ?? "",
      bestTime: "",
      liveMusic: false,
      boardGames: false,
      pureVeg: false,
      intendedStatus: "draft",
      photoCount: 0,
    };
  }, [place, prefill, filters]);

  const { register, handleSubmit, watch, setValue } = useForm<
    PlaceFormValues,
    unknown,
    PlaceInput
  >({
    resolver: zodResolver(placeSchema),
    defaultValues,
  });

  const type = watch("type");
  const areaId = watch("areaId");
  const budget = watch("budget");
  const hours = watch("hours");
  const tagIds = watch("tagIds") ?? [];
  const visited = watch("visited") ?? false;
  const foodRating = watch("foodRating") ?? 4;
  const serviceRating = watch("serviceRating") ?? 4;
  const ambienceRating = watch("ambienceRating") ?? 4;
  const liveMusic = watch("liveMusic") ?? false;
  const boardGames = watch("boardGames") ?? false;
  const pureVeg = watch("pureVeg") ?? false;
  const lat = watch("lat");
  const lng = watch("lng");

  const avgRating =
    Math.round(((foodRating + serviceRating + ambienceRating) / 3) * 10) / 10;

  const setDay = (
    day: DayKey,
    slot: { open: string; close: string } | null
  ) => {
    setValue("hours", { ...hours, [day]: slot });
  };

  const toggleTag = (id: string) => {
    setValue(
      "tagIds",
      tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id]
    );
  };

  const cuisineCount = filters.cuisine.filter((o) => tagIds.includes(o.id)).length;
  const vibeCount = filters.vibe.filter((o) => tagIds.includes(o.id)).length;

  const doSave = (status: "draft" | "published") => {
    setErr("");
    setValue("intendedStatus", status);
    setValue("photoCount", photoPaths.length);
    setValue(
      "mustTry",
      mustTryText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    );
    void handleSubmit(
      (data) => {
        startTransition(async () => {
          const saved = await upsertPlace({ ...data, id: placeId });
          if (!saved.ok) {
            setErr(saved.error);
            return;
          }
          const photos = await savePhotoOrder(placeId, photoPaths);
          if (!photos.ok) {
            setErr(photos.error);
            return;
          }
          toast(
            status === "published"
              ? `“${data.name}” published — live on the map & notification queued 🔔`
              : `“${data.name}” saved as draft`
          );
          onClose();
        });
      },
      (errors) => {
        setErr(firstErrorMessage(errors) ?? "Please check the form.");
      }
    )();
  };

  const ratingSelect = (
    field: "foodRating" | "serviceRating" | "ambienceRating",
    value: number
  ) => (
    <select
      className="gb-input"
      value={value}
      onChange={(e) => setValue(field, Number(e.target.value))}
    >
      {RATING_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );

  const switchRow = (label: string, on: boolean, set: (v: boolean) => void) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <button
        type="button"
        className={cn("gb-switch", on && "gb-switch-on")}
        onClick={() => set(!on)}
      >
        <span></span>
      </button>
    </div>
  );

  return (
    <Modal
      title={place ? `Edit place — ${place.name}` : "Add new place"}
      onClose={onClose}
      wide
      footer={
        <>
          {err && (
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "#B4514B",
                marginRight: "auto",
              }}
            >
              {err}
            </span>
          )}
          <button
            type="button"
            className="gb-btn gb-btn-sm"
            style={{ background: "#EFF3F6", color: "var(--gb-ink)" }}
            disabled={pending}
            onClick={() => doSave("draft")}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="gb-btn gb-btn-sm"
            disabled={pending}
            onClick={() => doSave("published")}
          >
            Publish
          </button>
        </>
      }
    >
      <div className="ad-form">
        <Field label="Name">
          <input className="gb-input" placeholder="e.g. Koyo" {...register("name")} />
        </Field>
        <Field label="Place type">
          <select
            className="gb-input"
            value={type}
            onChange={(e) => setValue("type", e.target.value as PlaceType)}
          >
            {(Object.keys(PLACE_TYPES) as PlaceType[]).map((k) => (
              <option key={k} value={k}>
                {PLACE_TYPES[k].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Area">
          <select
            className="gb-input"
            value={areaId ?? ""}
            onChange={(e) => setValue("areaId", e.target.value || null)}
          >
            {areaId == null && <option value="">—</option>}
            {filters.area.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nearest station">
          <input className="gb-input" {...register("station")} />
        </Field>
        <Field label="Budget">
          <select
            className="gb-input"
            value={budget}
            onChange={(e) => setValue("budget", Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n}/5)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phone">
          <input className="gb-input" placeholder="+91 " {...register("phone")} />
        </Field>
        <Field label="Instagram">
          <input
            className="gb-input"
            placeholder="handle (without @)"
            {...register("instagram")}
          />
        </Field>
        <Field label="Website (optional)">
          <input className="gb-input" {...register("website")} />
        </Field>
        <div className="ad-span2">
          <Field label="Address">
            <input className="gb-input" {...register("address")} />
          </Field>
        </div>

        <div className="ad-span2">
          <Field label="Opening hours">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DAY_KEYS.map((day) => {
                const slot = hours?.[day] ?? null;
                return (
                  <div
                    key={day}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 36,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--gb-mut)",
                        flexShrink: 0,
                      }}
                    >
                      {DAY_LABELS[day]}
                    </span>
                    <input
                      type="time"
                      className="gb-input"
                      style={{ width: 112, padding: "7px 9px", fontSize: 12.5 }}
                      value={slot?.open ?? ""}
                      disabled={!slot}
                      onChange={(e) =>
                        slot && setDay(day, { ...slot, open: e.target.value })
                      }
                    />
                    <span style={{ color: "var(--gb-mut)", fontSize: 12 }}>–</span>
                    <input
                      type="time"
                      className="gb-input"
                      style={{ width: 112, padding: "7px 9px", fontSize: 12.5 }}
                      value={slot?.close ?? ""}
                      disabled={!slot}
                      onChange={(e) =>
                        slot && setDay(day, { ...slot, close: e.target.value })
                      }
                    />
                    <span
                      style={{
                        marginLeft: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "var(--gb-mut)",
                        }}
                      >
                        Closed
                      </span>
                      <button
                        type="button"
                        className={cn("gb-switch", !slot && "gb-switch-on")}
                        onClick={() =>
                          setDay(day, slot ? null : { ...DEFAULT_SLOT })
                        }
                      >
                        <span></span>
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="ad-span2">
          <Field label={`Cuisines (${cuisineCount} selected)`}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filters.cuisine.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={cn("gb-chip", tagIds.includes(o.id) && "gb-chip-on")}
                  style={{ padding: "5px 11px", fontSize: 12 }}
                  onClick={() => toggleTag(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="ad-span2">
          <Field label={`Vibes (${vibeCount} selected)`}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filters.vibe.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={cn("gb-chip", tagIds.includes(o.id) && "gb-chip-on")}
                  style={{ padding: "5px 11px", fontSize: 12 }}
                  onClick={() => toggleTag(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="ad-span2">
          <Field
            label={`Photos (${photoPaths.length} of 6 — minimum 4 to publish)`}
          >
            <PhotoUploader
              placeId={placeId}
              paths={photoPaths}
              onChange={setPhotoPaths}
            />
          </Field>
        </div>

        <div
          className="ad-span2"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "var(--gb-sky-50)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          {switchRow("Personally visited by curator", visited, (v) =>
            setValue("visited", v)
          )}
          {visited && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <Field label="Food /5">
                  {ratingSelect("foodRating", foodRating)}
                </Field>
                <Field label="Service /5">
                  {ratingSelect("serviceRating", serviceRating)}
                </Field>
                <Field label="Ambience /5">
                  {ratingSelect("ambienceRating", ambienceRating)}
                </Field>
              </div>
              <p className="ad-sub" style={{ marginTop: -4 }}>
                Average auto-calculated: <strong>{avgRating}/5</strong>
              </p>
              <Field label="Must-try dishes (one per line)">
                <textarea
                  className="gb-input"
                  rows={3}
                  value={mustTryText}
                  onChange={(e) => setMustTryText(e.target.value)}
                ></textarea>
              </Field>
              <Field label="Curator's note">
                <textarea
                  className="gb-input"
                  rows={2}
                  {...register("curatorNote")}
                ></textarea>
              </Field>
              <Field label="Best time to visit">
                <input className="gb-input" {...register("bestTime")} />
              </Field>
            </>
          )}
        </div>

        <div
          className="ad-span2"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          {switchRow("Pure Veg", pureVeg, (v) => setValue("pureVeg", v))}
          {switchRow("Live Music", liveMusic, (v) => setValue("liveMusic", v))}
          {switchRow("Board Games", boardGames, (v) => setValue("boardGames", v))}
        </div>

        <div className="ad-span2">
          <Field
            label="Location"
            note={
              lat != null && lng != null
                ? `Lat ${lat.toFixed(5)} · Lng ${lng.toFixed(5)}`
                : "Click the map or drag the pin to set the exact location."
            }
          >
            <MapPicker
              lat={lat ?? null}
              lng={lng ?? null}
              onChange={(newLat, newLng) => {
                setValue("lat", newLat);
                setValue("lng", newLng);
              }}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
