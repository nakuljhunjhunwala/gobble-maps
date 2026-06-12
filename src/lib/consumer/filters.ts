// Gobble Maps consumer — pure, client-safe filter state + logic.
// Ports GOBBLE_EMPTY_FILTERS / gobbleApplyFilters / gobbleActiveFilterChips
// from design/gobble/data.js (multi-select OR within a group, AND across
// groups, openNow via isOpenNow, Any/Yes/No tri-states).

import type { PlaceType } from "@/lib/types";
import type { ConsumerPlace } from "./types";
import { GOBBLE_TYPES } from "./place-types";
import { isOpenNow } from "./time";

export type TriState = "Any" | "Yes" | "No";

export interface FiltersState {
  cuisine: string[];
  type: PlaceType[];
  vibe: string[];
  budget: number[];
  area: string[];
  openNow: boolean;
  liveMusic: TriState;
  boardGames: TriState;
  pureVeg: TriState;
}

export const EMPTY_FILTERS: FiltersState = {
  cuisine: [],
  type: [],
  vibe: [],
  budget: [],
  area: [],
  openNow: false,
  liveMusic: "Any",
  boardGames: "Any",
  pureVeg: "Any",
};

const TRI_KEYS = ["liveMusic", "boardGames", "pureVeg"] as const;
const TRI_LABELS: Record<(typeof TRI_KEYS)[number], string> = {
  liveMusic: "Live music",
  boardGames: "Board games",
  pureVeg: "Pure veg",
};

/** One removable chip in the active-filters row (prototype chip shape). */
export interface FilterChip {
  group: keyof FiltersState;
  value: string | number | boolean;
  label: string;
}

/** gobbleActiveFilterChips port — one chip per active selection. */
export function filterChips(f: FiltersState): FilterChip[] {
  const chips: FilterChip[] = [];
  f.cuisine.forEach((v) => chips.push({ group: "cuisine", value: v, label: v }));
  f.type.forEach((v) =>
    chips.push({ group: "type", value: v, label: GOBBLE_TYPES[v].label })
  );
  f.vibe.forEach((v) => chips.push({ group: "vibe", value: v, label: v }));
  f.budget.forEach((v) =>
    chips.push({ group: "budget", value: v, label: "★".repeat(v) })
  );
  f.area.forEach((v) => chips.push({ group: "area", value: v, label: v }));
  if (f.openNow) chips.push({ group: "openNow", value: true, label: "Open now" });
  TRI_KEYS.forEach((k) => {
    if (f[k] !== "Any")
      chips.push({ group: k, value: f[k], label: TRI_LABELS[k] + ": " + f[k] });
  });
  return chips;
}

/** Chip labels for the chip row, e.g. ['Japanese', 'Open now']. */
export function filterChipLabels(f: FiltersState): string[] {
  return filterChips(f).map((c) => c.label);
}

/** Count of active filter selections (badge on the sliders button). */
export function countActive(f: FiltersState): number {
  return filterChips(f).length;
}

/**
 * gobbleApplyFilters port. Permanently closed places never match.
 * OR within a group, AND across groups; openNow checks hours at `now`.
 */
export function filterPlaces(
  places: ConsumerPlace[],
  f: FiltersState,
  now: Date = new Date()
): ConsumerPlace[] {
  return places.filter((p) => {
    if (p.permanentlyClosed) return false;
    if (f.cuisine.length && !f.cuisine.some((c) => p.cuisines.includes(c)))
      return false;
    if (f.type.length && !f.type.includes(p.type)) return false;
    if (f.vibe.length && !f.vibe.some((v) => p.vibes.includes(v))) return false;
    if (f.budget.length && !f.budget.includes(p.budget)) return false;
    if (f.area.length && (!p.area || !f.area.includes(p.area))) return false;
    if (f.openNow && !isOpenNow(p.hours, now)) return false;
    if (f.liveMusic !== "Any" && p.liveMusic !== (f.liveMusic === "Yes"))
      return false;
    if (f.boardGames !== "Any" && p.boardGames !== (f.boardGames === "Yes"))
      return false;
    if (f.pureVeg !== "Any" && p.pureVeg !== (f.pureVeg === "Yes"))
      return false;
    return true;
  });
}
