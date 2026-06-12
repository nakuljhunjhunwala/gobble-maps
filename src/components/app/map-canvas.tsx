"use client";
// Gobble Maps consumer — real MapLibre + OSM canvas for /map.
// Ports GPin as HTML marker elements (29px head, category Icon, teardrop tail,
// visited/unvisited colour, green been-there check overlay, optional label).
// Loaded via next/dynamic ssr:false from map-screen.

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Icon } from "@/components/icons";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import type { ConsumerPlace } from "@/lib/consumer/types";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      // Clean, minimal light basemap (CARTO Positron) — far less visual noise
      // than raw OSM street tiles, matching the curated-editorial design.
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const DEFAULT_CENTER: [number, number] = [72.8777, 19.076];
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [72.6, 18.8],
  [73.2, 19.4],
];

export interface MapFlyTo {
  lat: number;
  lng: number;
  zoom?: number;
}

export interface MapCanvasProps {
  /** All places to render (already filtered — see deviation). */
  places: ConsumerPlace[];
  /** Ids of places matching the active filters (these are rendered). */
  filteredIds: Set<string>;
  /** Place ids the signed-in user has marked been-there (green check). */
  been: Set<string>;
  /** Show the 9.5px name label below each pin. */
  labels: boolean;
  /** User location to show as a blue pulsing dot, or null. */
  userPos: { lat: number; lng: number } | null;
  onPinClick: (id: string) => void;
  /** Imperative camera move; identity change triggers a flyTo. */
  flyTo: MapFlyTo | null;
}

interface PinHandle {
  marker: maplibregl.Marker;
  root: Root;
}

/** Builds one GPin marker element (head + tail + optional label). */
function buildPinElement(
  place: ConsumerPlace,
  been: boolean,
  showLabel: boolean
): { el: HTMLButtonElement; root: Root } {
  const bg = place.visited ? "var(--gb-deep)" : "#8FA8B5";

  const el = document.createElement("button");
  el.className = "gb-pin";
  el.style.cursor = "pointer";

  const head = document.createElement("span");
  head.className = "gb-pin-head";
  head.style.background = bg;

  const iconMount = document.createElement("span");
  iconMount.style.display = "flex";
  head.appendChild(iconMount);

  if (been) {
    const beenBadge = document.createElement("span");
    beenBadge.className = "gb-pin-been";
    head.appendChild(beenBadge);
  }

  const tail = document.createElement("span");
  tail.className = "gb-pin-tail";
  tail.style.borderTopColor = bg;

  el.appendChild(head);
  el.appendChild(tail);

  if (showLabel) {
    const label = document.createElement("span");
    label.className = "gb-pin-label";
    label.textContent = place.name;
    el.appendChild(label);
  }

  // One React root per pin renders the category icon (and the been check).
  const root = createRoot(iconMount);
  root.render(
    <Icon
      name={GOBBLE_TYPES[place.type].icon}
      size={14}
      color="#fff"
      strokeWidth={2}
    />
  );

  if (been) {
    const badge = el.querySelector(".gb-pin-been");
    if (badge) {
      // Imperatively stamp the check SVG (avoids a second React root to track).
      badge.innerHTML =
        '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" ' +
        'stroke="#fff" stroke-width="3.5" stroke-linecap="round" ' +
        'stroke-linejoin="round" style="display:block"><path d="M4.5 12.5l5 5L19.5 6.5"/></svg>';
    }
  }

  return { el, root };
}

/** Builds the blue user-location dot marker element. */
function buildUserDotElement(): HTMLSpanElement {
  const el = document.createElement("span");
  el.className = "gb-userdot";
  el.style.position = "relative";
  el.style.transform = "none";
  const pulse = document.createElement("span");
  pulse.className = "gb-userdot-pulse";
  el.appendChild(pulse);
  return el;
}

export default function MapCanvas({
  places,
  filteredIds,
  been,
  labels,
  userPos,
  onPinClick,
  flyTo,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinsRef = useRef<Map<string, PinHandle>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  // Init map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: OSM_STYLE,
      center: DEFAULT_CENTER,
      zoom: 11,
      maxBounds: MAX_BOUNDS,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // The container is an absolutely-positioned full-bleed layer that may not
    // have its final size on first paint — resize once layout settles, and on
    // any container resize (orientation / viewport changes).
    const settle = setTimeout(() => map.resize(), 0);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.resize())
        : null;
    ro?.observe(container);

    return () => {
      clearTimeout(settle);
      ro?.disconnect();
      pinsRef.current.forEach((p) => {
        p.marker.remove();
        // Defer unmount to avoid React "synchronously unmount during render".
        const root = p.root;
        setTimeout(() => root.unmount(), 0);
      });
      pinsRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync place markers whenever inputs change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visible = places.filter(
      (p) =>
        filteredIds.has(p.id) &&
        p.lat !== null &&
        p.lng !== null &&
        !p.permanentlyClosed
    );
    const visibleIds = new Set(visible.map((p) => p.id));

    // Remove markers no longer visible.
    pinsRef.current.forEach((handle, id) => {
      if (!visibleIds.has(id)) {
        handle.marker.remove();
        const root = handle.root;
        setTimeout(() => root.unmount(), 0);
        pinsRef.current.delete(id);
      }
    });

    // Rebuild remaining markers (cheap; keeps been/label state correct).
    for (const place of visible) {
      const existing = pinsRef.current.get(place.id);
      if (existing) {
        existing.marker.remove();
        const root = existing.root;
        setTimeout(() => root.unmount(), 0);
        pinsRef.current.delete(place.id);
      }
      const { el, root } = buildPinElement(place, been.has(place.id), labels);
      el.addEventListener("click", () => onPinClickRef.current(place.id));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([place.lng as number, place.lat as number])
        .addTo(map);
      pinsRef.current.set(place.id, { marker, root });
    }
  }, [places, filteredIds, been, labels]);

  // Sync user-location dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userPos) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      // setLngLat MUST precede addTo — maplibre reads the position on add.
      userMarkerRef.current = new maplibregl.Marker({
        element: buildUserDotElement(),
        anchor: "center",
      })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
    }
  }, [userPos]);

  // Imperative camera moves.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom ?? 14 });
  }, [flyTo]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
