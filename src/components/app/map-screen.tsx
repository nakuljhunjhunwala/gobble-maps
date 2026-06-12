"use client";
// Gobble Maps consumer — /map screen (GMapScreen port with a real MapLibre map).
// Top location-search + filter button, removable active-filter chips, legend,
// place-count badge, "Use my location" FAB, FilterSheet wiring, map_open event.

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { useFilters, useUser } from "./providers";
import { FilterSheet } from "./filter-sheet";
import { filterChips, filterPlaces } from "@/lib/consumer/filters";
import { logEvent } from "@/lib/consumer/analytics";
import type { ConsumerPlace } from "@/lib/consumer/types";
import type { MapFlyTo } from "./map-canvas";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="gb-skel" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
  ),
});

interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
}

export interface MapScreenProps {
  places: ConsumerPlace[];
}

export function MapScreen({ places }: MapScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { been } = useUser();
  const { filters, setFilters } = useFilters();

  const [locQuery, setLocQuery] = useState("");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<MapFlyTo | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Fire map_open once per mount.
  useEffect(() => {
    void logEvent("map_open");
  }, []);

  const visible = useMemo(() => filterPlaces(places, filters), [places, filters]);
  const filteredIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);
  const chips = useMemo(() => filterChips(filters), [filters]);

  const removeChip = (chip: (typeof chips)[number]) => {
    setFilters((f) => {
      const next = { ...f };
      switch (chip.group) {
        case "cuisine":
        case "vibe":
        case "area":
          next[chip.group] = (f[chip.group] as string[]).filter(
            (v) => v !== chip.value
          );
          break;
        case "type":
          next.type = f.type.filter((v) => v !== chip.value);
          break;
        case "budget":
          next.budget = f.budget.filter((v) => v !== chip.value);
          break;
        case "openNow":
          next.openNow = false;
          break;
        case "liveMusic":
        case "boardGames":
        case "pureVeg":
          next[chip.group] = "Any";
          break;
      }
      return next;
    });
  };

  // Debounced (500ms) location geocode.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runGeocode = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    void (async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          toast("Couldn't find that place in Mumbai");
          return;
        }
        const data = (await res.json()) as GeocodeResult;
        setUserPos(null);
        setFlyTo({ lat: data.lat, lng: data.lng, zoom: 14 });
        toast(`Map centred on "${data.name}"`);
      } catch {
        toast("Couldn't find that place in Mumbai");
      }
    })();
  };

  const onLocChange = (value: string) => {
    setLocQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;
    debounceRef.current = setTimeout(() => runGeocode(value), 500);
  };

  const onLocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runGeocode(locQuery);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast("Couldn't find that place in Mumbai");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(next);
        setFlyTo({ ...next, zoom: 15 });
        toast("Centred on your location");
      },
      () => {
        toast("Couldn't find that place in Mumbai");
      }
    );
  };

  return (
    <div className="gb-screen gb-map-screen" data-screen-label="Map">
      {/* full-bleed map fills the shell */}
      <div className="gb-map-canvas">
        <MapCanvas
          places={places}
          filteredIds={filteredIds}
          been={been}
          labels={false}
          userPos={userPos}
          onPinClick={(id) => router.push("/place/" + id)}
          flyTo={flyTo}
        />
      </div>

      {/* floating location controls (search + filter, active chips) */}
      <div className="gb-map-controls">
        <div style={{ display: "flex", gap: 8 }}>
          <form
            onSubmit={onLocSubmit}
            className="gb-searchbar"
            style={{ cursor: "text", flex: 1, boxShadow: "0 2px 10px rgba(20,49,63,0.14)" }}
          >
            <Icon name="search" size={16} color="var(--gb-mut)" />
            <input
              value={locQuery}
              onChange={(e) => onLocChange(e.target.value)}
              placeholder="Search a Mumbai location…"
              style={{
                border: "none",
                outline: "none",
                background: "none",
                font: "inherit",
                color: "var(--gb-ink)",
                width: "100%",
              }}
            />
          </form>
          <button
            className="gb-iconbtn"
            onClick={() => setFilterOpen(true)}
            style={{ position: "relative", boxShadow: "0 2px 10px rgba(20,49,63,0.14)" }}
          >
            <Icon name="sliders" size={18} color="var(--gb-ink)" />
            {chips.length > 0 && <span className="gb-filter-count">{chips.length}</span>}
          </button>
        </div>
        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {chips.map((c, i) => (
              <button
                key={i}
                className="gb-chip gb-chip-on"
                onClick={() => removeChip(c)}
                style={{ flexShrink: 0 }}
              >
                {c.label} <Icon name="x" size={11} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* place-count badge (bottom-left, above tab bar clearance) */}
      <span className="gb-map-count">{visible.length} places</span>

      {/* 'Use my location' FAB (bottom-right) */}
      <button className="gb-map-locfab" onClick={useMyLocation} aria-label="Use my location">
        <Icon name="nav" size={20} color="var(--gb-deep)" strokeWidth={2} />
      </button>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} places={places} />
    </div>
  );
}
