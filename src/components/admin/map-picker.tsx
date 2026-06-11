"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

// Mumbai
const DEFAULT_CENTER: [number, number] = [72.8777, 19.076];

export interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Only the initial position matters — the marker owns it afterwards.
  const initialRef = useRef({ lat, lng });

  useEffect(() => {
    if (!containerRef.current) return;

    const { lat: initLat, lng: initLng } = initialRef.current;
    const hasPos = initLat !== null && initLng !== null;
    const center: [number, number] = hasPos
      ? [initLng as number, initLat as number]
      : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center,
      zoom: hasPos ? 14 : 11,
    });

    const marker = new maplibregl.Marker({ draggable: true, color: "#1D7FB8" })
      .setLngLat(center)
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChangeRef.current(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: 220, borderRadius: 12, overflow: "hidden" }}
    />
  );
}
