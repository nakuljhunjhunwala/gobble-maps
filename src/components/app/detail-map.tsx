"use client";
// Gobble Maps consumer — small non-interactive map preview for the place
// detail screen. Renders an OSM raster map centred on the place with a single
// GPin-style HTML marker. Imported dynamically (ssr:false) from place-detail.
// Setup mirrors src/components/admin/map-picker.tsx.

import { useEffect, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import type { PlaceType } from "@/lib/consumer/types";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "@/components/icons";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export interface DetailMapProps {
  lat: number;
  lng: number;
  type: PlaceType;
  visited: boolean;
  been: boolean;
}

export default function DetailMap({
  lat,
  lng,
  type,
  visited,
  been,
}: DetailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [lng, lat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    // GPin marker (ported markup) as an HTML element on a maplibre Marker.
    const bg = visited ? "var(--gb-sky-deep)" : "#9FB3C4";
    const el = document.createElement("button");
    el.className = "gb-pin";
    el.style.cursor = "default";
    el.innerHTML = renderToStaticMarkup(
      <>
        <span className="gb-pin-head" style={{ background: bg }}>
          <Icon
            name={GOBBLE_TYPES[type].icon}
            size={14}
            color="#fff"
            strokeWidth={2}
          />
          {been && (
            <span className="gb-pin-been">
              <Icon name="check" size={8} color="#fff" strokeWidth={3.5} />
            </span>
          )}
        </span>
        <span className="gb-pin-tail" style={{ borderTopColor: bg }} />
      </>
    );

    new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map);

    return () => {
      map.remove();
    };
  }, [lat, lng, type, visited, been]);

  return <div ref={containerRef} style={{ height: 130, width: "100%" }} />;
}
