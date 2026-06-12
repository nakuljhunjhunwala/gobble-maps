"use client";
// Gobble Maps consumer — filter sheet (FR-4), ported from GFilterSheet in
// design/gobble/screens-main.jsx. All 9 groups: Place type, Cuisine, Vibe,
// Budget, Area, Timings (Show all / Open now), Live music / Board games /
// Pure veg tri-states. Cuisine/Vibe/Area options come from filter_options
// via FiltersProvider; applies to the shared filters context and fires a
// filter_apply analytics event for each newly-added selection.

import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { GSheet } from "./sheet";
import { useFilters } from "./providers";
import { logEvent } from "@/lib/consumer/analytics";
import {
  EMPTY_FILTERS,
  filterChips,
  filterPlaces,
  type FilterChip,
  type FiltersState,
  type TriState,
} from "@/lib/consumer/filters";
import { GOBBLE_TYPES, PLACE_TYPE_KEYS } from "@/lib/consumer/place-types";
import type { ConsumerPlace } from "@/lib/consumer/types";

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  /** Full published-places payload — drives the live result count. */
  places: ConsumerPlace[];
}

const BUDGET_OPTIONS = [1, 2, 3, 4, 5];

type TriKey = "liveMusic" | "boardGames" | "pureVeg";

/** Group prefixes for analytics labels like 'Vibe: Romantic'. */
const ANALYTICS_PREFIX: Partial<Record<FilterChip["group"], string>> = {
  cuisine: "Cuisine",
  type: "Place type",
  vibe: "Vibe",
  budget: "Budget",
  area: "Area",
};

function analyticsLabel(chip: FilterChip): string {
  const prefix = ANALYTICS_PREFIX[chip.group];
  // openNow → 'Open now'; tri-states are already prefixed ('Live music: Yes').
  return prefix ? `${prefix}: ${chip.label}` : chip.label;
}

function toggled<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FilterSheet({ open, onClose, places }: FilterSheetProps) {
  const { filters, setFilters, options } = useFilters();
  const [draft, setDraft] = useState<FiltersState>(filters);

  // Re-seed the draft from the applied filters whenever the sheet opens
  // (render-time state sync instead of setState inside an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setDraft(filters);
  }

  if (!open) return null;

  const count = filterPlaces(places, draft).length;

  const apply = () => {
    const before = new Set(
      filterChips(filters).map((c) => `${c.group}:${String(c.value)}`)
    );
    for (const chip of filterChips(draft)) {
      if (!before.has(`${chip.group}:${String(chip.value)}`)) {
        void logEvent("filter_apply", null, { filter: analyticsLabel(chip) });
      }
    }
    setFilters(draft);
    onClose();
  };

  const chipGroup = <T extends string | number>(
    selected: T[],
    opts: T[],
    onToggle: (v: T) => void,
    labelFn?: (v: T) => ReactNode
  ) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {opts.map((o) => (
        <button
          key={String(o)}
          className={"gb-chip" + (selected.includes(o) ? " gb-chip-on" : "")}
          onClick={() => onToggle(o)}
        >
          {labelFn ? labelFn(o) : o}
        </button>
      ))}
    </div>
  );

  const triRow = (label: string, icon: IconName, key: TriKey) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--gb-ink)",
        }}
      >
        <Icon name={icon} size={16} color="var(--gb-mut)" /> {label}
      </span>
      <div className="gb-seg">
        {(["Any", "Yes", "No"] as TriState[]).map((v) => (
          <button
            key={v}
            className={draft[key] === v ? "gb-seg-on" : ""}
            onClick={() => setDraft((d) => ({ ...d, [key]: v }))}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <GSheet onClose={onClose} maxH="84%">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 20px 12px",
        }}
      >
        <h3 className="gb-h2" style={{ fontSize: 20 }}>
          Filters
        </h3>
        <button className="gb-link" onClick={() => setDraft(EMPTY_FILTERS)}>
          Clear all
        </button>
      </div>
      <div
        style={{
          overflowY: "auto",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div className="gb-fgroup">
          <p className="gb-flabel">Place type</p>
          {chipGroup(
            draft.type,
            PLACE_TYPE_KEYS,
            (t) => setDraft((d) => ({ ...d, type: toggled(d.type, t) })),
            (t) => (
              <>
                <Icon name={GOBBLE_TYPES[t].icon} size={13} strokeWidth={1.9} />
                {GOBBLE_TYPES[t].label}
              </>
            )
          )}
        </div>
        <div className="gb-fgroup">
          <p className="gb-flabel">Cuisine</p>
          {chipGroup(draft.cuisine, options.cuisine, (c) =>
            setDraft((d) => ({ ...d, cuisine: toggled(d.cuisine, c) }))
          )}
        </div>
        <div className="gb-fgroup">
          <p className="gb-flabel">Vibe</p>
          {chipGroup(draft.vibe, options.vibe, (v) =>
            setDraft((d) => ({ ...d, vibe: toggled(d.vibe, v) }))
          )}
        </div>
        <div className="gb-fgroup">
          <p className="gb-flabel">Budget</p>
          {chipGroup(
            draft.budget,
            BUDGET_OPTIONS,
            (n) => setDraft((d) => ({ ...d, budget: toggled(d.budget, n) })),
            (n) => "★".repeat(n)
          )}
        </div>
        <div className="gb-fgroup">
          <p className="gb-flabel">Area</p>
          {chipGroup(draft.area, options.area, (a) =>
            setDraft((d) => ({ ...d, area: toggled(d.area, a) }))
          )}
        </div>
        <div className="gb-fgroup">
          <p className="gb-flabel">Timings</p>
          <div className="gb-seg" style={{ alignSelf: "flex-start" }}>
            {(
              [
                ["Show all", false],
                ["Open now", true],
              ] as [string, boolean][]
            ).map(([l, v]) => (
              <button
                key={l}
                className={draft.openNow === v ? "gb-seg-on" : ""}
                onClick={() => setDraft((d) => ({ ...d, openNow: v }))}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="gb-fgroup" style={{ gap: 14 }}>
          {triRow("Live music", "music", "liveMusic")}
          {triRow("Board games", "dice", "boardGames")}
          {triRow("Pure veg", "leaf", "pureVeg")}
        </div>
        <div style={{ height: 4 }}></div>
      </div>
      <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--gb-line)" }}>
        <button className="gb-btn" style={{ width: "100%" }} onClick={apply}>
          Show {count} {count === 1 ? "place" : "places"}
        </button>
      </div>
    </GSheet>
  );
}
