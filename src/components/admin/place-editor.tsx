"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { placeSchema, type PlaceInput } from "@/lib/admin/schemas";
import {
  DAY_KEYS,
  type DayKey,
  type FilterOptionRow,
  type PlaceType,
  type PlaceWithRelations,
} from "@/lib/types";
import type { FilterOptionsByCategory } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";
import { extractCoords } from "@/lib/maps-coords";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { IconButton } from "@/components/admin/icon-button";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { PLACE_TYPES } from "@/components/admin/place-preview";
import { upsertPlace } from "@/app/admin/(panel)/places/actions";
import { addOption } from "@/app/admin/(panel)/filters/actions";

interface AreaOption {
  id: string;
  label: string;
}

/** "+ Add new area…" sentinel value for the Area <select>. */
const CUSTOM_AREA = "__custom__";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => <div style={{ height: 220 }} />,
});

type PlaceFormValues = z.input<typeof placeSchema>;

export interface PlacePrefill {
  /** Originating To Be Tried row id — retired once the place saves. */
  tbtId: string | null;
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
  /**
   * Ask to mark the place permanently closed (existing place only). The parent
   * owns the confirm dialog + toast wiring; the editor closes on confirm.
   */
  onMarkClosed?: (place: PlaceWithRelations, afterClose: () => void) => void;
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
export function PlaceEditor({
  place,
  prefill,
  filters,
  onClose,
  onMarkClosed,
}: PlaceEditorProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  // For NEW places the id is generated client-side BEFORE the first photo
  // upload so storage paths and the eventual row share the same id.
  const placeId = useMemo(() => place?.id ?? crypto.randomUUID(), [place]);
  const [photoPaths, setPhotoPaths] = useState<string[]>(
    () => place?.photos.map((p) => p.storage_path) ?? []
  );
  // Paths that were already persisted when the editor opened — these must NOT
  // be cleaned up on cancel. Anything uploaded THIS session that never reaches
  // the DB (cancel/close without a successful save) is an orphan to remove.
  const persistedPaths = useRef<Set<string>>(
    new Set(place?.photos.map((p) => p.storage_path) ?? [])
  );
  const savedRef = useRef(false);

  // On cancel/close without a successful save, delete this session's uploads
  // from storage (fire-and-forget) so they don't orphan. UX is unchanged.
  // skipCleanup leaves uploads in place — used when marking closed, so a
  // curator who uploaded photos then marked closed is not surprised.
  const handleClose = (skipCleanup = false) => {
    if (!savedRef.current && !skipCleanup) {
      const orphans = photoPaths.filter((p) => !persistedPaths.current.has(p));
      if (orphans.length > 0) {
        void createClient().storage.from("place-photos").remove(orphans);
      }
    }
    onClose();
  };
  const [mustTryText, setMustTryText] = useState(
    () => (place?.must_try ?? []).join("\n")
  );
  const [reels, setReels] = useState<string[]>(() => place?.reels ?? []);

  // Area options: server list, plus any area added inline this session.
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>(() =>
    filters.area.map((a) => ({ id: a.id, label: a.label }))
  );
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaLabel, setNewAreaLabel] = useState("");

  // Location search (address / Google Maps link / lat,lng).
  const [locQuery, setLocQuery] = useState("");
  const [locSearching, startLocSearch] = useTransition();
  const [locError, setLocError] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [addrSuggest, setAddrSuggest] = useState<{
    address: string | null;
    area: string | null;
  } | null>(null);

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
        zomato: place.zomato ?? "",
        swiggy: place.swiggy ?? "",
        hours: { ...CLOSED_WEEK, ...place.hours },
        meals: place.meals,
        tagIds: place.tags.map((t) => t.id),
        visited: place.visited,
        foodRating: place.food_rating ?? 8,
        serviceRating: place.service_rating ?? 8,
        ambienceRating: place.ambience_rating ?? 8,
        mustTry: place.must_try ?? [],
        reels: place.reels ?? [],
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
      zomato: "",
      swiggy: "",
      hours: defaultHours(),
      meals: ["dinner"],
      tagIds: [],
      visited: prefill ? true : false,
      foodRating: 8,
      serviceRating: 8,
      ambienceRating: 8,
      mustTry: [],
      reels: [],
      curatorNote: prefill?.note ?? "",
      bestTime: "",
      liveMusic: false,
      boardGames: false,
      pureVeg: false,
      intendedStatus: "draft",
      photoCount: 0,
    };
  }, [place, prefill, filters]);

  const { register, handleSubmit, watch, setValue, getValues } = useForm<
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
  const foodRating = watch("foodRating") ?? 8;
  const serviceRating = watch("serviceRating") ?? 8;
  const ambienceRating = watch("ambienceRating") ?? 8;
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

  const setReel = (index: number, value: string) => {
    setReels((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const removeReel = (index: number) => {
    setReels((prev) => prev.filter((_, i) => i !== index));
  };

  const addReel = () => {
    setReels((prev) => [...prev, ""]);
  };

  const cuisineCount = filters.cuisine.filter((o) => tagIds.includes(o.id)).length;
  const vibeCount = filters.vibe.filter((o) => tagIds.includes(o.id)).length;

  const applyLocation = (newLat: number, newLng: number) => {
    setValue("lat", newLat);
    setValue("lng", newLng);
    setFlyTo({ lat: newLat, lng: newLng });
    // Fire-and-forget reverse geocode to suggest an address/area.
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/resolve-location?reverse=1&lat=${newLat}&lng=${newLng}`
        );
        if (!res.ok) {
          setAddrSuggest(null);
          return;
        }
        const data = (await res.json()) as
          | { address: string | null; area: string | null }
          | { error: string };
        setAddrSuggest("error" in data ? null : data);
      } catch {
        setAddrSuggest(null);
      }
    })();
  };

  const runLocationSearch = () => {
    const text = locQuery.trim();
    if (!text) return;
    setLocError(false);

    const coords = extractCoords(text);
    if (coords) {
      applyLocation(coords.lat, coords.lng);
      return;
    }

    if (/^https?:\/\//i.test(text)) {
      startLocSearch(async () => {
        try {
          const res = await fetch(
            `/api/admin/resolve-location?url=${encodeURIComponent(text)}`
          );
          if (!res.ok) {
            setLocError(true);
            return;
          }
          const data = (await res.json()) as
            | { lat: number; lng: number; name?: string }
            | { error: string };
          if ("error" in data) {
            setLocError(true);
            return;
          }
          applyLocation(data.lat, data.lng);
          if (data.name && !(getValues("address") ?? "").trim()) {
            setValue("address", data.name);
          }
        } catch {
          setLocError(true);
        }
      });
      return;
    }

    startLocSearch(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
        if (!res.ok) {
          setLocError(true);
          return;
        }
        const data = (await res.json()) as
          | { lat: number; lng: number }
          | { error: string };
        if ("error" in data) {
          setLocError(true);
          return;
        }
        applyLocation(data.lat, data.lng);
      } catch {
        setLocError(true);
      }
    });
  };

  const useSuggestedAddress = () => {
    if (!addrSuggest?.address) return;
    setValue("address", addrSuggest.address);
    if (addrSuggest.area) {
      const match = areaOptions.find(
        (a) => a.label.toLowerCase() === addrSuggest.area!.toLowerCase()
      );
      if (match) setValue("areaId", match.id);
    }
    setAddrSuggest(null);
  };

  const onAreaSelect = (value: string) => {
    if (value === CUSTOM_AREA) {
      setAddingArea(true);
      return;
    }
    setAddingArea(false);
    setValue("areaId", value || null);
  };

  const submitNewArea = () => {
    const label = newAreaLabel.trim();
    if (!label) return;
    startTransition(async () => {
      const res = await addOption("area", label);
      if (!res.ok) {
        toast(res.error);
        return;
      }
      const opt: FilterOptionRow = res.option;
      setAreaOptions((prev) => [...prev, { id: opt.id, label: opt.label }]);
      setValue("areaId", opt.id);
      setAddingArea(false);
      setNewAreaLabel("");
      toast(`“${opt.label}” added — live in the user filter panel now`);
    });
  };

  const askMarkClosed = () => {
    // Skip orphan-photo cleanup: a curator who uploaded photos then marked the
    // place closed should not have those uploads silently removed.
    if (place && onMarkClosed) onMarkClosed(place, () => handleClose(true));
  };

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
    setValue(
      "reels",
      reels.map((r) => r.trim()).filter(Boolean)
    );
    void handleSubmit(
      (data) => {
        startTransition(async () => {
          const saved = await upsertPlace({
            ...data,
            id: placeId,
            tbtId: prefill?.tbtId ?? undefined,
            photoPaths,
          });
          if (!saved.ok) {
            setErr(saved.error);
            return;
          }
          toast(
            status === "published"
              ? `“${data.name}” published — live on the map & notification queued 🔔`
              : `“${data.name}” saved as draft`
          );
          savedRef.current = true;
          handleClose();
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
    <input
      className="gb-input"
      type="number"
      inputMode="decimal"
      min={1}
      max={10}
      step={0.1}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return;
        // Clamp to 1–10 and keep one decimal.
        const n = Math.min(10, Math.max(1, Number(raw)));
        setValue(field, Math.round(n * 10) / 10);
      }}
    />
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

  // Same as switchRow but wrapped in its own bordered box (feature toggles).
  const boxedSwitch = (label: string, on: boolean, set: (v: boolean) => void) => (
    <div
      style={{
        border: "1px solid var(--gb-line)",
        borderRadius: 12,
        padding: "10px 14px",
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
      onClose={() => handleClose()}
      wide
      footer={
        <>
          {place &&
            place.status !== "permanently_closed" &&
            onMarkClosed && (
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                style={{
                  marginRight: "auto",
                  background: "transparent",
                  color: "#B4514B",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                disabled={pending}
                onClick={askMarkClosed}
              >
                <Icon name="flag" size={14} /> Mark permanently closed
              </button>
            )}
          {err && (
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "#B4514B",
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
            value={addingArea ? CUSTOM_AREA : areaId ?? ""}
            onChange={(e) => onAreaSelect(e.target.value)}
          >
            {areaId == null && <option value="">—</option>}
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
            <option value={CUSTOM_AREA}>+ Add new area…</option>
          </select>
          {addingArea && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input
                className="gb-input"
                placeholder="New area name"
                value={newAreaLabel}
                onChange={(e) => setNewAreaLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitNewArea();
                  }
                }}
              />
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                disabled={pending}
                onClick={submitNewArea}
              >
                Add
              </button>
            </div>
          )}
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
                {"₹".repeat(n)} ({n}/5)
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
        <Field label="Zomato link (optional)">
          <input
            className="gb-input"
            placeholder="https://zomato.com/…"
            {...register("zomato")}
          />
        </Field>
        <Field label="Swiggy link (optional)">
          <input
            className="gb-input"
            placeholder="https://swiggy.com/…"
            {...register("swiggy")}
          />
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
            label={`Photos (${photoPaths.length} of 6)`}
          >
            <PhotoUploader
              placeId={placeId}
              paths={photoPaths}
              onChange={setPhotoPaths}
            />
          </Field>
        </div>

        <div className="ad-span2">
          <Field
            label="Reels (Instagram / YouTube)"
            note="Paste reel/short URLs — shown on the place page."
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {reels.map((reel, i) => {
                const invalid =
                  reel.trim().length > 0 && !/^https?:\/\//i.test(reel.trim());
                return (
                  <div key={i}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <input
                        className="gb-input"
                        placeholder="https://www.instagram.com/reel/…"
                        value={reel}
                        onChange={(e) => setReel(i, e.target.value)}
                      />
                      <IconButton
                        icon="x"
                        title="Remove reel"
                        danger
                        size={14}
                        strokeWidth={2.4}
                        onClick={() => removeReel(i)}
                      />
                    </div>
                    {invalid && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#B4514B",
                        }}
                      >
                        Should start with http(s)://
                      </span>
                    )}
                  </div>
                );
              })}
              <div>
                <button
                  type="button"
                  className="gb-btn gb-btn-sm"
                  onClick={addReel}
                >
                  <Icon name="plus" size={13} strokeWidth={2.6} /> Add reel link
                </button>
              </div>
            </div>
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
          {/* Ratings only apply to personally-visited places. */}
          {visited && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <Field label="Food /10">
                  {ratingSelect("foodRating", foodRating)}
                </Field>
                <Field label="Service /10">
                  {ratingSelect("serviceRating", serviceRating)}
                </Field>
                <Field label="Ambience /10">
                  {ratingSelect("ambienceRating", ambienceRating)}
                </Field>
              </div>
              <p className="ad-sub" style={{ marginTop: -4 }}>
                Average auto-calculated: <strong>{avgRating}/10</strong>
              </p>
            </>
          )}
          {/* Curator content shows on the site whether or not visited. */}
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
        </div>

        <div
          className="ad-span2 ad-grid3"
          style={{ marginBottom: 0, gap: 10 }}
        >
          {boxedSwitch("Pure Veg", pureVeg, (v) => setValue("pureVeg", v))}
          {boxedSwitch("Live Music", liveMusic, (v) => setValue("liveMusic", v))}
          {boxedSwitch("Board Games", boardGames, (v) =>
            setValue("boardGames", v)
          )}
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
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                className="gb-input"
                placeholder="Paste a Google Maps share link, address, or lat,lng"
                value={locQuery}
                onChange={(e) => {
                  setLocQuery(e.target.value);
                  if (locError) setLocError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runLocationSearch();
                  }
                }}
              />
              <button
                type="button"
                className="gb-btn gb-btn-sm"
                disabled={locSearching}
                onClick={runLocationSearch}
              >
                <Icon name="search" size={14} /> Search
              </button>
            </div>
            {locError && (
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#B4514B",
                  margin: "0 0 8px",
                }}
              >
                Couldn’t find that location.
              </p>
            )}
            {addrSuggest?.address && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--gb-mut)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                📍 {addrSuggest.address} —{" "}
                <button
                  type="button"
                  className="gb-link"
                  onClick={useSuggestedAddress}
                >
                  Use
                </button>
              </p>
            )}
            <MapPicker
              lat={lat ?? null}
              lng={lng ?? null}
              flyTo={flyTo}
              onChange={(newLat, newLng) => {
                setValue("lat", newLat);
                setValue("lng", newLng);
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "var(--gb-mut)",
                margin: "6px 0 0",
              }}
            >
              Tip: tap the map or drag the pin to set the exact spot.
            </p>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
